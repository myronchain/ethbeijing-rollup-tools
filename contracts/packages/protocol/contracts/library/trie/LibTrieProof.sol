// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.15;

import {SecureMerkleTrie} from "./SecureMerkleTrie.sol";
import {RLPReader} from "../rlp/RLPReader.sol";
import {RLPWriter} from "../rlp/RLPWriter.sol";

library LibTrieProof {
  /*********************
   * Constants         *
   *********************/

  // The consensus format representing account is RLP encoded in the following order:
  // nonce, balance, storageHash, codeHash.
  uint256 private constant ACCOUNT_FIELD_INDEX_STORAGE_HASH = 2;

  /*********************
   * Public Functions  *
   *********************/

  /**
   * @notice Verifies that the value of a slot `key` in the storage tree of `addr` is `value`
   * @param stateRoot The merkle root of state tree.
   * @param addr The contract address.
   * @param key The slot in the contract.
   * @param value The value to be verified.
   * @param mkproof The proof obtained by encoding state proof and storage proof.
   */
  function verify(
    bytes32 stateRoot,
    address addr,
    bytes32 key,
    bytes32 value,
    bytes memory mkproof
  ) internal pure returns (bool) {
    (bytes memory accountProof, bytes memory storageProof) = abi.decode(
      mkproof,
      (bytes, bytes)
    );

    (bool exists, bytes memory rlpAccount) = SecureMerkleTrie.get(
      abi.encodePacked(addr),
      accountProof,
      stateRoot
    );

    require(exists, "LTP::verify, invalid account proof");

    RLPReader.RLPItem[] memory accountState = RLPReader.readList(rlpAccount);
    bytes32 storageRoot = RLPReader.readBytes32(
      accountState[ACCOUNT_FIELD_INDEX_STORAGE_HASH]
    );

    bool verified = SecureMerkleTrie.verifyInclusionProof(
      abi.encodePacked(key),
      RLPWriter.writeBytes32(value),
      storageProof,
      storageRoot
    );
    return verified;
  }
}
