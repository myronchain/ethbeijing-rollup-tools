// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {RLPReader} from "./rlp/RLPReader.sol";
import {Bytes} from "./Bytes.sol";

library ReceiptLibrary {
  struct Receipt {
    uint64 status;
    uint64 cumulativeGasUsed;
    bytes32[8] logsBloom;
    Log[] logs;
  }

  struct Log {
    address contractAddress;
    bytes32[] topics;
    bytes data;
  }

  function decodeReceipt(bytes calldata encoded)
    public
    pure
    returns (Receipt memory receipt)
  {
    // Non-legacy transaction receipts should first remove the type prefix.
    RLPReader.RLPItem[] memory rlpItems = RLPReader.readList(
      encoded[0] >= 0x0 && encoded[0] <= 0x7f
        ? Bytes.slice(encoded, 1)
        : encoded
    );

    require(rlpItems.length == 4, "invalid items length");

    receipt.status = uint64(RLPReader.readUint256(rlpItems[0]));
    receipt.cumulativeGasUsed = uint64(RLPReader.readUint256(rlpItems[1]));
    receipt.logsBloom = decodeLogsBloom(rlpItems[2]);
    receipt.logs = decodeLogs(RLPReader.readList(rlpItems[3]));
  }

  function decodeLogsBloom(RLPReader.RLPItem memory logsBloomRlp)
    internal
    pure
    returns (bytes32[8] memory logsBloom)
  {
    bytes memory bloomBytes = RLPReader.readBytes(logsBloomRlp);
    require(bloomBytes.length == 256, "invalid logs bloom");

    return abi.decode(bloomBytes, (bytes32[8]));
  }

  function decodeLogs(RLPReader.RLPItem[] memory logsRlp)
    internal
    pure
    returns (Log[] memory)
  {
    Log[] memory logs = new Log[](logsRlp.length);

    for (uint256 i = 0; i < logsRlp.length; i++) {
      RLPReader.RLPItem[] memory rlpItems = RLPReader.readList(logsRlp[i]);
      logs[i].contractAddress = RLPReader.readAddress(rlpItems[0]);
      logs[i].topics = decodeTopics(RLPReader.readList(rlpItems[1]));
      logs[i].data = RLPReader.readBytes(rlpItems[2]);
    }

    return logs;
  }

  function decodeTopics(RLPReader.RLPItem[] memory topicsRlp)
    internal
    pure
    returns (bytes32[] memory)
  {
    bytes32[] memory topics = new bytes32[](topicsRlp.length);

    for (uint256 i = 0; i < topicsRlp.length; i++) {
      topics[i] = RLPReader.readBytes32(topicsRlp[i]);
    }

    return topics;
  }
}
