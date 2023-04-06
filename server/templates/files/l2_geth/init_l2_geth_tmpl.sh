#!/bin/sh
set -e

if [ ! -e /data/{{.ChainName}}/l2_geth/geth/chaindata ]; then
    echo 'init {{.ChainName}} chain'
    geth init --datadir /data/{{.ChainName}}/l2_geth /l2_genesis.json
fi

echo 'starting node...'
geth --datadir /data/{{.ChainName}}/l2_geth \
    --networkid {{.ChainId}}\
    --syncmode full \
    --txlookuplimit 0 \
    --gcmode archive \
    --miner.gasprice 0 \
    --miner.gaslimit 50000000 \
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
    --verbosity 3 \
