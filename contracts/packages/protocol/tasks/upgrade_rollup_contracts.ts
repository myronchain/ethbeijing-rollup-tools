import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { downloadArtifactsSync, getChainIdByRpcUrl, getDbInstance, shellExec, sleep } from "../src/utils";
import * as types from "hardhat/internal/core/params/argumentTypes";
import * as fs from "fs";

task("upgrade_rollup_contracts", "upgrade l1 and l2 rollup contracts")
  // --l1-rpc-url <l1RpcUrl>
  .addParam("l1RpcUrl", "l1 rpc url", undefined, types.string)
  // --l2-rpc-url <l2RpcUrl>
  .addParam("l2RpcUrl", "l2 rpc url", undefined, types.string)
  // --rollup-version <rollupVersion>
  .addParam("rollupVersion", "rollup version", undefined, types.int)
  // --l1-deployer-private-key <l1DeployPrivateKey>
  .addParam("l1DeployerPrivateKey", "l1 contract deployer private key", undefined, types.string)
  // --l2-deployer-private-key <l2DeployPrivateKey>
  .addParam("l2DeployerPrivateKey", "l2 contract deployer private key", undefined, types.string)
  // --firebase-config <firebaseConfig>
  .addParam("firebaseConfig", "firebase config json", undefined, types.json)
  // --download-artifacts <downloadArtifacts>
  .addOptionalParam("downloadArtifacts", "whether download artifacts or compile source code", undefined, types.boolean)
  .setAction(async function (args: any, hre: HardhatRuntimeEnvironment) {
    await writeDotEnv(args);
    const l1RpcUrl: string = args.l1RpcUrl;
    const l2RpcUrl: string = args.l2RpcUrl;
    const l1ChainId: number = await getChainIdByRpcUrl(l1RpcUrl);
    const l2ChainId: number = await getChainIdByRpcUrl(l2RpcUrl);
    const rollupVersion: number = args.rollupVersion;

    const db = getDbInstance(args.firebaseConfig);
    const rollupContracts = await db.getRollupContracts(l1ChainId, l2ChainId);
    if (!rollupContracts) {
      throw new Error("rollup contracts not deployed yet!");
    }
    console.log(`curVersion:${rollupContracts.Version}, newVersion:${rollupVersion}`);
    if (rollupVersion <= rollupContracts.Version) {
      throw new Error("newVersion should be greater than curVersion!");
    }

    if (args.downloadArtifacts) {
      downloadArtifactsSync(args.rollupVersion);
    } else {
      shellExec("yarn clean && yarn build");
    }

    console.log('upgrade l1 contracts...');
    const upgradeL1Cmd = "npx hardhat upgrade_l1 --network l1"
      + ` --l1-chain-id ${l1ChainId}`
      + ` --l2-chain-id ${l2ChainId}`
      + ` --rollup-version ${rollupVersion}`
      + ` --firebase-config '${JSON.stringify(args.firebaseConfig)}'`;
    shellExec(upgradeL1Cmd);

    console.log('upgrade l2 contracts...');
    const upgradeL2Cmd = "npx hardhat upgrade_l2 --network l2"
      + ` --l1-chain-id ${l1ChainId}`
      + ` --l2-chain-id ${l2ChainId}`
      + ` --rollup-version ${rollupVersion}`
      + ` --firebase-config '${JSON.stringify(args.firebaseConfig)}'`;
    shellExec(upgradeL2Cmd);

    await db.updateRollupVersion(l1ChainId, l2ChainId, rollupVersion);
    console.log("✅", "upgrade rollup contracts success");
  });

async function writeDotEnv(args: any) {
  const { l1RpcUrl, l2RpcUrl, l1DeployerPrivateKey, l2DeployerPrivateKey } = args;
  const dotEnvContent = `
L1_RPC_URL=${l1RpcUrl}
L2_RPC_URL=${l2RpcUrl}
L1_CONTRACT_DEPLOYER_PRIVATE_KEY=${l1DeployerPrivateKey}
L2_CONTRACT_DEPLOYER_PRIVATE_KEY=${l2DeployerPrivateKey}
`.trim()
  console.log(dotEnvContent);
  fs.writeFileSync(".env", dotEnvContent);
  await sleep(3000);
}