// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.15;

library ChainConstants {
  address public constant ADDRESS_ZERO = address(0);
  bytes32 internal constant PLACEHOLDER_TX_LOG_TOPIC =
    keccak256("PlaceHolderEvent(uint256)");
  bytes32 internal constant PLACEHOLDER_BLOCK_HASH = bytes32(uint256(1));
  bytes4 internal constant PREPARE_TX_SELECTOR =
    bytes4(keccak256("prepareTransaction(uint256,bytes32)"));
  uint256 public constant CONST_PRIVATE_KEY =
    0x5e88cebdaba885b6e51f2a5a2e1235f4d052731fe6fedf5944cdfe6ba77cee94;
  address public constant CONST_ADDRESS =
    0xbeA425e1F0b651128Df27C4Fcd6E707deB055FEa;
  uint256 public constant CONST_R =
    0x5cbdf0646e5db4eaa398f365f2ea7a0e3d419b7e0330e39ce92bddedcac4f9bc;

  // ============== AddressManager ADDRESS KEY =====================
  string internal constant ADDR_KEY_ROLLUP = "rollup";
  string internal constant ADDR_KEY_CROSS_CHAIN_CHANNEL = "cross_chain_channel";
  string internal constant ADDR_KEY_ESCROW = "escrow";
  // ===============================================================
}
