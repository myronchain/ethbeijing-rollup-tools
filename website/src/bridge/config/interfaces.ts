import { Bridges } from '@/bridge/config/core/types'

export interface IProposalDetail {
  target: string
  functionSig: string
  callData: string
}

export interface HopAddresses {
  tokens: Bridges
}
