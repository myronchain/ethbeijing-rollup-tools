import 'hardhat-deploy';
import { AddressKeys, ContractNames, ContractPaths, L2PreDeploys, LibraryNames } from "./constants";
import { Contract, ethers } from "ethers";
import { Genesis } from "@eth-optimism/core-utils";
import * as shell from "shelljs";
import * as fs from "fs";
import FirestoreDB from "../deploy_db/firestore";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DB, FirebaseConfig, L1Proxies, L1VersionedLogics, L2VersionedLogics } from "../deploy_db/deploy_types";
import { generateL2Genesis } from "./generate_l2_genesis";
import * as path from "path";
import LocalDB from "../deploy_db/local_db";

async function deployContract(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  libraries = {},
  args: any[] = [],
  overrides = {}
): Promise<Contract> {
  const contractArgs = args || [];
  const contractArtifacts = await hre.ethers.getContractFactory(
    contractName,
    {
      libraries: libraries,
    }
  );

  const deployed = await contractArtifacts.deploy(...contractArgs, overrides);
  console.log(
    `${contractName} deploying, tx ${deployed.deployTransaction.hash}, waiting for confirmations`
  );

  await deployed.deployed();

  console.log(`${contractName} deployed at ${deployed.address}`);
  return deployed;
}

function getDeployedBytecodeHash(contractName: string): string {
  const deployedBytecode = require(ContractPaths[contractName]).deployedBytecode;
  return ethers.utils.solidityKeccak256(['string'], [deployedBytecode]);
}

async function getProxyAdmin(hre: HardhatRuntimeEnvironment, address: string): Promise<Contract> {
  const abi = require(ContractPaths[ContractNames.G1G2ProxyAdmin]).abi;
  const signers = await hre.ethers.getSigners();
  return new ethers.Contract(address, abi, signers[0]);
}

async function calculateGenesisHash(genesis: Genesis): Promise<string> {
  console.log("calculate genesis hash...");

  // write genesis to file
  const l2GenesisFilePath = path.join(__dirname, "l2_genesis.json")
  fs.writeFileSync(l2GenesisFilePath, JSON.stringify(genesis, undefined, 2));

  // calculate genesis hash
  const curDir = shellExec("pwd", true).trim();
  const automationDir = `${curDir}/../../../g1g2-automation/`;
  shell.cd(automationDir);
  const genesisHash = shellExec(`go run cmd/*.go genesis --file ${l2GenesisFilePath}`).trim();
  shell.cd(curDir);
  fs.unlinkSync(l2GenesisFilePath);

  console.log("\ngenesis hash:", genesisHash);
  return genesisHash;
}

function getDbInstance(): DB {
  return new LocalDB();
}

function shellExec(cmd: string, silent = false): string {
  if (!silent) {
    console.log("⭐️", cmd);
  }
  const output = shell.exec(cmd, { silent });
  if (output.code !== 0) {
    throw new Error(output.stderr);
  }
  return output.stdout;
}

async function getChainIdByRpcUrl(rpcUrl: string): Promise<number> {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const network = await provider.detectNetwork();
  return network.chainId;
}

