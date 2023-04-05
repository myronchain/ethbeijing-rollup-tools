// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

interface IRemoteChain {
  function getRemoteHeaderByNumber(uint256 number)
    external
    view
    returns (bytes32 hash);

  function getLatestRemoteHeader() external view returns (bytes32);
}
