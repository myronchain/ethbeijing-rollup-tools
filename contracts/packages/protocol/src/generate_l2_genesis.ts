import { ethers } from 'ethers'
import { AddressKeys, ContractNames, ContractPaths, L2PreDeploys } from './constants'
import { Genesis } from '@eth-optimism/core-utils'
import { DB, L2Logic, L2VersionedLogics } from "../deploy_db/deploy_types";

// The storage slot that holds the address of the implementation.
// bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
// The storage slot that holds the address of the owner.
// bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'

async function generateContractConfigs(
  l2ChainId: number,
  l1CrossChainChannelAddress: string,
  l1EscrowAddress: string,
  l2DeployerAddress: string,
): Promise<any> {
  const contractArtifacts: any = {
    G1G2ProxyAdmin: require(ContractPaths[ContractNames.G1G2ProxyAdmin]),
    G1G2TransparentUpgradeableProxy: require(ContractPaths[ContractNames.G1G2TransparentUpgradeableProxy]),
    AddressManager: require(ContractPaths[ContractNames.AddressManager]),
    L2Rollup: require(ContractPaths[ContractNames.L2Rollup]),
    CrossChainChannel: require(ContractPaths[ContractNames.CrossChainChannel]),
    L2Escrow: require(ContractPaths[ContractNames.L2Escrow]),
  }

  const addressMap: any = {}
  for (const [contractName, artifact] of Object.entries(contractArtifacts)) {
    const bytecode = (artifact as any).bytecode
    addressMap[contractName] = ethers.utils.getCreate2Address(
      l2DeployerAddress,
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`${contractName}_${l2ChainId}`)),
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(bytecode))
    )
  }

  const proxyAdmin = {
    contractName: ContractNames.G1G2ProxyAdmin,
    address: L2PreDeploys.G1G2ProxyAdmin,
    deployedBytecode: contractArtifacts.G1G2ProxyAdmin.deployedBytecode,
    variables: {
      // Ownable
      _owner: l2DeployerAddress,
    }
  }

  const proxies = {
    AddressManager: {
      address: L2PreDeploys.AddressManager,
      deployedBytecode: contractArtifacts.G1G2TransparentUpgradeableProxy.deployedBytecode,
      variables: {
        // Initializable
        _initialized: 1,
        // OwnerableUpgradeable
        _owner: l2DeployerAddress,
        // AddressManager
        addresses: {
          // keccak256(abi.encodePacked(_name))
          [`${ethers.utils.solidityKeccak256(['string'], [AddressKeys.CROSS_CHAIN_CHANNEL])}`]: L2PreDeploys.CrossChainChannel,
          [`${ethers.utils.solidityKeccak256(['string'], [AddressKeys.ROLLUP])}`]: L2PreDeploys.L2Rollup,
          [`${ethers.utils.solidityKeccak256(['string'], [AddressKeys.ESCROW])}`]: L2PreDeploys.L2Escrow,
        },
        remoteAddresses: {
          [`${ethers.utils.solidityKeccak256(['string'], [AddressKeys.CROSS_CHAIN_CHANNEL])}`]: l1CrossChainChannelAddress,
          [`${ethers.utils.solidityKeccak256(['string'], [AddressKeys.ESCROW])}`]: l1EscrowAddress,
        }
      }
    },

    L2Rollup: {
      address: L2PreDeploys.L2Rollup,
      deployedBytecode: contractArtifacts.G1G2TransparentUpgradeableProxy.deployedBytecode,
      variables: {
        // Initializable
        _initialized: 1,
        // ReentrancyGuardUpgradeable
        _status: 1, // _NOT_ENTERED
        // OwnableUpgradeable
        _owner: l2DeployerAddress,
        // AddressResolver
        _addressManager: L2PreDeploys.AddressManager,
        // L2Rollup
        // keccak256(abi.encodePacked(chainId, number, baseFee, ancestors))
        // MAX_ANCESTORS_TO_CONSIDER = 10
        ancestorsHash: ethers.utils.solidityKeccak256(
          ['uint256', 'uint256', 'uint256', 'bytes32[10]'],
          [l2ChainId, 0, 0, new Array(10).fill(ethers.constants.HashZero)]
        )
      }
    },

    CrossChainChannel: {
      address: L2PreDeploys.CrossChainChannel,
      deployedBytecode: contractArtifacts.G1G2TransparentUpgradeableProxy.deployedBytecode,
      variables: {
        // Initializable
        _initialized: 1,
        // ReentrancyGuardUpgradeable
        _status: 1, // _NOT_ENTERED
        // OwnableUpgradeable
        _owner: l2DeployerAddress,
        // AddressResolver
        _addressManager: L2PreDeploys.AddressManager,
      }
    },

    L2Escrow: {
      address: L2PreDeploys.L2Escrow,
      deployedBytecode: contractArtifacts.G1G2TransparentUpgradeableProxy.deployedBytecode,
      variables: {
        // Initializable
        _initialized: 1,
        // ReentrancyGuardUpgradeable
        _status: 1, // _NOT_ENTERED
        // OwnableUpgradeable
        _owner: l2DeployerAddress,
        // AddressResolver
        _addressManager: L2PreDeploys.AddressManager,
      }
    },

  }

  const implementations: any = {
    AddressManager: {
      address: addressMap.AddressManager,
      deployedBytecode: contractArtifacts.AddressManager.deployedBytecode,
    },

    L2Rollup: {
      address: addressMap.L2Rollup,
      deployedBytecode: contractArtifacts.L2Rollup.deployedBytecode,
    },

    CrossChainChannel: {
      address: addressMap.CrossChainChannel,
      deployedBytecode: contractArtifacts.CrossChainChannel.deployedBytecode,
    },

    L2Escrow: {
      address: addressMap.L2Escrow,
      deployedBytecode: contractArtifacts.L2Escrow.deployedBytecode,
    },
  }
  return { proxyAdmin, proxies, implementations }
}

