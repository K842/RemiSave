import {
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
  TransactionBuilder,
  BASE_FEE,
  Account,
  Horizon,
  rpc,
  Operation,
} from '@stellar/stellar-sdk'
import { STELLAR_NETWORK, STELLAR_HORIZON_URL, STELLAR_RPC_URL, getCurrentLedger } from './stellar-rpc'

export interface VaultState {
  totalDeposits: bigint
  totalShares: bigint
  yieldAccrued: bigint
  manager: string
  paused: boolean
  tvl: bigint
  rate: bigint
}

export interface UserPosition {
  shares: bigint
  amountDeposited: bigint
  lastDepositTime: number
}

const RPC_SERVER = new rpc.Server(STELLAR_RPC_URL, { allowHttp: true })

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

/**
 * Call a read-only contract method via Soroban RPC
 */
async function callContractMethod(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = []
): Promise<any> {
  try {
    // Use a dummy source account for read-only calls
    const sourceAccount = new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0')

    const txBuilder = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_NETWORK,
    })

    txBuilder.addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: new Address(contractId).toScAddress(),
            functionName: method,
            args: args
          })
        ),
        auth: []
      })
    )

    const tx = txBuilder.setTimeout(30).build()
    const response = await withTimeout(RPC_SERVER.simulateTransaction(tx), 30000)

    // Check if response is an error
    if ('error' in response && response.error) {
      throw new Error(`Simulation failed: ${response.error}`)
    }

    // Extract result from successful response
    if ('result' in response && response.result?.retval) {
      return scValToNative(response.result.retval)
    }

    return null
  } catch (error) {
    console.error(`Error calling contract method ${method}:`, error)
    throw error
  }
}

/**
 * Prepare and simulate a transaction for submission
 */
async function prepareTransaction(
  userPublicKey: string,
  sequenceNumber: string,
  contractId: string,
  methodName: string,
  args: xdr.ScVal[]
): Promise<string> {
  try {
    const account = new Account(userPublicKey, sequenceNumber)

    const txBuilder = new TransactionBuilder(account, {
      fee: String(BigInt(BASE_FEE) * BigInt(2)),
      networkPassphrase: STELLAR_NETWORK,
    })

    txBuilder.addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: new Address(contractId).toScAddress(),
            functionName: methodName,
            args: args
          })
        ),
        auth: []
      })
    )

    txBuilder.setTimeout(30)
    const tx = txBuilder.build()
    let txResult;
    try {
      txResult = await RPC_SERVER.prepareTransaction(tx) as any
      return txResult.toEnvelope().toXDR('base64')
    } catch (simError: any) {
      console.error(`Simulation details for ${methodName}:`, simError)
      if (simError.response?.data) {
        console.error('RPC Error Data:', JSON.stringify(simError.response.data, null, 2))
      }
      throw simError
    }
  } catch (error) {
    console.error(`Error preparing ${methodName} transaction:`, error)
    throw error
  }
}

/**
 * Read vault state via Soroban RPC
 */
export async function getVaultState(contractId: string): Promise<VaultState> {
  try {
    const [tvl, rate, totalShares, admin] = await Promise.allSettled([
      callContractMethod(contractId, 'get_tvl'),
      callContractMethod(contractId, 'get_rate'),
      callContractMethod(contractId, 'get_total_shares'),
      callContractMethod(contractId, 'get_admin'),
    ])

    const getValue = (res: PromiseSettledResult<any>) =>
      res.status === 'fulfilled' ? res.value : null

    return {
      totalDeposits: BigInt(getValue(tvl) ?? 0),
      totalShares: BigInt(getValue(totalShares) ?? 0),
      yieldAccrued: BigInt(0),
      manager: String(getValue(admin) ?? ''),
      paused: false,
      tvl: BigInt(getValue(tvl) ?? 0),
      rate: BigInt(getValue(rate) ?? 0),
    }
  } catch (error) {
    console.error('Error getting vault state:', error)
    return {
      totalDeposits: BigInt(0),
      totalShares: BigInt(0),
      yieldAccrued: BigInt(0),
      manager: '',
      paused: false,
      tvl: BigInt(0),
      rate: BigInt(0),
    }
  }
}

/**
 * Read user position in vault
 */
