// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {AddressResolver} from "./AddressResolver.sol";

/**
 * This abstract contract serves as the base contract for rollup contracts.
 */
abstract contract IFBaseContract is
  ReentrancyGuardUpgradeable,
  OwnableUpgradeable,
  PausableUpgradeable,
  AddressResolver
{
  function _init(address _addressManager) internal virtual override {
    ReentrancyGuardUpgradeable.__ReentrancyGuard_init();
    OwnableUpgradeable.__Ownable_init();
    PausableUpgradeable.__Pausable_init();
    AddressResolver._init(_addressManager);
  }

  modifier onlyEOA() {
    require(tx.origin == _msgSender(), "Not EOA");
    _;
  }

  function pause() external onlyOwner {
    _pause();
  }

  function unpause() external onlyOwner {
    _unpause();
  }
}
