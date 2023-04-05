// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.15;

library LibAddress {
  function sendEther(address to, uint256 amount) internal {
    if (amount > 0) {
      require(to != address(0), "sendEther: to zero address");
      (bool success, ) = payable(to).call{value: amount}("");
      require(success, "sendEther: send ether failed");
    }
  }
}
