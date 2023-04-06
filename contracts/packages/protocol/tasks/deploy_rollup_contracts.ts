import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { downloadArtifactsSync, getChainIdByRpcUrl, getDbInstance, shellExec, sleep } from "../src/utils";
import * as types from "hardhat/internal/core/params/argumentTypes";
import fs from "fs";

task("deploy_rollup_contracts", "deploy l1 rollup contracts and generate l2 genesis file")
  // --l1-rpc-url <l1RpcUrl>
  .addParam("l1RpcUrl", "l1 rpc url", undefined, types.string)
  // --l2-chain-id <l2ChainId>
  .addParam("l2ChainId", "l2 chain id", undefined, types.int)
  // --rollup-version <rollupVersion>
  .addParam("rollupVersion", "rollup version", undefined, types.int)
  // --l1-deployer-private-key <l1DeployPrivateKey>
  .addParam("l1DeployerPrivateKey", "l1 contract deployer private key", undefined, types.string)
  // --l2-deployer-address <l2DeployerAddress>
  .addParam("l2DeployerAddress", "l2 contract deployer address", undefined, types.string)
  // --l2-premint-accounts <l2PremintAccounts>
  .addOptionalParam("l2PremintAccounts", "l2 premint accounts json", undefined, types.json)
  // --download-artifacts <downloadArtifacts>
  .addOptionalParam("downloadArtifacts", "whether download artifacts or compile source code", undefined, types.boolean)
  .setAction(async function (args: any, hre: HardhatRuntimeEnvironment) {
    await writeDotEnv(args);
    const l1RpcUrl: string = args.l1RpcUrl;
    const l1ChainId: number = await getChainIdByRpcUrl(l1RpcUrl);
    const db = getDbInstance();
    const rollupContracts = await db.getRollupContracts(l1ChainId, args.l2ChainId);
    if (rollupContracts) {
      console.log(`rollupContracts.Version: ${rollupContracts.Version}, args.rollupVersion: ${args.rollupVersion}`);
      if (args.rollupVersion === rollupContracts.Version) {
        console.log(`rollup contracts of version ${args.rollupVersion} already deployed!`);
        return;
      } else if (args.rollupVersion < rollupContracts.Version) {
        throw Error("rollup contracts of higher version already deployed!");
      } else {
        // args.rollupVersion > rollupContracts.Version
        throw new Error(`latest deployed version is ${rollupContracts.Version}, you can upgrade to version ${args.rollupVersion} using 'upgrade_rollup_contracts' cmd`);
      }
    }

    if (args.downloadArtifacts) {
      downloadArtifactsSync(args.rollupVersion);
    } else {
      shellExec("yarn clean && yarn build");
    }

    let cmd = "npx hardhat deploy_l1 --network l1"
      + ` --l1-chain-id ${l1ChainId}`
      + ` --l2-chain-id ${args.l2ChainId}`
      + ` --rollup-version ${args.rollupVersion}`
      + ` --l2-deployer-address ${args.l2DeployerAddress}`
    if (args.l2PremintAccounts) {
      cmd += ` --l2-premint-accounts '${JSON.stringify(args.l2PremintAccounts)}'`;
    }
    shellExec(cmd);
    console.log("✅", "deploy l1 contracts and generate l2 genesis success!");
  });

async function writeDotEnv(args: any) {
  const { l1RpcUrl, l1DeployerPrivateKey } = args;
  const dotEnvContent = `
L1_RPC_URL=${l1RpcUrl}
L1_CONTRACT_DEPLOYER_PRIVATE_KEY=${l1DeployerPrivateKey}
`.trim();
  console.log(dotEnvContent);
  fs.writeFileSync(".env", dotEnvContent);
  await sleep(3000);
}