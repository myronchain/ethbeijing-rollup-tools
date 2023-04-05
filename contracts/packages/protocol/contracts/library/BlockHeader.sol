// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {RLPWriter} from "../library/rlp/RLPWriter.sol";
import {G1G2Data} from "./LibData.sol";

library BlockHeaderLibrary {
  function hashme(G1G2Data.BlockHeader memory header)
    internal
    pure
    returns (bytes32)
  {
    bytes[] memory list;
    if (header.baseFeePerGas == 0) {
      list = new bytes[](15);
    } else {
      list = new bytes[](16);
    }
    list[0] = RLPWriter.writeHash(header.parentHash);
    list[1] = RLPWriter.writeHash(header.unclesHash);
    list[2] = RLPWriter.writeAddress(header.coinbase);
    list[3] = RLPWriter.writeHash(header.root);
    list[4] = RLPWriter.writeHash(header.txHash);
    list[5] = RLPWriter.writeHash(header.receiptsHash);
    list[6] = RLPWriter.writeBytes(abi.encodePacked(header.bloom));
    list[7] = RLPWriter.writeUint(header.difficulty);
    list[8] = RLPWriter.writeUint(header.height);
    list[9] = RLPWriter.writeUint64(header.gasLimit);
    list[10] = RLPWriter.writeUint64(header.gasUsed);
    list[11] = RLPWriter.writeUint64(header.timestamp);
    list[12] = RLPWriter.writeBytes(header.extraData);
    list[13] = RLPWriter.writeHash(header.mixDigest);
    list[14] = RLPWriter.writeBytes(abi.encodePacked(header.nonce));
    if (header.baseFeePerGas != 0) {
      list[15] = RLPWriter.writeUint(header.baseFeePerGas);
    }

    bytes memory rlpHeader = RLPWriter.writeList(list);
    return keccak256(rlpHeader);
  }

  function verifyProposal(
    G1G2Data.BlockHeader memory bh,
    G1G2Data.ProposedBlockHeader memory pbh,
    G1G2Data.Config memory config
  ) internal pure {
    require(
      bh.parentHash != 0 &&
        bh.coinbase == pbh.coinbase &&
        bh.difficulty == 0 &&
        bh.gasLimit == pbh.gasLimit + config.prepareTxGasLimit &&
        bh.gasUsed > 0 &&
        bh.timestamp == pbh.timestamp &&
        bh.extraData.length == pbh.extraData.length &&
        keccak256(bh.extraData) == keccak256(pbh.extraData) &&
        bh.mixDigest == pbh.mixDigest,
      "bh and pbh not match"
    );
  }
}

library ProposedBlockHeaderLibrary {
  function hashme(G1G2Data.ProposedBlockHeader memory pbh)
    internal
    pure
    returns (bytes32)
  {
    return keccak256(abi.encode(pbh));
  }

  function getBuilderFingerprint(G1G2Data.ProposedBlockHeader memory pbh)
    internal
    pure
    returns (bytes32)
  {
    return keccak256(abi.encode(pbh.txListHash, pbh.coinbase));
  }

  function verify(
    G1G2Data.ProposedBlockHeader memory pbh,
    G1G2Data.Config memory config
  ) internal pure {
    require(
      pbh.id == 0 &&
        pbh.l1Height == 0 &&
        pbh.l1Hash == 0 &&
        pbh.mixDigest == 0 &&
        pbh.timestamp == 0 &&
        pbh.coinbase != address(0) &&
        pbh.txListHash != 0,
      "pbh::verify, default values"
    );
    require(
      pbh.gasLimit <= config.blockMaxGasLimit,
      "pbh::verify, gasLimit exceeds"
    );

    // todo
    require(
      pbh.extraData.length <= 32,
      "pbh::verify, extraData length exceeds"
    );
  }
}
