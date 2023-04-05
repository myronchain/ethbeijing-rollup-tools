// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.15;

import {G1G2Data} from "./LibData.sol";

library LibTokenomics {
  // Implement "Incentive Multipliers", see the whitepaper.
  function getTimeAdjustedFee(
    G1G2Data.ChainState storage state,
    G1G2Data.Config memory config,
    bool isProposal,
    uint64 tNow,
    uint64 tLast,
    uint64 tAvg
  ) internal view returns (uint256 newFeeBase, uint256 tRelBp) {
    if (tAvg == 0) {
      newFeeBase = state.feeBase;
      tRelBp = 0;
    } else {
      uint256 _tAvg = tAvg > config.proofTimeCap ? config.proofTimeCap : tAvg;
      uint256 tGrace = (config.feeGracePeriodPctg * _tAvg) / 100;
      uint256 tMax = (config.feeMaxPeriodPctg * _tAvg) / 100;
      uint256 a = tLast + tGrace;
      uint256 b = tNow > a ? tNow - a : 0;
      tRelBp = (_min(b, tMax) * 10000) / tMax;
      // [0 - 10000]
      uint256 alpha = 10000 +
        ((config.rewardMultiplierPctg - 100) * tRelBp) /
        100;
      if (isProposal) {
        newFeeBase = (state.feeBase * 10000) / alpha;
        // fee
      } else {
        newFeeBase = (state.feeBase * alpha) / 10000;
        // reward
      }
    }
  }

  // Implement "Slot-availability Multipliers", see the whitepaper.
  function getSlotsAdjustedFee(
    G1G2Data.ChainState storage state,
    G1G2Data.Config memory config,
    bool isProposal,
    uint256 feeBase
  ) internal view returns (uint256) {
    // m is the `n'` in the whitepaper
    uint256 m = config.maxProposedBlocks - 1 + config.feePremiumLamda;
    // n is the number of unverified blocks
    uint256 n = state.nextIdToPropose - state.lastOnChainId - 1;
    // k is `m − n + 1` or `m − n - 1`in the whitepaper
    uint256 k = isProposal ? m - n - 1 : m - n + 1;
    return (feeBase * (m - 1) * m) / (m - n) / k;
  }

  // Implement "Bootstrap Discount Multipliers", see the whitepaper.
  function getBootstrapDiscountedFee(
    G1G2Data.ChainState storage state,
    G1G2Data.Config memory config,
    uint256 feeBase
  ) internal view returns (uint256) {
    uint256 halves = uint256(block.timestamp - state.genesisTimestamp) /
      config.boostrapDiscountHalvingPeriod;
    uint256 gamma = 1024 - (1024 >> halves);
    return (feeBase * gamma) / 1024;
  }

  function getUncleProofDelay(
    G1G2Data.ChainState storage state,
    G1G2Data.Config memory config,
    uint256 blockId
  ) internal view returns (uint64) {
    if (blockId <= 2 * config.maxProposedBlocks) {
      return config.initialUncleDelay;
    } else {
      return state.avgProofTime;
    }
  }

  // Returns a deterministic deadline for uncle proof submission.
  function getUncleProofDeadline(
    G1G2Data.ChainState storage state,
    G1G2Data.Config memory config,
    G1G2Data.ProvenState storage provenState,
    uint256 blockId
  ) internal view returns (uint64) {
    return provenState.provenAt + getUncleProofDelay(state, config, blockId);
  }

  function movingAverage(
    uint256 maValue,
    uint256 newValue,
    uint256 maf
  ) internal pure returns (uint256) {
    if (maValue == 0) {
      return newValue;
    }
    uint256 _ma = (maValue * (maf - 1) + newValue) / maf;
    return _ma > 0 ? _ma : maValue;
  }

  function _min(uint256 a, uint256 b) private pure returns (uint256) {
    return a < b ? a : b;
  }
}
