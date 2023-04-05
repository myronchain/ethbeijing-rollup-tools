// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.15;

library G1G2Data {
  enum ProverType {
    ZKEVM
    // FRAUD
  }

  struct Proof {
    ProverType proverType;
    address prover;
    uint64 proveTime;
  }

  struct ProvenState {
    bytes32 blockHash;
    uint64 proposeTime;
    uint64 provenAt;
    Proof[] proofs;
  }

  struct ChainState {
    // proposer => aggregateHash
    mapping(address => bytes32) builtBlocks;
    // l2 block id => proposedBlock hash
    mapping(uint256 => ProposedBlock) proposedBlocks;
    // l2 blockId => l2 parentHash => ProvenState
    mapping(uint256 => mapping(bytes32 => ProvenState)) chain;
    // l2 block height => l2 block hash
    mapping(uint256 => bytes32) l2BlockHashes;
    uint256 l2ChainId;
    uint256 feeBase;
    uint64 genesisHeightOnL1;
    uint64 genesisTimestamp;
    uint64 statusBits;
    uint64 nextIdToPropose;
    uint64 lastProposedAt;
    uint64 lastOnChainId;
    uint64 lastOnChainHeight;
    uint64 avgProofTime;
    uint64 avgBlockTime;
    uint256[41] __gap;
  }

  struct InvalidBlockProofData {
    ProposedBlockHeader pbh;
    BlockHeader header;
    bytes placeholderReceiptInBytes;
    address prover;
    // proofs[0] - zk proof
    // proofs[1] - placeholderTxReceipt merkle proof
    bytes[] proofs;
  }

  struct ProofData {
    ProposedBlockHeader pbh;
    BlockHeader header;
    bytes prepareTxInBytes;
    bytes prepareTxReceiptInBytes;
    address prover;
    // proofs[0] - zk proof
    // proofs[1] - prepareTx merkle proof
    // proofs[2] - prepareTxReceipt merkle proof
    bytes[] proofs;
  }

  struct ProposedBlockHeader {
    uint256 id;
    uint256 l1Height;
    bytes32 l1Hash;
    address coinbase;
    uint64 gasLimit;
    uint64 timestamp;
    bytes32 txListHash;
    bytes32 mixDigest;
    bytes extraData;
    bytes content;
    uint64 buildHeight;
  }

  struct ProposedBlock {
    bytes32 hash;
    address proposer;
    uint64 proposedAt;
  }

  struct BlockHeader {
    bytes32 parentHash;
    bytes32 unclesHash;
    address coinbase;
    bytes32 root;
    bytes32 txHash;
    bytes32 receiptsHash;
    bytes32[8] bloom;
    uint256 difficulty;
    uint128 height;
    uint64 gasLimit;
    uint64 gasUsed;
    uint64 timestamp;
    bytes extraData;
    bytes32 mixDigest;
    uint64 nonce;
    uint256 baseFeePerGas;
  }

  struct Config {
    uint256 maxProposedBlocks;
    uint256 maxOnChainPerTx;
    uint256 buildDelayConfirms;
    uint256 blockMaxGasLimit;
    uint256 maxTransactionsPerBlock;
    uint256 maxBytesPerTxList;
    uint256 minTxGasLimit;
    uint256 prepareTxGasLimit;
    uint256 feePremiumLamda;
    uint256 rewardBurnBips;
    uint256 proposerDepositPctg;
    // Moving average factors
    uint256 feeBaseMAF;
    uint256 blockTimeMAF;
    uint256 proofTimeMAF;
    uint64 rewardMultiplierPctg;
    uint64 feeGracePeriodPctg;
    uint64 feeMaxPeriodPctg;
    uint64 blockTimeCap;
    uint64 proofTimeCap;
    uint64 boostrapDiscountHalvingPeriod;
    uint64 initialUncleDelay;
    bool enableTokenomics;
  }

  struct StateVariables {
    uint64 genesisHeight;
    uint64 lastOnChainId;
    uint64 lastOnChainHeight;
    uint64 nextBlockId;
  }
}
