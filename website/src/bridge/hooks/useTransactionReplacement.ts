import { useCallback } from 'react'
import { errors, ContractTransaction } from 'ethers'
import useTxHistory from '@/bridge/contexts/AppContext/useTxHistory'
import Transaction from '@/bridge/models/Transaction'
import { getTransferSentDetailsFromLogs } from '@/bridge/utils/logs'

function useTransactionReplacement() {
  const { transactions, addTransaction, updateTransaction } = useTxHistory()

  const waitForTransaction = useCallback(
    async (transaction: ContractTransaction, txModelArgs: any) => {
      if (!transaction) return

      try {
        return await transaction.wait()
      } catch (error: any) {
        console.log(error)
        if (error.code === errors.TRANSACTION_REPLACED) {
          const { replacement, receipt } = error
          console.log(`replacement tx, receipt:`, replacement, receipt)

          // User ran MetaMask "Speed up" feature
          if (!error.cancelled) {
            const tsDetails = getTransferSentDetailsFromLogs(receipt.logs)
            console.log(`replacement tsDetails:`, tsDetails)

            const replacementTxModel = new Transaction({
              ...txModelArgs,
              hash: replacement.hash,
              pendingDestinationConfirmation: true,
              replaced: transaction.hash,
              transferId: tsDetails?.transferId,
            })

            addTransaction(replacementTxModel)

            return {
              originalTx: transaction,
              replacementTxModel,
              replacementTx: replacement,
              replacementReceipt: receipt,
            }
          }
        }
      }
    },
    [transactions, addTransaction]
  )

  return { waitForTransaction, transactions, addTransaction, updateTransaction }
}

export { useTransactionReplacement }
