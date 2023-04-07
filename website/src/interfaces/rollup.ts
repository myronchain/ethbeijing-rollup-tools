export class L1Net {
  name: string
  chain_id?: number
  public_rpc?: string
  publick_ws?: string
  explorer?: string
}

export const LocalL1: L1Net = {
  name: "G1G2DockerDev",
  chain_id: 10400,
  public_rpc: "http://127.0.0.1:10545",
  publick_ws: "ws://127.0.0.1:10546",
  explorer: "http://localhost:4001",
}

export class RollupStatusEvent {
  l1_chain_id: number
  l2_chain_id: number
  l2_block_number: number
  l2_block_hash: string
  block_status: string
  num_txs: number
  final_time: string
  prove_time: string
  l1_finalized_tx_hash: string
  l1_block_number: string
  l1_proved_tx_hash: string
  block_id: number
  prover: string
}

export interface L2FundWallets {
  address: string
  amount: string
}

export interface RollupRequest {
  name: string
  chain_id: number
  l2_wallets: L2FundWallets[]
  beneficial: string
}

export const defaultRollupReq: RollupRequest = {
  name: '',
  chain_id: 10405,
  l2_wallets: [],
  beneficial: ''
}


class Rollup {
  name: string
  l1_rollup: string
  l2_rollup: string
  l1_bridge: string
  l2_bridge: string
  l1_escrow: string
  l2_escrow: string
  l1_addrmgr: string
  l2_addrmgr: string
  l1: string
  chain_id: number
  rpc_url: string
  explorer: string
  uid: string
  id: string
  status: string
  step: number

  toString() {
    return this.name
  }

  static defaultRollup(): Rollup {
    const rollup = new Rollup()
    return rollup
  }
}

export default Rollup
