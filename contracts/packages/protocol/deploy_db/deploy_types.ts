import { Genesis } from '@eth-optimism/core-utils'

export interface L1Logic {
  L1ChainId: number,
  // deployedBytecode hash
  CodeHash: string,
  Address: string,
  ContractName: string,
}

export interface L1VersionedLogics {
  L1ChainId: number,
  Version: number,
  ReceiptLibrary: L1Logic,
  TransactionLibrary: L1Logic,
  LibPropose: L1Logic,
  LibProve: L1Logic,
  LibOnChain: L1Logic,
  AddressManager: L1Logic,
  L1Rollup: L1Logic,
  CrossChainChannel: L1Logic,
  L1Escrow: L1Logic,
}

export interface L2Logic {
  L1ChainId: number,
  L2ChainId: number,
  CodeHash: string,
  Address: string,
  ContractName: string,
}

export interface L2VersionedLogics {
  L1ChainId: number,
  L2ChainId: number,
  Version: number,
  AddressManager: L2Logic,
  L2Rollup: L2Logic,
  CrossChainChannel: L2Logic,
  L2Escrow: L2Logic,
}

export interface L1Proxies {
  AddressManager: string,
  L1Rollup: string,
  CrossChainChannel: string,
  L1Escrow: string,
}

export interface L2Proxies {
  AddressManager: string,
  L2Rollup: string,
  CrossChainChannel: string,
  L2Escrow: string,
}

export interface RollupContracts {
  L1ChainId: number,
  L2ChainId: number,
  Version: number,
  L1Proxies: L1Proxies,
  L2Proxies: L2Proxies,
}

export interface FirebaseConfig {
  apiKey: string,
  authDomain: string,
  projectId: string,
  storageBucket: string,
  messagingSenderId: string,
  appId: string,
  measurementId: string,
}

export interface L2Genesis {
  L1ChainId: number,
  L2ChainId: number,
  Genesis: Genesis,
}

export interface DB {
  saveL1Logic(data: L1Logic): Promise<void>;

  saveL1Logics(data: L1Logic[]): Promise<void>;

  getL1Logic(l1ChainId: number, codeHash: string): Promise<L1Logic | null>;

  getL1Logics(l1ChainId: number, codeHashes: string[]): Promise<L1Logic[]>;

  saveL1VersionedLogics(data: L1VersionedLogics): Promise<void>;

  getL1VersionedLogics(l1ChainId: number, version: number): Promise<L1VersionedLogics | null>;

  getL1ProxyAdminAddress(l1ChainId: number): Promise<string | null>;

  getL2Logics(l1ChainId: number, l2ChainId: number, codeHashes: string[]): Promise<L2Logic[]>;

  saveL2Logics(data: L2Logic[]): Promise<void>;

  saveL2Logic(data: L2Logic): Promise<void>;

  getL2VersionedLogics(l1ChainId: number, l2ChainId: number, version: number): Promise<L2VersionedLogics | null>;

  saveL2VersionedLogics(data: L2VersionedLogics, overwrite: boolean): Promise<void>;

  saveRollupContracts(data: RollupContracts): Promise<void>

  getRollupContracts(l1ChainId: number, l2ChainId: number): Promise<RollupContracts | null>

  updateRollupVersion(l1ChainId: number, l2ChainId: number, version: number): Promise<void>

  deleteAll(): Promise<void>;

  deleteL1(l1ChainId: number): Promise<void>;

  deleteL2(l1ChainId: number, l2ChainId: number): Promise<void>;

  saveL2Genesis(data: L2Genesis): Promise<void>;
}