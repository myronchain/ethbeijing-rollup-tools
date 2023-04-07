import { providers } from 'ethers'
import Transaction from '@/bridge/models/Transaction'

export function createTransaction(
  tx: Transaction | providers.TransactionResponse,
  srcNetwork,
  destNetwork,
  sourceToken,
  options?: any
) {
  return new Transaction({
    hash: tx.hash,
    srcNetwork,
    destNetwork,
    token: sourceToken,
    pendingDestinationConfirmation: options?.pendingDestinationConfirmation,
    destTxHash: options?.destTxHash,
    nonce: tx.nonce,
    from: tx.from,
    to: tx.to,
  })
}
