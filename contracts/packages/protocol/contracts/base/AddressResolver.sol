// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {IAddressManager} from "./IAddressManager.sol";

/**
 * This abstract contract provide a name-to-address lookup.
 */
abstract contract AddressResolver is ContextUpgradeable {
  IAddressManager internal _addressManager;

  uint256[49] private __gap;

  function _init(address addressManager_) internal virtual {
    ContextUpgradeable.__Context_init_unchained();
    _addressManager = IAddressManager(addressManager_);
  }

  /**
   * @notice Resolve a name to an address.
   * @dev This function will throw if the resolved address is `address(0)`.
   * @param name The name to resolve.
   * @return addr The name's corresponding address.
   */
  function resolve(string memory name) public view returns (address addr) {
    addr = _addressManager.getAddress(name);
    require(
      addr != address(0),
      string(abi.encodePacked("address of ", name, " is not set"))
    );
  }

  /**
   * @notice Resolve a name to an address on the paired chain.
   * @dev This function will throw if the resolved address is `address(0)`.
   * @param name The name to resolve.
   * @return addr The name's corresponding address on paired chain.
   */
  function resolveRemote(string memory name)
    public
    view
    returns (address addr)
  {
    addr = _addressManager.getRemoteAddress(name);
    require(
      addr != address(0),
      string(abi.encodePacked("remote address of ", name, " is not set"))
    );
  }
}
