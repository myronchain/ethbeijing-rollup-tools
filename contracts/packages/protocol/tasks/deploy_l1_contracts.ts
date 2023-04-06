import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployL1Logics, deployL1Proxies, getDbInstance } from "../src/utils";
import * as types from "hardhat/internal/core/params/argumentTypes";

task('deploy_l1', 'deploy l1 contracts')
  // --l1-chain-id <l1ChainId>
  .addParam("l1ChainId", "l1 chain id", undefined, types.int)
  // --l2-chain-id <l2ChainId>
  .addParam("l2ChainId", "l2 chain id", undefined, types.int)
  // --rollup-version <rollupVersion>
  .addParam("rollupVersion", "rollup version", undefined, types.int)
  // --l2-deployer-address <l2DeployerAddress>
  .addParam("l2DeployerAddress", "l2 contract deployer address", undefined, types.string)
  // --l2-premint-accounts <l2PremintAccounts>
  .addOptionalParam("l2PremintAccounts", "l2 premint accounts", undefined, types.json)
  .setAction(async function (args: any, hre: HardhatRuntimeEnvironment) {
    const db = getDbInstance();
    const newVersionedLogics = await db.getL1VersionedLogics(args.l1ChainId, args.rollupVersion);
    if (!newVersionedLogics) {
      console.log(`l1 logic contracts of version ${args.rollupVersion} not exist, try deploying logics...`);
      await deployL1Logics(hre, db, args.l1ChainId, args.rollupVersion);
    } else {
      console.log(`l1 logic contracts of version ${args.rollupVersion} already deployed, reuse them.`);
    }
    await deployL1Proxies(
      hre,
      db,
      args.l1ChainId,
      args.l2ChainId,
      args.rollupVersion,
      args.l2DeployerAddress,
      args.l2PremintAccounts,
    );
  });
