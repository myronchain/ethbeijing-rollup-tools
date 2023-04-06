import { HardhatUserConfig } from 'hardhat/config';

import '@nomiclabs/hardhat-ethers';
import "@typechain/hardhat";
import 'hardhat-abi-exporter';

// tasks
import "./tasks";
import dotenv from "dotenv";

dotenv.config();

const L1_RPC_URL = process.env.L1_RPC_URL || "";
const L2_RPC_URL = process.env.L2_RPC_URL || "";
const L1_CONTRACT_DEPLOYER_PRIVATE_KEY = process.env.L1_CONTRACT_DEPLOYER_PRIVATE_KEY;
const L2_CONTRACT_DEPLOYER_PRIVATE_KEY = process.env.L2_CONTRACT_DEPLOYER_PRIVATE_KEY;

const l1Deployer = [];
if (L1_CONTRACT_DEPLOYER_PRIVATE_KEY) l1Deployer.push(L1_CONTRACT_DEPLOYER_PRIVATE_KEY);
const l2Deployer = [];
if (L2_CONTRACT_DEPLOYER_PRIVATE_KEY) l2Deployer.push(L2_CONTRACT_DEPLOYER_PRIVATE_KEY);

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.15',
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
  networks: {
    l1: {
      url: L1_RPC_URL,
      accounts: l1Deployer,
    },
    l2: {
      url: L2_RPC_URL,
      accounts: l2Deployer,
    },
  },
  paths: {
    sources: 'contracts',
    cache: './cache/hardhat',
    artifacts: './artifacts/hardhat',
    tests: './test/hardhat-tests',
  },
};

export default config;
