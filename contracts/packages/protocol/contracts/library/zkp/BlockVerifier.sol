// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

abstract contract BlockVerifier {
  function verifyProofs() external view virtual returns (bool);
}

library LibZKP {
  function verify(
    bytes memory verificationKey,
    bytes32 parentStateRoot,
    bytes32 blkStateRoot,
    bytes32 blkDataHash,
    bytes memory zkproof
  ) internal pure {}
}
