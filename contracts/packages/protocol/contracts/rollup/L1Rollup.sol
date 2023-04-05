// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {IFBaseContract} from "../base/IFBaseContract.sol";
import {IRemoteChain} from "../base/IRemoteChain.sol";
import {LibOnChain} from "./libs/LibOnChain.sol";
import {LibPropose} from "./libs/LibPropose.sol";
import {LibProve} from "./libs/LibProve.sol";
import {G1G2Data} from "../library/LibData.sol";
import {LibConfig} from "../library/LibConfig.sol";
import {LibStatusBits} from "../library/LibStatusBits.sol";

/// @author g1g2 <g1g2@g1g2.xyz>
contract L1Rollup is IFBaseContract, IRemoteChain {
  event BlockBuilt(bytes32 contentHash);
  event BlockProposed(uint256 indexed i, G1G2Data.ProposedBlockHeader pbh);
  event BlockProven(
    uint256 indexed blockId,
    bytes32 indexed parentHash,
    bytes32 indexed blockHash,
    address prover
  );
  event BlockOnChain(uint256 indexed blockId, bytes32 blockHash);
  event RemoteHeaderSynced(uint256 indexed blockHeight, bytes32 blockHash);

  // Struct abi is not generated because no interface use it
  // We define a unemited event to gen abi for unexported struct
  event LogBlock(
    G1G2Data.ProofData data1,
    G1G2Data.InvalidBlockProofData data2
  );

  G1G2Data.ChainState private state;
  uint256[50] private __gap;

  modifier notHalted() {
    require(!LibStatusBits.isHalted(state), "halted");
    _;
  }

  function init(
    address _addressManager,
    uint256 l2ChainId,
    bytes32 l2GenesisHash
  ) external initializer {
    IFBaseContract._init(_addressManager);
    LibOnChain.init(state, l2ChainId, l2GenesisHash);
  }

  // contentHash = keccak256(abi.encode(txListHash, coinbase))
  // see ProposedBlockHeaderLibrary#getBuilderFingerprint
  function build(bytes32 contentHash) external nonReentrant onlyEOA notHalted {
    LibPropose.build(state, contentHash);
  }

  /**
   * propose a block
   */
  function propose(bytes[] calldata proposedBlock)
    external
    nonReentrant
    onlyEOA
    notHalted
  {
    LibPropose.propose(state, LibConfig.getConfig(), proposedBlock);
  }

  /**
   * prove a block
   */
  function prove(bytes[] calldata proofs)
    external
    nonReentrant
    onlyEOA
    notHalted
  {
    G1G2Data.Config memory config = LibConfig.getConfig();
    LibProve.prove(state, config, proofs, this);
    LibOnChain.onchain(state, config.maxOnChainPerTx);
  }

  function proveInvalid(bytes[] calldata proofs)
    external
    nonReentrant
    onlyEOA
    notHalted
  {
    G1G2Data.Config memory config = LibConfig.getConfig();
    LibProve.proveInvalid(state, config, proofs, this);
    LibOnChain.onchain(state, config.maxOnChainPerTx);
  }

  function onchain(uint256 maxPerBatch)
    external
    nonReentrant
    onlyEOA
    notHalted
  {
    LibOnChain.onchain(state, maxPerBatch);
  }

  function getRemoteHeaderByNumber(uint256 number)
    external
    view
    returns (bytes32 hash)
  {
    return state.l2BlockHashes[number];
  }

  function getLatestRemoteHeader() external view returns (bytes32) {
    return state.l2BlockHashes[state.lastOnChainHeight];
  }

  function getStateVariables()
    public
    view
    returns (G1G2Data.StateVariables memory)
  {
    return
      G1G2Data.StateVariables({
        genesisHeight: state.genesisHeightOnL1,
        lastOnChainId: state.lastOnChainId,
        lastOnChainHeight: state.lastOnChainHeight,
        nextBlockId: state.nextIdToPropose
      });
  }

  function getConfig() public pure returns (G1G2Data.Config memory) {
    return LibConfig.getConfig();
  }

  function setHalted(bool halted) public onlyOwner {
    LibStatusBits.setHalted(state, halted);
  }

  function isHalted() public view returns (bool) {
    return LibStatusBits.isHalted(state);
  }
}