export async function getUserPosition(contractId: string, userPublicKey: string): Promise<UserPosition> {
  try {
    const userAddr = new Address(userPublicKey).toScVal()
    const [shares, value] = await Promise.allSettled([
      callContractMethod(contractId, 'get_user_shares', [userAddr]),
      callContractMethod(contractId, 'get_user_value', [userAddr]),
    ])

    const getVal = (res: PromiseSettledResult<any>) =>
      res.status === 'fulfilled' ? res.value : BigInt(0)

    return {
      shares: BigInt(getVal(shares)),
      amountDeposited: BigInt(getVal(value)),
      lastDepositTime: Math.floor(Date.now() / 1000),
    }
  } catch (error) {
    console.error('Error getting user position:', error)
    return {
      shares: BigInt(0),
      amountDeposited: BigInt(0),
      lastDepositTime: 0,
    }
  }
}

/**
 * Get price per share
 */
export async function getPricePerShare(contractId: string): Promise<bigint> {
  try {
    const pricePerShare = await callContractMethod(contractId, 'get_price_per_share')
    return BigInt(pricePerShare ?? 0)
  } catch (error) {
    console.error('Error getting price per share:', error)
    return BigInt(0)
  }
}

/**
 * Calculate shares received for a given deposit amount
 */
export function calculateSharesReceived(
  depositAmount: bigint,
  totalShares: bigint,
  totalDeposits: bigint
): bigint {
  if (totalDeposits === BigInt(0)) return depositAmount
  return (depositAmount * totalShares) / totalDeposits
}

/**
 * Calculate withdrawal amount for a given shares amount
 */
export function calculateWithdrawalAmount(
  sharesAmount: bigint,
  totalShares: bigint,
  totalDeposits: bigint
): bigint {
  if (totalShares === BigInt(0)) return BigInt(0)
  return (sharesAmount * totalDeposits) / totalShares
}

/**
 * Create an approval transaction for token spending
 */
export async function buildApprovalTransaction(
  userPublicKey: string,
  tokenContractId: string,
  spenderContractId: string,
  amount: bigint,
  sequenceNumber: string
): Promise<string> {
  const currentLedger = await getCurrentLedger()
  const expirationLedger = currentLedger + 100000 // approx 6 days

  const methodArgs: xdr.ScVal[] = [
    new Address(userPublicKey).toScVal(),
    new Address(spenderContractId).toScVal(),
    nativeToScVal(amount, { type: 'i128' }),
    nativeToScVal(expirationLedger, { type: 'u32' }), // expiration_ledger
  ]
  return prepareTransaction(userPublicKey, sequenceNumber, tokenContractId, 'approve', methodArgs)
}

/**
 * Create a deposit transaction
 */
export async function buildDepositTransaction(
  userPublicKey: string,
  vaultContractId: string,
  amount: bigint,
  sequenceNumber: string
): Promise<string> {
  const methodArgs: xdr.ScVal[] = [
    new Address(userPublicKey).toScVal(),
    nativeToScVal(amount, { type: 'i128' }),
  ]
  return prepareTransaction(userPublicKey, sequenceNumber, vaultContractId, 'deposit', methodArgs)
}

/**
 * Create a withdrawal transaction
 */
export async function buildWithdrawalTransaction(
  userPublicKey: string,
  vaultContractId: string,
  sharesAmount: bigint,
  sequenceNumber: string
): Promise<string> {
  const methodArgs: xdr.ScVal[] = [
    new Address(userPublicKey).toScVal(),
    nativeToScVal(sharesAmount, { type: 'i128' }),
  ]
  return prepareTransaction(userPublicKey, sequenceNumber, vaultContractId, 'withdraw', methodArgs)
}

/**
 * Submit a signed transaction to the network
 */
export async function submitTransaction(signedTx: string): Promise<string> {
  try {
    const txObj = TransactionBuilder.fromXDR(signedTx, STELLAR_NETWORK) as any;
    const response = await withTimeout(RPC_SERVER.sendTransaction(txObj), 30000)

    if ('errorResultXdr' in response) {
      throw new Error(`Transaction submission failed: ${response.errorResultXdr}`)
    }

    if ('hash' in response) {
      return response.hash
    }

    return signedTx
  } catch (error) {
    console.error('Error submitting transaction:', error)
    throw error
  }
}