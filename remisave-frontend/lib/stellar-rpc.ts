import {
  Keypair,
  StrKey,
  nativeToScVal,
  scValToNative,
  xdr,
  Address,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Horizon,
  rpc,
  Account,
} from '@stellar/stellar-sdk';

// Stellar Network Configuration (Testnet)
export const STELLAR_NETWORK = Networks.TESTNET;
export const STELLAR_HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
export const STELLAR_RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
export const RPC_SERVER = new rpc.Server(STELLAR_RPC_URL, { allowHttp: true });

/**
 * Load an account from Horizon
 */
export async function loadAccount(publicKey: string): Promise<Account> {
  const horizon = new Horizon.Server(STELLAR_HORIZON_URL);
  const account = await horizon.loadAccount(publicKey);
  return account;
}

/**
 * Fetch the current ledger sequence from Horizon
 */
export async function getCurrentLedger(): Promise<number> {
  try {
    const response = await fetch(`${STELLAR_HORIZON_URL}`)
    const data = await response.json()
    return data.core_latest_ledger
  } catch (error) {
    console.error('Error fetching current ledger:', error)
    throw new Error('Failed to fetch current ledger')
  }
}

/**
 * Get transaction details from Horizon by hash
 */
export async function getTransactionDetails(txHash: string) {
  try {
    const response = await fetch(
      `${STELLAR_HORIZON_URL}/transactions/${txHash}`
    )
    if (!response.ok) {
      throw new Error(`Transaction not found: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching transaction:', error)
    throw error
  }
}

/**
 * Poll Horizon until a transaction is confirmed
 * Returns transaction details or throws error after timeout
 */
export async function waitForTransactionConfirmation(
  txHash: string,
  maxAttempts = 30,
  delayMs = 1000
): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const tx = await getTransactionDetails(txHash)
      if (tx.id) {
        console.log(`[v0] Transaction confirmed after ${attempt} attempts`)
        return tx
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw new Error(`Transaction ${txHash} not confirmed after ${maxAttempts} attempts`)
      }
    }
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
}

/**
 * Simulate a Soroban contract invocation to get result without executing
 */
export async function simulateSorobanCall(
  sourceAccount: any,
  contractAddress: string,
  method: string,
  args: xdr.ScVal[],
  signers: Keypair[]
): Promise<any> {
  try {
    const account = sourceAccount
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_NETWORK,
    })
      .addOperation(
        Operation.invokeHostFunction({
          func: xdr.HostFunction.hostFunctionTypeInvokeContract(
            new xdr.InvokeContractArgs({
              contractAddress: new Address(contractAddress).toScAddress(),
              functionName: method,
              args: args
            })
          ),
          auth: []
        })
      )
      .setTimeout(300)
      .build()

    // Submit simulation request
    const response = await fetch(`${STELLAR_RPC_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'simulateTransaction',
        params: {
          transaction: tx.toEnvelope().toXDR('base64'),
          resourceLeeway: 15,
        },
      }),
    })

    const result = await response.json()
    if (result.error) {
      throw new Error(`Soroban simulation failed: ${result.error.message}`)
    }
    return result.result
  } catch (error) {
    console.error('Error simulating Soroban call:', error)
    throw error
  }
}

/**
 * Estimate network fees for a transaction
 */
export async function estimateFee(): Promise<string> {
  try {
    const response = await fetch(`${STELLAR_HORIZON_URL}`)
    const data = await response.json()
    return data.base_fee_in_stroops || BASE_FEE
  } catch (error) {
    console.error('Error estimating fee:', error)
    return BASE_FEE
  }
}
