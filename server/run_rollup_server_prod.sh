#!/bin/sh
set -e

export WEB3_PROVIDER=https://l1rpc.alpha.byor.cloud
export PRIVATE_KEY=f6be87d3906e7408d4c7ff43086137f058b420fb7a8ddad8afae14c87087e635

git fetch && git rebase origin/main

go run cmd/* rollup server --port 8080  --create-loop --run-loop --status-loop
