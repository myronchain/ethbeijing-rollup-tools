import path from "path";

export const ContractNames = {
  AddressManager: 'AddressManager',
  CrossChainChannel: 'CrossChainChannel',
  L1Rollup: 'L1Rollup',
  L1Escrow: 'L1Escrow',
  TestUSDC: 'TestUSDC',
  G1G2ProxyAdmin: "G1G2ProxyAdmin",
  G1G2TransparentUpgradeableProxy: "G1G2TransparentUpgradeableProxy",
  L2Rollup: 'L2Rollup',
  L2Escrow: 'L2Escrow',
};

export const LibraryNames = {
  LibPropose: "LibPropose",
  LibProve: "LibProve",
  LibOnChain: "LibOnChain",
  TransactionLibrary: "TransactionLibrary",
  ReceiptLibrary: "ReceiptLibrary",
}

export const AddressKeys = {
  ROLLUP: 'rollup',
  CROSS_CHAIN_CHANNEL: 'cross_chain_channel',
  ESCROW: 'escrow',
};

export const L2PreDeploys = {
  G1G2ProxyAdmin: '0x4200000000000000000000000000000000000000',
  AddressManager: '0x4200000000000000000000000000000000000001',
  L2Rollup: '0x4200000000000000000000000000000000000002',
  CrossChainChannel: '0x4200000000000000000000000000000000000003',
  L2Escrow: '0x4200000000000000000000000000000000000004',
};

const ARTIFACTS_PATH = path.join(__dirname, '../artifacts/hardhat/contracts')
export const ContractPaths = {
  [LibraryNames.ReceiptLibrary]: path.join(ARTIFACTS_PATH, 'library/Receipt.sol/ReceiptLibrary.json'),
  [LibraryNames.TransactionLibrary]: path.join(ARTIFACTS_PATH, 'library/Transaction.sol/TransactionLibrary.json'),
  [LibraryNames.LibPropose]: path.join(ARTIFACTS_PATH, 'rollup/libs/LibPropose.sol/LibPropose.json'),
  [LibraryNames.LibProve]: path.join(ARTIFACTS_PATH, 'rollup/libs/LibProve.sol/LibProve.json'),
  [LibraryNames.LibOnChain]: path.join(ARTIFACTS_PATH, 'rollup/libs/LibOnChain.sol/LibOnChain.json'),
  [ContractNames.AddressManager]: path.join(ARTIFACTS_PATH, 'library/AddressManager.sol/AddressManager.json'),
  [ContractNames.L1Rollup]: path.join(ARTIFACTS_PATH, 'rollup/L1Rollup.sol/L1Rollup.json'),
  [ContractNames.L2Rollup]: path.join(ARTIFACTS_PATH, 'rollup/L2Rollup.sol/L2Rollup.json'),
  [ContractNames.CrossChainChannel]: path.join(ARTIFACTS_PATH, 'bridge/CrossChainChannel.sol/CrossChainChannel.json'),
  [ContractNames.L1Escrow]: path.join(ARTIFACTS_PATH, 'bridge/L1Escrow.sol/L1Escrow.json'),
  [ContractNames.L2Escrow]: path.join(ARTIFACTS_PATH, 'bridge/L2Escrow.sol/L2Escrow.json'),
  [ContractNames.TestUSDC]: path.join(ARTIFACTS_PATH, 'token/TestUSDC.sol/TestUSDC.json'),
  [ContractNames.G1G2ProxyAdmin]: path.join(ARTIFACTS_PATH, 'upgrade/G1G2ProxyAdmin.sol/G1G2ProxyAdmin.json'),
  [ContractNames.G1G2TransparentUpgradeableProxy]: path.join(ARTIFACTS_PATH, 'upgrade/G1G2TransparentUpgradeableProxy.sol/G1G2TransparentUpgradeableProxy.json'),
};
