import { TransactionResponse, TransactionReceipt } from '@ethersproject/providers'
import Transaction from '@/bridge/models/Transaction'
import Network from '@/bridge/models/Network'
import range from 'lodash/range'

export const sortByRecentTimestamp = (txs: Transaction[]) => {
  return txs.sort((a, b) => b.timestampMs - a.timestampMs)
}

export function filterByHash(txs: Transaction[] = [], hash = '') {
  return txs.filter(tx => tx.hash !== hash)
}

export function getBlockTagChunks(toBlock: number, numBlocks = 9999, step = 1000) {
  const fromBlocks = range(toBlock - numBlocks, toBlock, step)
  const blockTags = fromBlocks.map(fromBlock => [fromBlock, fromBlock + step - 1])
  return blockTags
}

export async function queryFilterTransferFromL1CompletedEvents(bridge, networkName) {
  const destL2Bridge = await bridge.getL2Bridge(networkName)
  const filter = destL2Bridge.filters.TransferFromL1Completed()

  const blockNumber = await destL2Bridge.provider.getBlockNumber()
  const blockTags = getBlockTagChunks(blockNumber)

  const evs = await Promise.all(
    blockTags.map(([fromBlock, toBlock]) => destL2Bridge.queryFilter(filter, fromBlock, toBlock))
  )
  return evs.flat()
}

export interface Tx {
  networkName?: string
  network?: Network
  txHash?: string

  methodName?: string
  params?: any[]
  completed?: boolean

  response?: TransactionResponse
  receipt?: TransactionReceipt

  confirmations?: number
  networkConfirmations?: number
  explorerLink?: string

  eventName?: string
  eventValues?: any
  datetime?: string
}