async function generateL2GenesisAlloc(
  db: DB,
  l1ChainId: number,
  l2ChainId: number,
  version: number,
  l1CrossChainChannelAddress: string,
  l1EscrowAddress: string,
  l2DeployerAddress: string,
  l2PremintAccounts: any,
) {
  const {
    computeStorageSlots,
    getStorageLayout,
  } = require('@defi-wonderland/smock/dist/src/utils')
  const alloc: any = {};
  // l2 premint accounts
  if (l2PremintAccounts) {
    Object.entries(l2PremintAccounts).forEach(([address, amountInWei]) => {
      alloc[address] = {
        balance: ethers.BigNumber.from(amountInWei).toHexString()
      }
    })
  }

  const {
    proxyAdmin,
    proxies,
    implementations
  } = await generateContractConfigs(l2ChainId, l1CrossChainChannelAddress, l1EscrowAddress, l2DeployerAddress)

  // alloc ProxyAdmin
  {
    alloc[proxyAdmin.address] = {
      contractName: proxyAdmin.contractName,
      storage: {},
      code: proxyAdmin.deployedBytecode,
      balance: '0x0'
    }
    const storageLayout = await getStorageLayout(proxyAdmin.contractName)
    const slots = computeStorageSlots(storageLayout, proxyAdmin.variables)
    for (const slot of slots) {
      alloc[proxyAdmin.address].storage[slot.key] = slot.val
    }
  }

  // alloc proxies
  for (const contractName of Object.keys(proxies)) {
    const proxy = proxies[contractName]
    alloc[proxy.address] = {
      contractName: `Proxy:${contractName}`,
      storage: {},
      code: proxy.deployedBytecode,
    }
    if (contractName === ContractNames.CrossChainChannel) {
      // premint 1000 billion ETH to CrossChainChannel
      alloc[proxy.address].balance = ethers.utils.parseEther("1000000000000").toHexString()
    } else {
      alloc[proxy.address].balance = '0x0'
    }

    const storageLayout = await getStorageLayout(contractName)
    const slots = computeStorageSlots(storageLayout, proxy.variables)
    for (const slot of slots) {
      alloc[proxy.address].storage[slot.key] = slot.val
    }

    alloc[proxy.address].storage[IMPLEMENTATION_SLOT] = implementations[contractName].address
    alloc[proxy.address].storage[ADMIN_SLOT] = proxyAdmin.address
  }

  // alloc implementations
  for (const contractName of Object.keys(implementations)) {
    const implementation = implementations[contractName]
    alloc[implementation.address] = {
      contractName: `Implementation:${contractName}`,
      storage: {},
      code: implementation.deployedBytecode,
      balance: '0x0'
    }
  }

  await saveL2ContractsDataToDB(db, l1ChainId, l2ChainId, version, implementations);

  return alloc
}

async function saveL2ContractsDataToDB(
  db: DB,
  l1ChainId: number,
  l2ChainId: number,
  version: number,
  implementations: any,
) {
  console.log("generating l2 contracts versioned data...")
  const l2Logics: L2Logic[] = [];
  const l2LogicMap = {};
  for (const contractName of Object.keys(implementations)) {
    const implementation = implementations[contractName];
    const deployedByteCodeHash = ethers.utils.solidityKeccak256(['string'], [implementation.deployedBytecode])
    const l2Logic = {
      L1ChainId: l1ChainId,
      L2ChainId: l2ChainId,
      CodeHash: deployedByteCodeHash,
      Address: implementation.address,
      ContractName: contractName,
    }
    l2Logics.push(l2Logic);
    l2LogicMap[contractName] = l2Logic;
  }
  await db.saveL2Logics(l2Logics);
  await db.saveL2VersionedLogics({
    L1ChainId: l1ChainId,
    L2ChainId: l2ChainId,
    Version: version,
    ...l2LogicMap,
  } as L2VersionedLogics, true);
}

async function generateL2Genesis(
  args:
    {
      db: DB,
      l1ChainId: number,
      l2ChainId: number,
      version: number,
      l1CrossChainChannelAddress: string,
      l1EscrowAddress: string,
      l2DeployerAddress: string,
      l2PremintAccounts: any,
    }
): Promise<Genesis> {
  console.log("generating l2 genesis...");
  const alloc = await generateL2GenesisAlloc(
    args.db,
    args.l1ChainId,
    args.l2ChainId,
    args.version,
    args.l1CrossChainChannelAddress,
    args.l1EscrowAddress,
    args.l2DeployerAddress,
    args.l2PremintAccounts,
  );
  // 2022/9/1 00:00:00
  // const timestampSeconds = new Date(2022, 8, 1, 0).getTime() / 1000
  const timestampSeconds = 1661961600
  // londonBlock: 0,
  const genesis: Genesis = {
    config: {
      chainId: args.l2ChainId,
      homesteadBlock: 0,
      eip150Block: 0,
      eip150Hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      eip155Block: 0,
      eip158Block: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      petersburgBlock: 0,
      istanbulBlock: 0,
      muirGlacierBlock: 0,
      berlinBlock: 0,
    },
    nonce: '0x0',
    timestamp: ethers.BigNumber.from(timestampSeconds).toHexString(),
    extraData: '0x',
    // todo: it doesn't matter???
    gasLimit: ethers.BigNumber.from(50_000_000).toHexString(),
    difficulty: '0x0',
    mixHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    coinbase: '0x0000000000000000000000000000000000000000',
    alloc,
  }
  return genesis;
}

export {
  generateL2Genesis
}

