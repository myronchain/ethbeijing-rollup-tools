#!/bin/sh

set -e

if [ ! -e /data/l1_geth/geth ]; then
    echo 'init l1 geth chain'
    geth init --datadir /data/l1_geth /l1_genesis.json
fi

echo 'import miner account'
geth --datadir /data/l1_geth \
    --allow-insecure-unlock \
    --verbosity 2 \
    --exec 'try { personal.importRawKey("'"$MINER_PRIVATE_KEY"'", null) } catch (e) { if (e.message !== "account already exists") { throw e; } }' console

echo 'starting node...'
geth --datadir /data/l1_geth \
    --networkid 10400 \
    --rpc.txfeecap 0 \
    --syncmode full \
    --gcmode archive \
    --http \
    --http.addr 0.0.0.0 \
    --http.vhosts "*" \
    --http.api debug,eth,net,web3,txpool,miner,admin \
    --http.corsdomain '*' \
    --ws \
    --ws.addr 0.0.0.0 \
    --ws.origins '*' \
    --ws.api debug,eth,net,web3,txpool,miner,admin \
    --allow-insecure-unlock \
    --password /dev/null \
    --unlock "$MINER_ADDRESS" \
    --verbosity 3 \
    --mine