async function deployL1Proxies(
  hre: HardhatRuntimeEnvironment,
  db: DB,
  l1ChainId: number,
  l2ChainId: number,
  version: number,
  l2DeployerAddress: string,
  l2PremintAccounts: any = {}
): Promise<void> {
  console.log('deploy proxy contracts, version:', version);
  const l1VersionedLogics = await db.getL1VersionedLogics(l1ChainId, version);
  if (!l1VersionedLogics) {
    throw new Error(`l1 logic contracts of version ${version} not exist!`);
  }
  const proxyAdminAddress = await db.getL1ProxyAdminAddress(l1ChainId);
  if (!proxyAdminAddress) {
    throw new Error("l1 proxy admin not found!");
  }
  const AddressManager = await deployL1Proxy(
    hre,
    proxyAdminAddress,
    l1VersionedLogics[ContractNames.AddressManager].Address,
    ContractNames.AddressManager,
    'init'
  );
  const CrossChainChannel = await deployL1Proxy(
    hre,
    proxyAdminAddress,
    l1VersionedLogics[ContractNames.CrossChainChannel].Address,
    ContractNames.CrossChainChannel,
    'init',
    [AddressManager.address]
  );
  const L1Escrow = await deployL1Proxy(
    hre,
    proxyAdminAddress,
    l1VersionedLogics[ContractNames.L1Escrow].Address,
    ContractNames.L1Escrow,
    'init',
    [AddressManager.address]
  );

  const l2Genesis = await generateL2Genesis({
    db,
    l1ChainId,
    l2ChainId,
    version,
    l1CrossChainChannelAddress: CrossChainChannel.address,
    l1EscrowAddress: L1Escrow.address,
    l2DeployerAddress,
    l2PremintAccounts,
  });
  await db.saveL2Genesis({
    L1ChainId: l1ChainId,
    L2ChainId: l2ChainId,
    Genesis: l2Genesis,
  });
  const l2GenesisHash = await calculateGenesisHash(l2Genesis);
  const L1Rollup = await deployL1Proxy(
    hre,
    proxyAdminAddress,
    l1VersionedLogics[ContractNames.L1Rollup].Address,
    ContractNames.L1Rollup,
    'init',
    [AddressManager.address, l2ChainId, l2GenesisHash]
  );

  await setAddresses(hre, AddressManager.address, L1Rollup.address, CrossChainChannel.address, L1Escrow.address);
  await db.saveRollupContracts({
    L1ChainId: l1ChainId,
    L2ChainId: l2ChainId,
    Version: version,
    L1Proxies: {
      AddressManager: AddressManager.address,
      L1Rollup: L1Rollup.address,
      CrossChainChannel: CrossChainChannel.address,
      L1Escrow: L1Escrow.address,
    },
    L2Proxies: {
      AddressManager: L2PreDeploys.AddressManager,
      L2Rollup: L2PreDeploys.L2Rollup,
      CrossChainChannel: L2PreDeploys.CrossChainChannel,
      L2Escrow: L2PreDeploys.L2Escrow,
    }
  });
}

async function deployL1Logics(
  hre: HardhatRuntimeEnvironment,
  db: DB,
  l1ChainId: number,
  version: number
): Promise<void> {
  console.log("deploy logic contracts, version:", version);
  // proxy admin
  const proxyAdminAddress = await db.getL1ProxyAdminAddress(l1ChainId);
  if (!proxyAdminAddress) {
    await deployL1Logic(hre, db, l1ChainId, ContractNames.G1G2ProxyAdmin);
  }

  // other contracts
  const contractNames = [
    LibraryNames.ReceiptLibrary,
    LibraryNames.TransactionLibrary,
    LibraryNames.LibPropose,
    LibraryNames.LibProve,
    LibraryNames.LibOnChain,
    ContractNames.AddressManager,
    ContractNames.L1Rollup,
    ContractNames.CrossChainChannel,
    ContractNames.L1Escrow,
  ];
  const localCodeHashes = contractNames.map(getDeployedBytecodeHash)
  const remoteCodeHashes = (await db.getL1Logics(l1ChainId, localCodeHashes)).map(item => item.CodeHash);
  for (const contractName of contractNames) {
    if (!remoteCodeHashes.includes(getDeployedBytecodeHash(contractName))) {
      if (contractName === LibraryNames.LibProve) {
        await deployL1Logic(hre, db, l1ChainId, LibraryNames.LibProve, {
          [LibraryNames.ReceiptLibrary]: (await db.getL1Logic(l1ChainId, getDeployedBytecodeHash(LibraryNames.ReceiptLibrary)))?.Address,
          [LibraryNames.TransactionLibrary]: (await db.getL1Logic(l1ChainId, getDeployedBytecodeHash(LibraryNames.TransactionLibrary)))?.Address,
        });
      } else if (contractName === ContractNames.L1Rollup) {
        await deployL1Logic(hre, db, l1ChainId, ContractNames.L1Rollup, {
          [LibraryNames.LibPropose]: (await db.getL1Logic(l1ChainId, getDeployedBytecodeHash(LibraryNames.LibPropose)))?.Address,
          [LibraryNames.LibProve]: (await db.getL1Logic(l1ChainId, getDeployedBytecodeHash(LibraryNames.LibProve)))?.Address,
          [LibraryNames.LibOnChain]: (await db.getL1Logic(l1ChainId, getDeployedBytecodeHash(LibraryNames.LibOnChain)))?.Address,
        });
      } else {
        await deployL1Logic(hre, db, l1ChainId, contractName);
      }
    }
  }
  const logics = await db.getL1Logics(l1ChainId, localCodeHashes);
  if (logics.length !== localCodeHashes.length) {
    throw new Error("deployL1Logics: logics and localCodeHashes length mismatch!");
  }
  const logicMap = {};
  logics.forEach(item => logicMap[item.ContractName] = item);
  await db.saveL1VersionedLogics({
    L1ChainId: l1ChainId,
    Version: version,
    ...logicMap,
  } as L1VersionedLogics);
}

