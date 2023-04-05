import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getDbInstance } from "../src/utils";
import * as types from "hardhat/internal/core/params/argumentTypes";

task("clear_deploy_data", "clear deploy data")
  // --clear-type <l1|l2|all>
  .addParam("clearType", "clear type: l1|l2|all", undefined, types.string, false)
  // --l1-chain-id <l1ChainId>
  .addOptionalParam("l1ChainId", "l1 chain id", undefined, types.int)
  // --l2-chain-id <l2ChainId>
  .addOptionalParam("l2ChainId", "l2 chain id", undefined, types.int)
  .setAction(async function (args: any, hre: HardhatRuntimeEnvironment) {
    const clearType: string = args.clearType;
    console.log("clearType:", clearType);
    const db = getDbInstance();
    if (clearType === 'l1') {
      console.log("clear l1 deploy data...");
      await db.deleteL1(args.l1ChainId);
    } else if (clearType === 'l2') {
      console.log("clear l2 deploy data...");
      await db.deleteL2(args.l1ChainId, args.l2ChainId);
    } else {
      console.log("clear all deploy data...");
      await db.deleteAll();
    }
    console.log("✅", "clear deploy data success!");
  })