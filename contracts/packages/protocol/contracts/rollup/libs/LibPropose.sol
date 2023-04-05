// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {G1G2Data} from "../../library/LibData.sol";
import {ProposedBlockHeaderLibrary} from "../../library/BlockHeader.sol";

library LibPropose {
  event BlockBuilt(bytes32 contentHash);
  event BlockProposed(uint256 indexed i, G1G2Data.ProposedBlockHeader pbh);

  function build(G1G2Data.ChainState storage state, bytes32 contentHash)
    public
  {
    _insertBuiltBlock(state, contentHash);
    emit BlockBuilt(contentHash);
  }

  function propose(
    G1G2Data.ChainState storage state,
    G1G2Data.Config memory config,
    bytes[] calldata proposedBlock
  ) public {
    require(proposedBlock.length == 1, "L1::propose, inputs size mismatch");
    G1G2Data.ProposedBlockHeader memory pbh = abi.decode(
      proposedBlock[0],
      (G1G2Data.ProposedBlockHeader)
    );
    _pickBuiltBlock(state, pbh, config);
    ProposedBlockHeaderLibrary.verify(pbh, config);
    _updateProposedBlockHeader(state, pbh, config);
    _saveProposal(state, pbh, config);
    emit BlockProposed(pbh.id, pbh);
  }

  function _insertBuiltBlock(
    G1G2Data.ChainState storage state,
    bytes32 contentHash
  ) private {
    require(contentHash != 0, "L1::build, invalid contentHash");
    bytes32 hash = _aggregateHash(uint64(block.number), contentHash);
    require(
      state.builtBlocks[msg.sender] != hash,
      "L1::build, already committed"
    );
    state.builtBlocks[msg.sender] = hash;
  }

  function _pickBuiltBlock(
    G1G2Data.ChainState storage state,
    G1G2Data.ProposedBlockHeader memory pbh,
    G1G2Data.Config memory config
  ) private {
    bytes32 contentHash = ProposedBlockHeaderLibrary.getBuilderFingerprint(pbh);
    bytes32 hash = _aggregateHash(pbh.buildHeight, contentHash);
    require(
      state.builtBlocks[msg.sender] == hash,
      "L1::propose, contentHash mismatch"
    );
    require(
      block.number >= pbh.buildHeight + config.buildDelayConfirms,
      "L1::propose, not enough confirmations"
    );
    delete state.builtBlocks[msg.sender];
  }

  function _aggregateHash(uint64 buildHeight, bytes32 contentHash)
    private
    pure
    returns (bytes32)
  {
    return keccak256(abi.encodePacked(buildHeight, contentHash));
  }

  function _updateProposedBlockHeader(
    G1G2Data.ChainState storage s,
    G1G2Data.ProposedBlockHeader memory pbh,
    G1G2Data.Config memory config
  ) private {
    require(
      s.nextIdToPropose <= s.lastOnChainId + config.maxProposedBlocks,
      "L1::propose, propose too many blocks"
    );
    require(
      pbh.content.length <= config.maxBytesPerTxList,
      "L1::propose, content size exceeds"
    );
    require(
      pbh.txListHash == keccak256(pbh.content),
      "L1::propose, txListHash mismatch"
    );
    pbh.l1Height = block.number - 1;
    pbh.l1Hash = blockhash(block.number - 1);
    pbh.timestamp = uint64(block.timestamp);
    pbh.mixDigest = bytes32(block.difficulty);
    pbh.id = s.nextIdToPropose++;
  }

  function _saveProposal(
    G1G2Data.ChainState storage state,
    G1G2Data.ProposedBlockHeader memory pbh,
    G1G2Data.Config memory config
  ) private {
    state.proposedBlocks[pbh.id % config.maxProposedBlocks] = G1G2Data
      .ProposedBlock({
        hash: ProposedBlockHeaderLibrary.hashme(pbh),
        proposer: msg.sender,
        proposedAt: pbh.timestamp
      });
  }
}
