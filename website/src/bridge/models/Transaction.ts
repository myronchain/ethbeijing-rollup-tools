import { ethers, providers } from 'ethers'
import { EventEmitter } from 'events'
import { Token } from '@/bridge/sdk'
import {
  getTransferSentDetailsFromLogs,
} from '@/bridge/utils'
import { sigHashes } from '@/bridge/hooks/useTransaction'
import Network from './Network'

interface ContructorArgs {
  hash: string
  srcNetwork: Network
  destNetwork?: Network
  isCanonicalTransfer?: boolean
  pending?: boolean
  token?: Token
  timestampMs?: number
  blockNumber?: number
  transferId?: string | null
  pendingDestinationConfirmation?: boolean
  destTxHash?: string
  replaced?: boolean | string
  nonce?: number | undefined
  from?: string | undefined
  to?: string | undefined
}

class Transaction extends EventEmitter {
  readonly hash: string
  readonly srcNetwork: Network
  destNetwork?: Network
  readonly isCanonicalTransfer: boolean = false
  readonly provider: ethers.providers.Provider
  destProvider: ethers.providers.Provider | null = null
  pending = true
  token: Token | null = null
  timestampMs: number
  blockNumber?: number
  status: null | boolean = null
  transferId: string | null = null
  pendingDestinationConfirmation = true
  destTxHash = ''
  replaced: boolean | string = false
  methodName = ''
  nonce?: number | undefined = undefined
  from?: string | undefined = undefined
  to?: string | undefined = undefined

  constructor({
    hash,
    srcNetwork,
    destNetwork,
    isCanonicalTransfer,
    pending = true,
    token,
    timestampMs,
    transferId = null,
    pendingDestinationConfirmation = true,
    destTxHash = '',
    replaced = false,
    nonce,
    from,
    to,
  }: ContructorArgs) {
    super()
    this.hash = (hash || '').trim().toLowerCase()
    this.srcNetwork = srcNetwork

    if (destNetwork) {
      this.destNetwork = destNetwork
      this.pendingDestinationConfirmation = pendingDestinationConfirmation
      this.destProvider = destNetwork.provider
    }

    this.provider = this.srcNetwork.provider
    this.timestampMs = timestampMs || Date.now()
    this.pending = pending
    this.transferId = transferId
    this.replaced = replaced
    this.destTxHash = destTxHash
    this.nonce = nonce
    this.from = from
    this.to = to
    this.token = token || null

    this.getTransaction().then((txResponse: providers.TransactionResponse) => {
      const funcSig = txResponse?.data?.slice(0, 10)
      this.methodName = sigHashes[funcSig]
    })

    this.receipt().then(async (receipt: providers.TransactionReceipt) => {
      const tsDetails = getTransferSentDetailsFromLogs(receipt.logs)
      this.blockNumber = receipt.blockNumber
      const block = await this.provider.getBlock(receipt.blockNumber)
      this.timestampMs = block.timestamp * 1000

      // TODO (eric)
      if (tsDetails?.chainId) {
        // this.destNetworkName = networkIdToSlug(tsDetails.chainId)
        // this.destProvider = getProviderByChainSlug(this.destNetworkName)
      }

      // Source: L2
      if (tsDetails?.transferId) {
        this.transferId = tsDetails.transferId
      }

      this.status = !!receipt.status
      const waitConfirmations = this.srcNetwork.waitConfirmations
      if (waitConfirmations && receipt.status === 1 && receipt.confirmations > waitConfirmations) {
        this.pending = false
      }
      this.emit('pending', false, this)
    })
    if (typeof isCanonicalTransfer === 'boolean') {
      this.isCanonicalTransfer = isCanonicalTransfer
    }
  }

  get explorerLink(): string {
    return this.srcNetwork.explorerUrl
  }

  get destExplorerLink(): string {
    return this.destNetwork!.explorerUrl
  }

  get truncatedHash(): string {
    return `${this.hash.substring(0, 6)}…${this.hash.substring(62, 66)}`
  }

  async receipt() {
    return this.provider.waitForTransaction(this.hash)
  }

  async getTransaction() {
    return this.provider.getTransaction(this.hash)
  }

  toObject() {
    const {
      hash,
      srcNetwork,
      pending,
      timestampMs,
      token,
      destNetwork,
      destTxHash,
      isCanonicalTransfer,
      pendingDestinationConfirmation,
      transferId,
      replaced,
      methodName,
      nonce,
      from,
      to,
    } = this
    return {
      hash,
      srcNetwork: srcNetwork.toObject(),
      pending,
      timestampMs,
      token,
      destNetwork: destNetwork?.toObject(),
      destTxHash,
      isCanonicalTransfer,
      pendingDestinationConfirmation,
      transferId,
      replaced,
      methodName,
      nonce,
      from,
      to,
    }
  }

  static fromObject(obj: any) {
    const {
      hash,
      srcNetwork,
      pending,
      timestampMs,
      token,
      destNetwork,
      destTxHash,
      isCanonicalTransfer,
      pendingDestinationConfirmation,
      transferId,
      replaced,
      nonce,
      from,
      to,
    } = obj
    const destNet = destNetwork && Network.fromObject(destNetwork)
    return new Transaction({
      hash,
      srcNetwork: Network.fromObject(srcNetwork),
      pending,
      timestampMs,
      token,
      destNetwork: destNet,
      destTxHash,
      isCanonicalTransfer,
      pendingDestinationConfirmation,
      transferId,
      replaced,
      nonce,
      from,
      to,
    })
  }
}

export default Transaction
