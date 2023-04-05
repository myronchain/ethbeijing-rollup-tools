// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {IFBaseContract} from "../base/IFBaseContract.sol";
import {IRemoteChain} from "../base/IRemoteChain.sol";
import {ChainConstants} from "../library/ChainConstants.sol";

/// @author g1g2 <g1g2@g1g2.xyz>
contract L2Rollup is IFBaseContract, IRemoteChain {
  event RemoteHeaderSynced(uint256 indexed blockHeight, bytes32 blockHash);
  event PlaceHolderEvent(uint256 indexed id);

  uint256 constant MAX_ANCESTORS_TO_CONSIDER = 10;

  mapping(uint256 => bytes32) private l2Hashes;
  mapping(uint256 => bytes32) private l1Hashes;
  bytes32 private ancestorsHash;
  bytes32 private latestL1Hash;

  uint256[46] private __gap;

  function init(address _addressManager) external initializer {
    require(block.chainid != 0, "L2Rollup::init, zero chainId");
    IFBaseContract._init(_addressManager);

    uint256 curr = block.number;
    bytes32[MAX_ANCESTORS_TO_CONSIDER] memory ancestors;
    for (
      uint256 i = 0;
      i < MAX_ANCESTORS_TO_CONSIDER && curr >= i + 1; /*cur - i - 1 >= 0*/
      ++i
    ) {
      uint256 h = curr - i - 1;
      ancestors[h % MAX_ANCESTORS_TO_CONSIDER] = blockhash(h);
    }
    ancestorsHash = _hashAncestors(block.chainid, curr, 0, ancestors);
  }

  function prepareTransaction(uint256 l1Height, bytes32 l1Hash) external {
    require(
      _msgSender() == ChainConstants.CONST_ADDRESS,
      "L2Rollup::prepare tx, wrong sender"
    );
    require(tx.gasprice == 0, "L2Rollup::prepare tx gas price should be zero");
    _ensureNoInterrupt();

    l1Hashes[l1Height] = l1Hash;
    latestL1Hash = l1Hash;
    emit RemoteHeaderSynced(l1Height, l1Hash);
  }

  function placeholderTransaction(uint256 id) external {
    require(
      _msgSender() == ChainConstants.CONST_ADDRESS,
      "L2Rollup::placeholder tx, wrong sender"
    );
    require(
      tx.gasprice == 0,
      "L2Rollup::placeholderTransaction, tx gasprice not zero"
    );
    _ensureNoInterrupt();
    emit PlaceHolderEvent(id);
  }

  function getBlockHash(uint256 number) public view returns (bytes32) {
    if (number >= block.number) {
      return 0;
    } else if (number < block.number && number >= block.number - 256) {
      return blockhash(number);
    } else {
      return l2Hashes[number];
    }
  }

  function getRemoteHeaderByNumber(uint256 number)
    external
    view
    returns (bytes32 hash)
  {
    return l1Hashes[number];
  }

  function getLatestRemoteHeader() external view returns (bytes32) {
    return latestL1Hash;
  }

  function _ensureNoInterrupt() private {
    require(
      block.number > 0,
      "L2Rollup::_ensureNoInterrupt, block number should > 0"
    );
    uint256 chainId = block.chainid;

    uint256 curr = block.number;
    uint256 parentHeight = curr - 1;
    bytes32[MAX_ANCESTORS_TO_CONSIDER] memory ancestors;
    for (
      uint256 i = 0;
      i < MAX_ANCESTORS_TO_CONSIDER && parentHeight >= i + 1; /*parentHeight - i - 1 >= 0*/
      ++i
    ) {
      uint256 h = parentHeight - i - 1;
      ancestors[h % MAX_ANCESTORS_TO_CONSIDER] = blockhash(h);
    }
    require(
      ancestorsHash == _hashAncestors(chainId, parentHeight, 0, ancestors),
      "ancestorsHash mismatch"
    );

    bytes32 parentHash = blockhash(parentHeight);
    ancestors[parentHeight % MAX_ANCESTORS_TO_CONSIDER] = parentHash;
    ancestorsHash = _hashAncestors(chainId, block.number, 0, ancestors);

    l2Hashes[parentHeight] = parentHash;
  }

  function _hashAncestors(
    uint256 chainId,
    uint256 number,
    uint256 baseFee,
    bytes32[MAX_ANCESTORS_TO_CONSIDER] memory ancestors
  ) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(chainId, number, baseFee, ancestors));
  }
}
