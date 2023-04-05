# G1G2 Protocol Project

Try running some of the following tasks:

## Run test suite

```shell
./runtestsuite.sh
```

## Compile

```shell
yarn install
yarn build
```

## Deploy

```shell
npx hardhat deploy --network <your-network-name> --tags <l1 or l2>
```

## Generate ABI

```shell
yarn gen_abi_for_golang
```

## Generate L2 genesis

```shell
yarn generate:l2genesis
```

## Upgrade L2 predeployed contract

```shell
yarn upgrade:l2 --contract-name <contract-name> --network <network-name>
```

## Test
