// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.15;

import "./LibData.sol";

library LibStatusBits {
  event Halted(bool halted);

  uint64 private constant HALT_MASK = 1 << 0;

  function _setBit(
    G1G2Data.ChainState storage state,
    uint64 mask,
    bool one
  ) private {
    state.statusBits = one ? state.statusBits | mask : state.statusBits & ~mask;
  }

  function _isBitOne(G1G2Data.ChainState storage state, uint64 mask)
    private
    view
    returns (bool)
  {
    return state.statusBits & mask != 0;
  }

  function setHalted(G1G2Data.ChainState storage state, bool halted) internal {
    require(
      isHalted(state) != halted,
      "LibStatusBits::setHalted, halted already set"
    );
    _setBit(state, HALT_MASK, halted);
    emit Halted(halted);
  }

  function isHalted(G1G2Data.ChainState storage state)
    internal
    view
    returns (bool)
  {
    return _isBitOne(state, HALT_MASK);
  }
}
