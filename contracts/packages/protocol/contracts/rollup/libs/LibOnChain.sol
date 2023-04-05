// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {G1G2Data} from "../../library/LibData.sol";
import {ChainConstants} from "../../library/ChainConstants.sol";

library LibOnChain {
  event BlockOnChain(uint256 indexed blockId, bytes32 blockHash);
  event RemoteHeaderSynced(uint256 indexed blockHeight, bytes32 blockHash);

  function init(
    G1G2Data.ChainState storage state,
    uint256 l2ChainId,
    bytes32 genesisHash
  ) public {
    state.l2ChainId = l2ChainId;
    state.l2BlockHashes[0] = genesisHash;
    state.genesisHeightOnL1 = uint64(block.number);
    state.genesisTimestamp = uint64(block.timestamp);
    state.nextIdToPropose = 1;
    state.lastProposedAt = uint64(block.timestamp);
    emit RemoteHeaderSynced(0, genesisHash);
    emit BlockOnChain(0, genesisHash);
  }

  function onchain(G1G2Data.ChainState storage state, uint256 maxPerBatch)
    public
  {
    uint64 currHeight = state.lastOnChainHeight;
    bytes32 currHash = state.l2BlockHashes[currHeight];
    uint64 lastOnChainId = state.lastOnChainId;
    uint64 currId = lastOnChainId;

    while (
      currId + 1 < state.nextIdToPropose &&
      currId + 1 - lastOnChainId <= maxPerBatch
    ) {
      G1G2Data.ProvenState storage ps = state.chain[currId + 1][currHash];
      if (ps.blockHash != 0) {
        // block has been proven
        currId++;
        if (ps.blockHash == ChainConstants.PLACEHOLDER_BLOCK_HASH) {
          // proven invalid
          emit BlockOnChain(currId, ps.blockHash);
        } else {
          // proven valid
          currHeight += 1;
          currHash = ps.blockHash;
          emit BlockOnChain(currId, ps.blockHash);
        }
      } else {
        break;
      }
    }

    if (currId > lastOnChainId) {
      state.lastOnChainId = currId;
    }
    if (currHeight > state.lastOnChainHeight) {
      state.lastOnChainHeight = currHeight;
      state.l2BlockHashes[currHeight] = currHash;
      emit RemoteHeaderSynced(currHeight, currHash);
    }
  }
}
