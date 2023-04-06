import { ContractNames } from "../src/constants";
import * as fs from "fs";
import {
  DB,
  L1Logic,
  L1VersionedLogics,
  L2Genesis,
  L2Logic,
  L2VersionedLogics,
  RollupContracts,
} from "./deploy_types";
import { isEqual } from "lodash";

const DEPLOYMENT_DIR = "deployments";
const L1_LOGICS_JSON = "l1_logics.json";
const L1_VERSIONED_LOGICS = "l1_versioned_logics.json";
const L2_LOGICS_JSON = "l2_logics.json";
const L2_VERSIONED_LOGICS = "l2_versioned_logics.json";
const ROLLUP_CONTRACTS = "rollup_contracts.json";
const L2_GENESIS = "l2_genesis.json";

export default class LocalDB implements DB {
  async getL1Logic(l1ChainId: number, codeHash: string): Promise<L1Logic | null> {
    const list = this.__getL1Logics();
    return list.find(item => item.L1ChainId === l1ChainId && item.CodeHash === codeHash);
  }

  async getL1Logics(l1ChainId: number, codeHashes: string[]): Promise<L1Logic[]> {
    const list = this.__getL1Logics();
    return list.filter(item => item.L1ChainId === l1ChainId && codeHashes.includes(item.CodeHash));
  }

  async saveL1Logics(data: L1Logic[]): Promise<void> {
    const list = this.__getL1Logics();
    const newList = [...list, ...data];
    await this.__saveL1Logics(newList);
  }

  async saveL1Logic(data: L1Logic): Promise<void> {
    await this.saveL1Logics([data]);
  }

  async saveL1VersionedLogics(data: L1VersionedLogics): Promise<void> {
    const list = this.__getL1VersionedLogics() ?? [];
    const index = list.findIndex(item => item.L1ChainId === data.L1ChainId && item.Version === data.Version);
    if (index === -1) {
      const newList = [...list, data];
      this.__saveL1VersionedLogics(newList);
    } else {
      console.log(`l1 logics if version:${data.Version} already exist`);
      if (!isEqual(data, list[index])) {
        throw new Error(`saveL1VersionedLogics: invalid data: ${JSON.stringify(data)}`);
      }
    }
  }

  async getL1VersionedLogics(l1ChainId: number, version: number): Promise<L1VersionedLogics | null> {
    const list = this.__getL1VersionedLogics();
    return list.find(item => item.L1ChainId === l1ChainId && item.Version === version);
  }

  async getL2Logic(l1ChainId: number, l2ChainId: number, codeHash: string): Promise<L2Logic | null> {
    const list = this.__getL2LogicAddresses();
    return list.find(item => item.L1ChainId === l1ChainId && item.L2ChainId === l2ChainId && item.CodeHash === codeHash);
  }

  async getL2Logics(l1ChainId: number, l2ChainId: number, codeHashes: string[]): Promise<L2Logic[]> {
    const list = this.__getL2LogicAddresses();
    return list.filter(item => item.L1ChainId === l1ChainId && item.L2ChainId === l2ChainId && codeHashes.includes(item.CodeHash));
  }

  async saveL2Logics(data: L2Logic[]): Promise<void> {
    const list = this.__getL2LogicAddresses();
    this.__saveL2LogicAddresses([...list, ...data]);
  }

  async saveL2Logic(data: L2Logic): Promise<void> {
    await this.saveL2Logics([data]);
  }

  async getL2VersionedLogics(l1ChainId: number, l2ChainId: number, version: number): Promise<L2VersionedLogics | null> {
    const list = this.__getL2VersionedLogics();
    return list.find(item => item.L1ChainId === l1ChainId && item.L2ChainId === l2ChainId && item.Version === version);
  }

  async saveL2VersionedLogics(data: L2VersionedLogics): Promise<void> {
    const list = this.__getL2VersionedLogics();
    const index = list.findIndex(item => item.L1ChainId === data.L1ChainId && item.L2ChainId === data.L2ChainId && item.Version === data.Version);
    if (index === -1) {
      const newList = [...list, data];
      this.__saveL2VersionedLogics(newList);
    } else {
      console.log(`l2 logics of version:${data.Version} already exist`);
      if (!isEqual(data, list[index])) {
        throw new Error(`saveL2VersionedLogics: invalid data: ${JSON.stringify(data)}`);
      }
    }
  }

  async getL1ProxyAdminAddress(l1ChainId: number): Promise<string | null> {
    const list = this.__getL1Logics();
    return list.find(item => item.L1ChainId === l1ChainId && item.ContractName === ContractNames.G1G2ProxyAdmin)?.Address
  }

  async getRollupContracts(l1ChainId: number, l2ChainId: number): Promise<RollupContracts | null> {
    const list = this.__getRollupContracts();
    return list.find(item => item.L1ChainId == l1ChainId && item.L2ChainId == l2ChainId);
  }

  async saveRollupContracts(data: RollupContracts): Promise<void> {
    const list = this.__getRollupContracts();
    const index = list.findIndex(item => item.L1ChainId == data.L1ChainId && item.L2ChainId == data.L2ChainId);
    if (index >= 0) {
      list.splice(index, 1, data);
      this.__saveRollupContracts(list);
    } else {
      this.__saveRollupContracts([...list, data]);
    }
  }

