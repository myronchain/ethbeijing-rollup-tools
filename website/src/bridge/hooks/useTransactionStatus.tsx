import { useState, useMemo, useEffect, useCallback } from 'react'
import { useApp } from '@/bridge/contexts/AppContext'
import { useInterval } from 'react-use'
import Transaction from '@/bridge/models/Transaction'
import { loadState, saveState } from '@/bridge/utils/localStorage'
import logger from '@/bridge/logger'
import useTxHistory from '@/bridge/contexts/AppContext/useTxHistory'
import { getRecentTransactionsByFromAddress } from '@/bridge/utils/blocks'
import { find } from 'lodash'
import Network from '@/bridge/models/Network'

const useTransactionStatus = (transaction?: Transaction, network?: Network) => {
  const { transactions, updateTransaction } = useTxHistory()
  const [completed, setCompleted] = useState<boolean>(transaction?.pending === false)
  const [networkConfirmations, setNetworkConfirmations] = useState<number>()
  const [confirmations, setConfirmations] = useState<number>()
  const [destCompleted, setDestCompleted] = useState<boolean>(
    transaction?.pendingDestinationConfirmation === false
  )
  const [replaced, setReplaced] = useState<Transaction>()

  const { sdk } = useApp()
  const provider = useMemo(() => {
    if (!network) return
    return network.provider
  }, [network])

  const updateTxStatus = useCallback(async () => {
    if (!provider || !transaction?.hash || !network) {
      setCompleted(false)
      return
    }

    // Return quickly if already completed
    if (completed) {
      return
    }

    const txHash = transaction.hash
    const cacheKey = `txReceipt:${txHash}`

    // Load local storage
    let tx: any = loadState(cacheKey)

    if (!tx) {
      tx = await provider.getTransactionReceipt(txHash)

      if (tx) {
        saveState(cacheKey, tx)
      } else {
        logger.warn(`Could not get tx receipt: ${txHash}`)
      }
    }

    setNetworkConfirmations(network.waitConfirmations)

    const txResponse = await transaction.getTransaction()
    if (!txResponse && transaction.from) {
      const txCount = await provider.getTransactionCount(transaction.from)
      if (transaction.nonce && txCount > transaction.nonce) {
        const matchingTxs = await getRecentTransactionsByFromAddress(provider, transaction.from)
        if (matchingTxs.length) {
          const match = find(matchingTxs, ['nonce', transaction.nonce])
          if (match) {
            return updateTransaction(transaction, {
              hash: match.hash,
              pendingDestinationConfirmation: true,
              replaced: transaction.hash,
            })
          }
        }
        return setReplaced(transaction)
      }
    }

    setConfirmations(txResponse?.confirmations)

    if (network.waitConfirmations && txResponse?.confirmations >= network.waitConfirmations) {
      setCompleted(true)
      updateTransaction(transaction, { pending: false })
    }
  }, [transactions, transaction, provider])

  useEffect(() => {
    if (!completed) {
      updateTxStatus()
    }
  }, [transactions, transaction?.hash, network])

  useInterval(updateTxStatus, completed ? null : 10e3)

  return {
    completed,
    destCompleted,
    confirmations,
    networkConfirmations,
    replaced,
  }
}

export default useTransactionStatus
