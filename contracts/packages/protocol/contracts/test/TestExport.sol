// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {RLPWriter} from "../library/rlp/RLPWriter.sol";
import {TransactionLibrary, TxList} from "../library/Transaction.sol";

/**
 * Export internal method as public, only for testing.
 */
contract TestExport {
  // add blockheader here
  // add rollup state here

  // transaction
  function decodeTxList(bytes calldata encoded, uint256 chainId)
    public
    pure
    returns (TxList memory txList)
  {
    return TransactionLibrary.decodeTxList(encoded, chainId);
  }

  // RLP writer
  function writeBytes(bytes memory input)
    public
    pure
    returns (bytes memory output)
  {
    return RLPWriter.writeBytes(input);
  }

  function writeList(bytes[] memory input)
    public
    pure
    returns (bytes memory output)
  {
    return RLPWriter.writeList(input);
  }

  function writeString(string memory input)
    public
    pure
    returns (bytes memory output)
  {
    return RLPWriter.writeString(input);
  }

  function writeAddress(address input)
    public
    pure
    returns (bytes memory output)
  {
    return RLPWriter.writeAddress(input);
  }

  function writeUint(uint256 input) public pure returns (bytes memory output) {
    return RLPWriter.writeUint(input);
  }

  function writeBool(bool input) public pure returns (bytes memory output) {
    return RLPWriter.writeBool(input);
  }
}
