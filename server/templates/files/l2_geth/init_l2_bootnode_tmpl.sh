#!/bin/sh
set -e

if [ ! -e /data/{{.ChainName}}/l2_bootnode/geth/chaindata ]; then
    echo 'init {{.ChainName}} chain'
    geth init --datadir /data/{{.ChainName}}/l2_bootnode /l2_genesis.json
fi

echo 'starting node...'
geth --datadir /data/{{.ChainName}}/l2_bootnode \
    --networkid {{.ChainId}}\
    --syncmode full \
    --gcmode archive \
    --nodiscover \
    --http \
    --http.addr 0.0.0.0 \
    --http.vhosts "*" \
    --http.api debug,eth,net,web3,txpool,miner,admin,rollup \
    --http.corsdomain '*' \
    --ws \
    --ws.addr 0.0.0.0 \
    --ws.origins '*' \
    --ws.api debug,eth,net,web3,txpool,miner,admin,rollup \
    --authrpc.addr 0.0.0.0 \
    --authrpc.port 8551 \
    --authrpc.vhosts '*' \
    --allow-insecure-unlock \
    --nodekeyhex "$BOOTNODE_KEY" \
    --verbosity 3
