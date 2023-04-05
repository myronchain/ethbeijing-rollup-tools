// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {BlockHeaderLibrary, ProposedBlockHeaderLibrary} from "../../library/BlockHeader.sol";
import {ChainConstants} from "../../library/ChainConstants.sol";
import {AddressResolver} from "../../base/AddressResolver.sol";
import {Tx, TransactionLibrary} from "../../library/Transaction.sol";
import {ReceiptLibrary} from "../../library/Receipt.sol";
import {MerkleTrie} from "../../library/trie/MerkleTrie.sol";
import {RLPWriter} from "../../library/rlp/RLPWriter.sol";
import {G1G2Data} from "../../library/LibData.sol";
import {LibStatusBits} from "../../library/LibStatusBits.sol";

library LibProve {
  event BlockProven(
    uint256 indexed blockId,
    bytes32 indexed parentHash,
    bytes32 indexed blockHash,
    address prover
  );

  function prove(
    G1G2Data.ChainState storage state,
    G1G2Data.Config memory config,
    bytes[] calldata proofs,
    AddressResolver resolver
  ) public {
    require(proofs.length == 1, "L1::prove, proofs length mismatch");
    G1G2Data.ProofData memory pd = abi.decode(proofs[0], (G1G2Data.ProofData));
    _verifyProofData(pd, state, config, resolver);
    _prove(state, pd.pbh, pd.header, pd.prover, true);
  }

  function proveInvalid(
    G1G2Data.ChainState storage state,
    G1G2Data.Config memory config,
    bytes[] calldata proofs,
    AddressResolver resolver
  ) public {
    require(proofs.length == 1, "L1::proveInvalid, proofs length mismatch");
    G1G2Data.InvalidBlockProofData memory proofData = abi.decode(
      proofs[0],
      (G1G2Data.InvalidBlockProofData)
    );
    _verifyInvalidBlockProofData(proofData, state, config, resolver);
    _prove(state, proofData.pbh, proofData.header, proofData.prover, false);
  }

  function _verifyProofData(
    G1G2Data.ProofData memory pd,
    G1G2Data.ChainState storage s,
    G1G2Data.Config memory config,
    AddressResolver resolver
  ) private view {
    _verifyProposal(pd, s, config);
    _verifyPrepareTx(s, pd, config, resolver);
    _verifyPrepareReceipt(pd);
  }

  function _verifyProposal(
    G1G2Data.ProofData memory pd,
    G1G2Data.ChainState storage s,
    G1G2Data.Config memory config
  ) private view {
    uint256 id = pd.pbh.id;
    require(
      pd.proofs.length == 3,
      "L1::_verifyProposal, proofs length mismatch"
    );
    require(
      pd.prover != address(0),
      "L1::_verifyProposal, prover zero address"
    );
    require(
      id > s.lastOnChainId && id < s.nextIdToPropose,
      "L1::_verifyProposal, ProposedBlockHeader id out of range"
    );
    require(
      _getProposal(s, config, id).hash ==
        ProposedBlockHeaderLibrary.hashme(pd.pbh),
      "L1::_verifyProposal, ProposedBlockHeader hash mismatch"
    );
    BlockHeaderLibrary.verifyProposal(pd.header, pd.pbh, config);
  }

  function _verifyPrepareTx(
    G1G2Data.ChainState storage state,
    G1G2Data.ProofData memory pd,
    G1G2Data.Config memory config,
    AddressResolver resolver
  ) private view {
    Tx memory prepareTx = TransactionLibrary.decodeTx(
      pd.prepareTxInBytes,
      state.l2ChainId
    );
    require(prepareTx.txType == 0, "L1::_verifyPrepareTx, tx type is not zero");
    require(
      prepareTx.gasLimit == config.prepareTxGasLimit,
      "L1::_verifyPrepareTx, prepare tx gas limit mismatch"
    );
    require(
      prepareTx.r == ChainConstants.CONST_R,
      "L1::_verifyPrepareTx, prepare tx r mismatch"
    );

    address l2Rollup = resolver.resolveRemote(ChainConstants.ADDR_KEY_ROLLUP);
    require(
      prepareTx.destination != address(0) && prepareTx.destination == l2Rollup,
      "L1::_verifyPrepareTx, prepareTx destination not l2Rollup"
    );

    bytes32 h1 = keccak256(prepareTx.data);
    bytes32 h2 = keccak256(
      bytes.concat(
        ChainConstants.PREPARE_TX_SELECTOR,
        bytes32(pd.pbh.l1Height),
        pd.pbh.l1Hash
      )
    );
    require(h1 == h2, "L1::_verifyPrepareTx, prepareTx data mismatch");

    // check prepareTx is the first transaction in the block
    require(
      MerkleTrie.verifyInclusionProof(
        RLPWriter.writeUint(0),
        pd.prepareTxInBytes,
        pd.proofs[1],
        pd.header.txHash
      ),
      "L1::_verifyPrepareTx, prepare tx is not the first tx in block"
    );
  }

  function _verifyPrepareReceipt(G1G2Data.ProofData memory pd) private pure {
    ReceiptLibrary.Receipt memory receipt = ReceiptLibrary.decodeReceipt(
      pd.prepareTxReceiptInBytes
    );

    require(
      receipt.status == 1,
      "L1::_verifyPrepareReceipt, status not success"
    );
    require(
      MerkleTrie.verifyInclusionProof(
        RLPWriter.writeUint(0),
        pd.prepareTxReceiptInBytes,
        pd.proofs[2],
        pd.header.receiptsHash
      ),
      "L1::_verifyPrepareReceipt, receipt mkp not pass"
    );
  }

  function _verifyInvalidBlockProofData(
    G1G2Data.InvalidBlockProofData memory proofData,
    G1G2Data.ChainState storage state,
    G1G2Data.Config memory config,
    AddressResolver resolver
  ) public view {
    _verifyInvalidProposal(proofData, state, config);
    _verifyPlaceholderReceipt(proofData, resolver);
  }

  function _verifyInvalidProposal(
    G1G2Data.InvalidBlockProofData memory proofData,
    G1G2Data.ChainState storage state,
    G1G2Data.Config memory config
  ) private view {
    uint256 id = proofData.pbh.id;
    require(
      proofData.proofs.length == 2,
      "L1::_verifyInvalid, proofs length mismatch"
    );
    require(
      proofData.prover != address(0),
      "L1::_verifyInvalid, prover zero address"
    );
    require(
      id > state.lastOnChainId && id < state.nextIdToPropose,
      "L1::_verifyInvalid, blockId out of range"
    );
    require(
      _getProposal(state, config, id).hash ==
        ProposedBlockHeaderLibrary.hashme(proofData.pbh),
      "L1::_verifyInvalid, ProposedBlockHeader hash mismatch"
    );
  }

  function _verifyPlaceholderReceipt(
    G1G2Data.InvalidBlockProofData memory proofData,
    AddressResolver resolver
  ) private view {
    ReceiptLibrary.Receipt memory receipt = ReceiptLibrary.decodeReceipt(
      proofData.placeholderReceiptInBytes
    );
    require(
      receipt.status == 1,
      "L1::_verifyInvalid, receipt status not successful"
    );
    require(
      receipt.logs.length == 1,
      "L1::_verifyInvalid, receipt logs length mismatch"
    );
    ReceiptLibrary.Log memory log = receipt.logs[0];
    require(
      log.contractAddress ==
        resolver.resolveRemote(ChainConstants.ADDR_KEY_ROLLUP),
      "L1::_verifyInvalid, receipt contractAddress mismatch"
    );
    require(
      log.topics.length == 2,
      "L1::_verifyInvalid, log topics length mismatch"
    );
    require(
      log.topics[0] == ChainConstants.PLACEHOLDER_TX_LOG_TOPIC,
      "L1::_verifyInvalid, log topics[0] mismatch"
    );
    require(
      log.topics[1] == bytes32(proofData.pbh.id),
      "L1::_verifyInvalid, log topics[1] mismatch"
    );
    require(
      log.data.length == 0,
      "L1::_verifyInvalid, log data length mismatch"
    );
    require(
      MerkleTrie.verifyInclusionProof({
        _key: RLPWriter.writeUint(0),
        _value: proofData.placeholderReceiptInBytes,
        _proof: proofData.proofs[1],
        _root: proofData.header.receiptsHash
      }),
      "L1::_verifyInvalid, receipt merkle proof not pass"
    );
  }

  function _prove(
    G1G2Data.ChainState storage state,
    G1G2Data.ProposedBlockHeader memory pbh,
    G1G2Data.BlockHeader memory bh,
    address prover,
    bool isValidBlock
  ) private {
    // todo(zkp):
    G1G2Data.ProvenState storage ps = state.chain[pbh.id][bh.parentHash];
    bytes32 blockHash;
    if (isValidBlock) {
      blockHash = BlockHeaderLibrary.hashme(bh);
    } else {
      blockHash = ChainConstants.PLACEHOLDER_BLOCK_HASH;
    }
    if (ps.blockHash == 0) {
      ps.blockHash = blockHash;
      ps.proposeTime = pbh.timestamp;
    } else {
      if (ps.blockHash != blockHash) {
        LibStatusBits.setHalted(state, true);
        return;
      }
      revert("L1::_prove, only allow one prover");
    }

    G1G2Data.Proof memory p = G1G2Data.Proof({
      proverType: G1G2Data.ProverType.ZKEVM,
      prover: prover,
      proveTime: uint64(block.timestamp)
    });
    ps.proofs.push(p);
    emit BlockProven(pbh.id, bh.parentHash, blockHash, prover);
  }

  function _getProposal(
    G1G2Data.ChainState storage s,
    G1G2Data.Config memory config,
    uint256 i
  ) private view returns (G1G2Data.ProposedBlock memory) {
    return s.proposedBlocks[i % config.maxProposedBlocks];
  }
}
