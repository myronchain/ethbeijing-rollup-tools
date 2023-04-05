// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {MerkleTrie} from "../library/trie/MerkleTrie.sol";

library TestMerkleTrie {
  function verifyInclusionProof(
    bytes memory _key,
    bytes memory _value,
    bytes memory _proof,
    bytes32 _root
  ) public pure returns (bool _verified) {
    return MerkleTrie.verifyInclusionProof(_key, _value, _proof, _root);
  }

  function get(
    bytes memory _key,
    bytes memory _proof,
    bytes32 _root
  ) public pure returns (bool _exists, bytes memory _value) {
    return MerkleTrie.get(_key, _proof, _root);
  }
}