async function upgradeL1Contracts(
  hre: HardhatRuntimeEnvironment,
  db: DB,
  curLogics: L1VersionedLogics,
  proxies: L1Proxies,
  l1ChainId: number,
  version: number,
): Promise<void> {
  console.log("upgrade l1 contracts...");
  const newLogics = await db.getL1VersionedLogics(l1ChainId, version);
  if (!newLogics) {
    throw new Error(`l1 logic contracts of version ${version} not exist!`);
  }
  const contractNames = [
    ContractNames.AddressManager,
    ContractNames.L1Rollup,
    ContractNames.CrossChainChannel,
    ContractNames.L1Escrow,
  ];
  for (const contractName of contractNames) {
    if (newLogics[contractName].CodeHash !== curLogics[contractName].CodeHash) {
      await upgradeL1Contract(
        hre,
        db,
        newLogics,
        proxies,
        l1ChainId,
        contractName
      );
    }
  }
  console.log("upgrade l1 contracts finished");
}

async function setAddresses(
  hre: HardhatRuntimeEnvironment,
  addressManagerAddr: string,
  l1RollupAddr: string,
  crossChainChannelAddr: string,
  l1EscrowAddr: string,
): Promise<void> {
  // set addresses
  console.log('set addresses...')
  const AddressManager = await getContractProxy(hre, ContractNames.AddressManager, addressManagerAddr);
  await AddressManager.setAddress(AddressKeys.ROLLUP, l1RollupAddr);
  await AddressManager.setAddress(AddressKeys.CROSS_CHAIN_CHANNEL, crossChainChannelAddr);
  await AddressManager.setAddress(AddressKeys.ESCROW, l1EscrowAddr);

  // set remote addresses
  console.log('set remote addresses...')
  await AddressManager.setRemoteAddress(AddressKeys.ROLLUP, L2PreDeploys.L2Rollup);
  await AddressManager.setRemoteAddress(AddressKeys.CROSS_CHAIN_CHANNEL, L2PreDeploys.CrossChainChannel);
  await AddressManager.setRemoteAddress(AddressKeys.ESCROW, L2PreDeploys.L2Escrow);
}

async function getContractProxy(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  contractProxyAddr: string
): Promise<Contract> {
  const abi = require(ContractPaths[contractName]).abi;
  const signers = await hre.ethers.getSigners();
  return new ethers.Contract(contractProxyAddr, abi, signers[0]);
}

function getContractInterface(contractName: string) {
  const abi = require(ContractPaths[contractName]).abi;
  return new ethers.utils.Interface(abi);
}

async function deployL1Logic(
  hre: HardhatRuntimeEnvironment,
  db: DB,
  l1ChainId: number,
  contractName: string,
  libraries: any = {}
): Promise<Contract> {
  console.log("deploy logic contract, contractName:", contractName);
  const contract = await deployContract(hre, contractName, libraries);
  const deployedBytecodeHash = getDeployedBytecodeHash(contractName);
  await db.saveL1Logic({
    L1ChainId: l1ChainId,
    CodeHash: deployedBytecodeHash,
    Address: contract.address,
    ContractName: contractName,
  });
  return contract
}

async function upgradeL1Contract(
  hre: HardhatRuntimeEnvironment,
  db: DB,
  logics: L1VersionedLogics,
  proxies: L1Proxies,
  l1ChainId: number,
  contractName: string,
): Promise<void> {
  console.log("upgrade contract, contractName:", contractName);
  const proxyAdminAddress = await db.getL1ProxyAdminAddress(l1ChainId)
  const G1G2ProxyAdmin = await getProxyAdmin(hre, proxyAdminAddress);
  await G1G2ProxyAdmin.upgrade(proxies[contractName], logics[contractName].Address);
}

