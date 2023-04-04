#!/bin/sh
set -e

make geth

geth='build/bin/geth'

echo 'start {{.ChainName}} chain'

if [ ! -e /data/{{.ChainName}}/l2_geth/geth/chaindata ]; then
    echo 'init l2 geth chain'
    $geth init --datadir /data/{{.ChainName}}/l2_geth ./deployments/{{.ChainName}}/l2_genesis.json
fi

echo 'starting node... ' /data/{{.ChainName}}/l2_geth
$geth --datadir /data/{{.ChainName}}/l2_geth \
    --syncmode full \
    --txlookuplimit 0 \
    --gcmode archive \
    --miner.gasprice 0 \
    --miner.gaslimit 50000000 \
    --networkid {{.ChainId}} \
    --http \
    --http.addr 0.0.0.0 \
    --http.vhosts "*" \
    --http.api debug,eth,net,web3,txpool,miner,admin,rollup \
    --ws \
    --ws.addr 0.0.0.0 \
    --ws.origins '*' \
    --ws.api debug,eth,net,web3,txpool,miner,admin,rollup \
    --authrpc.addr 0.0.0.0 \
    --authrpc.port 8551 \
    --authrpc.vhosts '*' \
    --allow-insecure-unlock \
    --ipcpath=/tmp/geth.ipc \
    --verbosity 3
