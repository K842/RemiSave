import { NextRequest, NextResponse } from 'next/server'
import { RPC_SERVER, loadAccount } from '@/lib/stellar-rpc'
import {
  Keypair,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Account,
  nativeToScVal,
  Address,
  xdr,
  StrKey,
  Operation,
} from '@stellar/stellar-sdk'

/**
 * POST /api/faucet
 * Mints test RST tokens to a provided public key
 *
 * Request body:
 * {
 *   "publicKey": "G...",
 *   "amount": 1000000000 (in stroops, optional, defaults to 1000 RST)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { publicKey, amount } = body

    // Validate public key format
    if (!publicKey || !StrKey.isValidEd25519PublicKey(publicKey)) {
      return NextResponse.json(
        { error: 'Invalid public key format' },
        { status: 400 }
      )
    }

    // Get admin secret from environment
    const adminSecretKey = process.env.ADMIN_SECRET_KEY
    if (!adminSecretKey) {
      return NextResponse.json(
        {
          error: 'Faucet not configured. Set ADMIN_SECRET_KEY environment variable.',
          placeholder: 'SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        },
        { status: 503 }
      )
    }

    // Validate amount (limit to 10000 RST max per request to prevent abuse)
    const mintAmount = amount ? BigInt(amount) : BigInt("1000000000") // Default 1000 RST in stroops (7 decimals)
    const maxAmount = BigInt("10000000000") // 10000 RST
    if (mintAmount > maxAmount) {
      return NextResponse.json(
        { error: `Amount exceeds maximum of 10000 RST` },
        { status: 400 }
      )
    }

    // Create faucet keypair from secret
    const faucetKeypair = Keypair.fromSecret(adminSecretKey)

    // Fetch actual account from Horizon to get correct sequence number
    const adminAccount = await loadAccount(faucetKeypair.publicKey())
    const faucetAccount = new Account(faucetKeypair.publicKey(), adminAccount.sequence)

    // Build mint transaction
    // This would invoke the RST token contract with mint operation
    const tx = new TransactionBuilder(faucetAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.invokeHostFunction({
          func: xdr.HostFunction.hostFunctionTypeInvokeContract(
            new xdr.InvokeContractArgs({
              contractAddress: new Address(process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID || '').toScAddress(),
              functionName: 'mint',
              args: [
                new Address(publicKey).toScVal(),
                nativeToScVal(mintAmount, { type: 'i128' })
              ]
            })
          ),
          auth: []
        })
      )
      .setTimeout(300)
      .build()

    // Sign transaction
    tx.sign(faucetKeypair)

    // In production, submit to network via Soroban RPC
    const txEnvelope = tx.toEnvelope().toXDR('base64')

    // Submit the signed transaction to the Soroban network
    const submitResponse = await RPC_SERVER.sendTransaction(tx)
    // @ts-ignore – response may contain hash directly
    const txHash = submitResponse.hash || submitResponse.result?.hash || ''

    console.log('[v0] Faucet transaction submitted, hash:', txHash)

    return NextResponse.json(
      {
        success: true,
        message: 'Tokens minted successfully',
        publicKey,
        amount: mintAmount.toString(),
        transactionXDR: txEnvelope,
        transactionHash: txHash,
        note: 'Transaction submitted via Soroban RPC',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Faucet error:', error)

    return NextResponse.json(
      {
        error: 'Faucet request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/faucet
 * Returns faucet status and configuration
 */
export async function GET() {
  const configured = !!process.env.ADMIN_SECRET_KEY
  const tokenContractId = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID

  return NextResponse.json({
    status: configured ? 'ready' : 'not-configured',
    configured,
    tokenContractId: tokenContractId ? 'configured' : 'not-configured',
    message: configured
      ? 'Faucet is ready to mint tokens'
      : 'Faucet is not configured. Set ADMIN_SECRET_KEY and NEXT_PUBLIC_TOKEN_CONTRACT_ID env vars.',
  })
}