async function deployL1Proxy(
  hre: HardhatRuntimeEnvironment,
  proxyAdminAddress: string,
  implementationAddress: string,
  contractName: string,
  initFuncName: string,
  initFuncArgs: any[] = [],
): Promise<Contract> {
  console.log('deploy proxy contract, contractName:', contractName);
  const initFuncData = getContractInterface(contractName).encodeFunctionData(initFuncName, initFuncArgs);
  return deployContract(hre, ContractNames.G1G2TransparentUpgradeableProxy, {},
    [
      implementationAddress,
      proxyAdminAddress,
      initFuncData
    ]
  );
}

async function deployL2Logics(
  hre: HardhatRuntimeEnvironment,
  db: DB,
  l1ChainId: number,
  l2ChainId: number,
  version: number
): Promise<void> {
  const contractNames = [
    ContractNames.AddressManager,
    ContractNames.L2Rollup,
    ContractNames.CrossChainChannel,
    ContractNames.L2Escrow
  ];
  const localCodeHashes = contractNames.map(getDeployedBytecodeHash);
  const remoteCodeHashes = (await db.getL2Logics(l1ChainId, l2ChainId, localCodeHashes)).map(item => item.CodeHash);
  for (const contractName of contractNames) {
    if (!remoteCodeHashes.includes(getDeployedBytecodeHash(contractName))) {
      await deployL2Logic(hre, db, contractName, l1ChainId, l2ChainId, version);
    }
  }
  const logics = await db.getL2Logics(l1ChainId, l2ChainId, localCodeHashes);
  if (logics.length !== localCodeHashes.length) {
    throw new Error("deployL2Logics: logics and localCodeHashes length mismatch!");
  }
  const logicMap = {};
  logics.forEach(item => logicMap[item.ContractName] = item);
  await db.saveL2VersionedLogics({
    L1ChainId: l1ChainId,
    L2ChainId: l2ChainId,
    Version: version,
    ...logicMap,
  } as L2VersionedLogics, false);
}

async function upgradeL2Contracts(
  hre: HardhatRuntimeEnvironment,
  db: DB,
  l1ChainId: number,
  l2ChainId: number,
  version: number,
  curVersion: number,
): Promise<void> {
  console.log("upgrade l2 contracts...");
  const newVersionedLogics = await db.getL2VersionedLogics(l1ChainId, l2ChainId, version);
  if (!newVersionedLogics) {
    throw new Error(`l2 logic contracts of version ${version} not exist!`);
  }
  const curVersionedLogics = await db.getL2VersionedLogics(l1ChainId, l2ChainId, curVersion);
  const contractNames = [
    ContractNames.AddressManager,
    ContractNames.L2Rollup,
    ContractNames.CrossChainChannel,
    ContractNames.L2Escrow
  ];
  const ProxyAdmin = await getProxyAdmin(hre, L2PreDeploys[ContractNames.G1G2ProxyAdmin])
  for (const contractName of contractNames) {
    if (newVersionedLogics[contractName].CodeHash !== curVersionedLogics[contractName].CodeHash) {
      await ProxyAdmin.upgrade(L2PreDeploys[contractName], newVersionedLogics[contractName].Address);
    }
  }
  console.log("upgrade l2 contracts finished");
}

async function deployL2Logic(
  hre: HardhatRuntimeEnvironment,
  db: DB,
  contractName: string,
  l1ChainId: number,
  l2ChainId: number,
  version: number,
  libraries: any = {},
): Promise<void> {
  const contract = await deployContract(hre, contractName, libraries);
  await db.saveL2Logic({
    L1ChainId: l1ChainId,
    L2ChainId: l2ChainId,
    ContractName: contractName,
    CodeHash: getDeployedBytecodeHash(contractName),
    Address: contract.address
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function downloadArtifactsSync(version: number): void {
  shellExec("yarn clean")
  const artifactsZipFileName = `artifacts_v${version}.zip`
  const artifactsZipFilePath = path.join("./deployments", artifactsZipFileName);
  if (!fs.existsSync(artifactsZipFilePath)) {
    const artifactsUrl = `gs://g1g2-db990.appspot.com/g1g2-contracts/${artifactsZipFileName}`;
    shellExec(`gsutil cp ${artifactsUrl} ${artifactsZipFilePath}`);
  }
  shellExec(`unzip ${artifactsZipFilePath}`);
}

export {
  deployContract,
  deployL1Logics,
  deployL2Logics,
  deployL1Proxies,
  upgradeL1Contracts,
  upgradeL2Contracts,
  getDbInstance,
  shellExec,
  getChainIdByRpcUrl,
  sleep,
  downloadArtifactsSync,
};
