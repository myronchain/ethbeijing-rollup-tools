import * as ethers from 'ethers'
import { getProvider } from '@/bridge/utils'

export type Networkish = Network | string | undefined

export type NetworkProps = {
  name: string
  slug: string
  imageUrl: string
  rpcUrl: string
  networkId: number
  nativeTokenSymbol: string
  isLayer1?: boolean
  nativeBridgeUrl?: string
  waitConfirmations?: number
  explorerUrl: string
  bridgeAddress: string
  escrowAddress: string
}

class Network {
  readonly name: string
  readonly slug: string
  readonly imageUrl: string
  readonly provider: ethers.providers.Provider
  readonly rpcUrl: string
  readonly networkId: number
  readonly nativeTokenSymbol: string
  readonly isLayer1: boolean
  readonly nativeBridgeUrl: string | undefined
  readonly waitConfirmations?: number
  readonly explorerUrl: string
  readonly bridgeAddress: string
  readonly escrowAddress: string

  constructor(props: NetworkProps) {
    this.name = props.name
    this.slug = props.slug
    this.imageUrl = props.imageUrl
    this.rpcUrl = props.rpcUrl
    this.provider = getProvider(props.rpcUrl)
    this.networkId = props.networkId
    this.nativeTokenSymbol = props.nativeTokenSymbol
    this.isLayer1 = props.isLayer1 ? props.isLayer1 : false
    this.nativeBridgeUrl = props.nativeBridgeUrl
    this.waitConfirmations = props.waitConfirmations
    this.explorerUrl = props.explorerUrl
    this.bridgeAddress = props.bridgeAddress
    this.escrowAddress = props.escrowAddress
  }

  toString() {
    return this.name
  }

  eq(otherNetwork: Network) {
    return otherNetwork.networkId === this.networkId
  }

  toObject() {
    const {
      name,
      slug,
      imageUrl,
      rpcUrl,
      networkId,
      nativeTokenSymbol,
      isLayer1,
      nativeBridgeUrl,
      waitConfirmations,
      explorerUrl,
      bridgeAddress,
      escrowAddress
    } = this
    return {
      name,
      slug,
      imageUrl,
      rpcUrl,
      networkId,
      nativeTokenSymbol,
      isLayer1,
      nativeBridgeUrl,
      waitConfirmations,
      explorerUrl,
      bridgeAddress,
      escrowAddress,
    }
  }

  static fromObject(obj: any) {
    const {
      name,
      slug,
      imageUrl,
      rpcUrl,
      networkId,
      nativeTokenSymbol,
      isLayer1,
      nativeBridgeUrl,
      waitConfirmations,
      explorerUrl,
      bridgeAddress,
      escrowAddress,
    } = obj
    return new Network({
      name,
      slug,
      imageUrl,
      rpcUrl,
      networkId,
      nativeTokenSymbol,
      isLayer1,
      nativeBridgeUrl,
      waitConfirmations,
      explorerUrl,
      bridgeAddress,
      escrowAddress,
    })
  }
}

export default Network
