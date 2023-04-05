// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract AddressManager is OwnableUpgradeable {
  event AddressSet(string name, address newAddress, address oldAddress);
  event RemoteAddressSet(string name, address newAddress, address oldAddress);

  mapping(bytes32 => address) private addresses;
  mapping(bytes32 => address) private remoteAddresses;
  uint256[48] private __gap;

  function init() external initializer {
    OwnableUpgradeable.__Ownable_init();
  }

  function setAddress(string memory name, address addr) external onlyOwner {
    bytes32 nameHash = _nameHash(name);
    address oldAddr = addresses[nameHash];
    require(addr != oldAddr, "address not change");
    addresses[nameHash] = addr;
    emit AddressSet(name, addr, oldAddr);
  }

  function getAddress(string memory name) external view returns (address) {
    bytes32 nameHash = _nameHash(name);
    return addresses[nameHash];
  }

  function setRemoteAddress(string memory name, address addr)
    external
    onlyOwner
  {
    bytes32 nameHash = _nameHash(name);
    address oldAddr = remoteAddresses[nameHash];
    require(addr != oldAddr, "address not change");
    remoteAddresses[nameHash] = addr;
    emit RemoteAddressSet(name, addr, oldAddr);
  }

  function getRemoteAddress(string memory name)
    external
    view
    returns (address)
  {
    bytes32 nameHash = _nameHash(name);
    return remoteAddresses[nameHash];
  }

  function _nameHash(string memory name) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(name));
  }
}
