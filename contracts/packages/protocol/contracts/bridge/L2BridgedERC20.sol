// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract L2BridgedERC20 is Ownable, ERC20 {
  event BridgedBurn(address indexed from, uint256 amount);
  event BridgedMint(address indexed to, uint256 amount);

  uint8 private _decimals;

  constructor(
    string memory name,
    string memory symbol,
    uint8 decimals_
  ) ERC20(name, symbol) {
    _decimals = decimals_;
  }

  function decimals() public view override returns (uint8) {
    return _decimals;
  }

  function burnFrom(address from, uint256 amount) external onlyOwner {
    ERC20._burn(from, amount);
    emit BridgedBurn(from, amount);
  }

  function mintTo(address to, uint256 amount) external onlyOwner {
    ERC20._mint(to, amount);
    emit BridgedMint(to, amount);
  }
}
