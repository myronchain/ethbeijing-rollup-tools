import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployL1Logics, getDbInstance, upgradeL1Contracts } from "../src/utils";
import * as types from "hardhat/internal/core/params/argumentTypes";

task('upgrade_l1', 'deploy l1 contracts')
  // --l1-chain-id <l1ChainId>
  .addParam("l1ChainId", "l1 chain id", undefined, types.int)
  // --l2-chain-id <l2ChainId>
  .addParam("l2ChainId", "l2 chain id", undefined, types.int)
  // --rollup-version <rollupVersion>
  .addParam("rollupVersion", "rollup version", undefined, types.int)
  .setAction(async function (args: any, hre: HardhatRuntimeEnvironment) {
    const db = getDbInstance();
    const curRollupContracts = await db.getRollupContracts(args.l1ChainId, args.l2ChainId);
    const curVersion = curRollupContracts.Version;
    const version = args.rollupVersion;
    console.log(`curVersion: ${curVersion}, version: ${version}`);
    if (version > curVersion) {
      const newVersionedLogics = await db.getL1VersionedLogics(args.l1ChainId, version);
      if (!newVersionedLogics) {
        console.log(`l1 logic contracts of version ${version} not exist, try deploying l1 logics...`);
        await deployL1Logics(hre, db, args.l1ChainId, version);
      } else {
        console.log(`l1 logic contracts of version ${version} already deployed, reuse them.`);
      }
      const curVersionedLogics = await db.getL1VersionedLogics(args.l1ChainId, curVersion);
      console.log("try upgrading l1 contracts...")
      await upgradeL1Contracts(
        hre,
        db,
        curVersionedLogics,
        curRollupContracts.L1Proxies,
        args.l1ChainId,
        version
      );
    }
  });