  async updateRollupVersion(l1ChainId: number, l2ChainId: number, version: number): Promise<void> {
    const list = this.__getRollupContracts();
    const index = list.findIndex(item => item.L1ChainId == l1ChainId && item.L2ChainId == l2ChainId);
    if (index >= 0) {
      const newItem = {
        ...(list[index]),
        Version: version,
      }
      list.splice(index, 1, newItem);
      this.__saveRollupContracts(list);
    } else {
      throw new Error(`rollup contracts of l1ChainId:${l1ChainId} l2ChainId:${l2ChainId} not exist!`);
    }
  }

  async deleteAll(): Promise<void> {
    this.__deleteFile(L1_LOGICS_JSON);
    this.__deleteFile(L1_VERSIONED_LOGICS);
    this.__deleteFile(L2_LOGICS_JSON);
    this.__deleteFile(L2_VERSIONED_LOGICS);
    this.__deleteFile(ROLLUP_CONTRACTS);
  }

  async deleteL1(l1ChainId: number): Promise<void> {
    this.__deleteL1(L1_LOGICS_JSON, l1ChainId);
    this.__deleteL1(L1_VERSIONED_LOGICS, l1ChainId);
    this.__deleteL1(L2_LOGICS_JSON, l1ChainId);
    this.__deleteL1(L2_VERSIONED_LOGICS, l1ChainId);
    this.__deleteL1(ROLLUP_CONTRACTS, l1ChainId);
    this.__deleteL1(L2_GENESIS, l1ChainId);
  }

  async deleteL2(l1ChainId: number, l2ChainId: number): Promise<void> {
    this.__deleteL2(L2_LOGICS_JSON, l1ChainId, l2ChainId);
    this.__deleteL2(L2_VERSIONED_LOGICS, l1ChainId, l2ChainId);
    this.__deleteL2(ROLLUP_CONTRACTS, l1ChainId, l2ChainId);
    this.__deleteL2(L2_GENESIS, l1ChainId, l2ChainId);
  }

  async saveL2Genesis(data: L2Genesis): Promise<void> {
    const list = this.__getL2GenesisList();
    const index = list.findIndex(item => item.L1ChainId === data.L1ChainId && item.L2ChainId === data.L2ChainId);
    if (index === -1) {
      list.push(data);
    } else {
      list.splice(index, 1, data);
    }
    this.__saveL2GenesisList(list);
  }

  private __deleteL1(fileName: string, l1ChainId: number): void {
    const list = this.__readFile(fileName) ?? [];
    const newList = list.filter(item => item.L1ChainId !== l1ChainId);
    this.__writeFile(newList, fileName)
  }

  private __deleteL2(fileName: string, l1ChainId: number, l2ChainId: number): void {
    const list = this.__readFile(fileName) ?? [];
    const newList = list.filter(item => !(item.L1ChainId === l1ChainId && item.L2ChainId === l2ChainId));
    this.__writeFile(newList, fileName)
  }

  private __saveL1VersionedLogics(data: L1VersionedLogics[]): void {
    this.__writeFile(data, L1_VERSIONED_LOGICS);
  }

  private __getL1VersionedLogics(): L1VersionedLogics[] {
    return this.__readFile(L1_VERSIONED_LOGICS) ?? [];
  }

  private __getL1Logics(): L1Logic[] {
    return this.__readFile(L1_LOGICS_JSON) ?? [];
  }

  private __saveL1Logics(data: L1Logic[]): void {
    this.__writeFile(data, L1_LOGICS_JSON);
  }

  private __saveL2LogicAddresses(data: L2Logic[]): void {
    this.__writeFile(data, L2_LOGICS_JSON);
  }

  private __getL2LogicAddresses(): L2Logic[] {
    return this.__readFile(L2_LOGICS_JSON) ?? [];
  }

  private __saveL2VersionedLogics(data: L2VersionedLogics[]): void {
    this.__writeFile(data, L2_VERSIONED_LOGICS);
  }

  private __getL2VersionedLogics(): L2VersionedLogics[] {
    return this.__readFile(L2_VERSIONED_LOGICS) ?? [];
  }

  private __saveRollupContracts(data: RollupContracts[]): void {
    this.__writeFile(data, ROLLUP_CONTRACTS);
  }

  private __getRollupContracts(): RollupContracts[] {
    return this.__readFile(ROLLUP_CONTRACTS) ?? [];
  }

  private __getL2GenesisList(): L2Genesis[] {
    return this.__readFile(L2_GENESIS) ?? [];
  }

  private __saveL2GenesisList(data: L2Genesis[]): void {
    this.__writeFile(data, L2_GENESIS);
  }

  private __writeFile(data: any, fileName: string) {
    if (!fs.existsSync(DEPLOYMENT_DIR)) {
      fs.mkdirSync(DEPLOYMENT_DIR, { recursive: true });
    }
    const filePath = `${DEPLOYMENT_DIR}/${fileName}`;
    fs.writeFileSync(filePath, JSON.stringify(data, undefined, 2));
    console.log(`save ${filePath} success!`);
  }

  private __readFile(fileName: string): any {
    try {
      const filePath = `${DEPLOYMENT_DIR}/${fileName}`;
      const rawData = fs.readFileSync(filePath);
      return JSON.parse(rawData.toString());
    } catch (e) {
      return null;
    }
  }

  private __deleteFile(fileName: string) {
    const filePath = `${DEPLOYMENT_DIR}/${fileName}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`delete ${filePath} success!`);
    }
  }
}
