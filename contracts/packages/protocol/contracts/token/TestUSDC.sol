// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract TestUSDC is ERC20Upgradeable {
  function init(address faucet_) external initializer {
    ERC20Upgradeable.__ERC20_init({
      name_: "Test USD Coin",
      symbol_: "TestUSDC"
    });
    ERC20Upgradeable._mint({account: faucet_, amount: 10**27});
  }
}
