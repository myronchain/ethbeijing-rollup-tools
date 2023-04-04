#!/bin/sh

export RUST_LOG=info
# propose
export PROPOSER_PRIV={{.ProposerPriv}}
export PROPOSE_BENEFICIARY_ADDRESS={{.ProposeBeneficiary}}
# sync
export L2_ENGINE_API_RPC_URL={{.L2EngineApiUrl}}
export L2_JWT_SECRET=/jwtSecret
# prover
export PROVER_PRIV={{.ProverPriv}}
# relay
export RELAY_L1_PRIV={{.RelayL1Priv}}
export RELAY_L2_PRIV={{.RelayL2Priv}}
export L1_BRIDGE={{.L1Bridge}}
export L2_BRIDGE={{.L2Bridge}}
export DB_URL={{.RelayDbUrl}}
# common
export L1_RPC_URL={{.L1RpcUrl}}
export L1_WS_URL={{.L1WsUrl}}
export L2_RPC_URL={{.L2RpcUrl}}
export L2_WS_URL={{.L2WsUrl}}
export L1_ROLLUP={{.L1Rollup}}
export L2_ROLLUP={{.L2Rollup}}
export L2_CHAIN_ID={{.ChainId}}
# misc
export PROVER_RPCD_URL=http://prover-rpcd:8545
export PARAMS_PATH=
export CIRCUIT_NAME=
export L2_NODE_CANDIDATES=
# test only
export L1_FAUCET_PRIV={{.L1ContractDeployerPk}}
export L1_ESCROW={{.L1Escrow}}
# change name????
export L2_ROLLUP_INIT={{.RollupStartupPriv}}
export LISTEN=0.0.0.0:9876

#export ENABLE_SYNC_SAVE=true
#export FIREBASE_PROJECT_ID=g1g2-db990
#export FIREBASE_COLLECTION_NAME=tesettest
#export ENABLE_SYNC_SAVE=true
#export FIREBASE_PROJECT_ID=g1g2-db990
#export FIREBASE_COLLECTION_NAME=tesettest
#export TELEMETRY_TRACE_TO_STDOUT=false
#export EXPORT_TELEMETRY_METRIC=true
#export EXPORT_TELEMETRY_METRIC_ENDPOINT=http://host.docker.internal:4317


# $1 is test name, could be rollup_simple or rollup_deposit or something else
cargo test -p consensus $1 -- --nocapture
