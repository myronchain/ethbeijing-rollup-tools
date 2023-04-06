import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  deployL2Logics,
  getDbInstance,
  upgradeL2Contracts,
} from "../src/utils";
import * as types from "hardhat/internal/core/params/argumentTypes";


task("upgrade_l2", "upgrade l2 contracts")
  // --l1-chain-id <l1ChainId>
  .addParam("l1ChainId", "l1 chain id", undefined, types.int)
  // --l2-chain-id <l2ChainId>
  .addParam("l2ChainId", "l2 chain id", undefined, types.int)
  // --rollup-version <rollupVersion>
  .addParam("rollupVersion", "rollup version", undefined, types.int)
  .setAction(async function (args: any, hre: HardhatRuntimeEnvironment) {

    const db = getDbInstance();
    console.log("try upgrading l2 contracts");
    const curRollupContracts = await db.getRollupContracts(args.l1ChainId, args.l2ChainId);
    if (!curRollupContracts) {
      throw new Error(`l2 proxy contracts not deployed yet!`);
    }
    const curVersion = curRollupContracts.Version;
    const version = args.rollupVersion;
    console.log(`try upgrading contracts, curVersion:${curVersion}, version:${version}`);
    if (version > curVersion) {
      const newVersionedLogics = await db.getL2VersionedLogics(args.l1ChainId, args.l2ChainId, version);
      if (!newVersionedLogics) {
        console.log(`l2 logic contracts of version ${version} not exist, try deploying...`);
        await deployL2Logics(hre, db, args.l1ChainId, args.l2ChainId, version);
      } else {
        console.log(`l2 logic contracts of version ${version} already deployed, reuse them.`);
      }
      await upgradeL2Contracts(hre, db, args.l1ChainId, args.l2ChainId, version, curVersion);
    }
  });




