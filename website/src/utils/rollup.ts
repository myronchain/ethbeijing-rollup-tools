import Rollup, { L1Net } from '@/interfaces/rollup'
import Network from '@/bridge/models/Network'

export function rollupToL1Network(rollup: Rollup, l1: L1Net): Network {
  return new Network({
    name: l1.name,
    slug: l1.name,
    imageUrl: "/images/bridge/mainnet.svg",
    rpcUrl: l1.public_rpc,
    networkId: l1.chain_id,
    nativeTokenSymbol: "ETH",
    isLayer1: true,
    waitConfirmations: 1,
    explorerUrl: l1.explorer,
    bridgeAddress: rollup.l1_bridge,
    escrowAddress: rollup.l1_escrow,
  })
}

export function rollupToL2Network(rollup: Rollup): Network {

  return new Network({
    name: rollup.name,
    slug: rollup.name,
    imageUrl: "/g1g2.svg", // TODO (eric) need a logo?
    rpcUrl: rollup.rpc_url,
    networkId: rollup.chain_id,
    nativeTokenSymbol: "ETH",
    isLayer1: false,
    waitConfirmations: 1,
    explorerUrl: getL2ExplorerUrl(rollup.name),
    bridgeAddress: rollup.l2_bridge,
    escrowAddress: rollup.l2_escrow,
  })
}

export const L1_EXPLORER_ADDRESS = "http://localhost:4001"

export function getL1TxUrl(txhash: string): string {
  return L1_EXPLORER_ADDRESS + "/tx/" + txhash
}

export function getL2BlockUrl(rollupName: string, block_num: number): string {
  return getL2ExplorerUrl(rollupName) + "/block/" + block_num
}

export function getL2ExplorerUrl(rollupName: string): string {
  return "http://localhost:4002"
}
