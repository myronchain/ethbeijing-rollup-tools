#!/bin/sh
set -e

curl -X POST localhost:8080/api/v1/rollup/g1g2 -H 'Content-Type: application/json' \
 -d '{"name":"ethbeijing","chain_id":10405,"beneficial":"0x4331e30d6d8201319D80f6FdB063Ca376114F203"}'
