// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.15;

import "./LibData.sol";

// destination path: g1g2-contracts/packages/protocol/contracts/library/LibConfig.sol
library LibConfig {
  function getConfig() internal pure returns (G1G2Data.Config memory) {
    return
      G1G2Data.Config({
        maxProposedBlocks: 4096, // up to 4096 pending blocks
        maxOnChainPerTx: 100,
        buildDelayConfirms: 0,
        blockMaxGasLimit: 12000000,
        maxTransactionsPerBlock: 500,
        maxBytesPerTxList: 100000,
        minTxGasLimit: 21000,
        prepareTxGasLimit: 250000,
        feePremiumLamda: 590,
        rewardBurnBips: 100, // 100 basis points or 1%
        proposerDepositPctg: 25, // 25%
        // Moving average factors
        feeBaseMAF: 1024,
        blockTimeMAF: 1024,
        proofTimeMAF: 1024,
        rewardMultiplierPctg: 400, // 400%
        feeGracePeriodPctg: 125, // 125%
        feeMaxPeriodPctg: 375, // 375%
        blockTimeCap: 48 seconds,
        proofTimeCap: 60 minutes,
        boostrapDiscountHalvingPeriod: 180 days,
        initialUncleDelay: 60 minutes,
        enableTokenomics: false
      });
  }
}
