#!/bin/sh
set -e

curl -X POST localhost:8080/api/v1/rollup/g1g2 -H 'Content-Type: application/json' -d '{}'
