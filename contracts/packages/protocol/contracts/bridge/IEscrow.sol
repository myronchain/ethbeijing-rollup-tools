// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {ICrossChainChannel} from "../bridge/ICrossChainChannel.sol";
import {IFBaseContract} from "../base/IFBaseContract.sol";
import {ChainConstants} from "../library/ChainConstants.sol";

abstract contract IEscrow is IFBaseContract {
  /*************
   *  Structs  *
   *************/
  struct L1StandardERC20 {
    address addr;
    string name;
    string symbol;
    uint8 decimals;
  }

  struct ERC20Deposited {
    address token;
    uint256 amount;
  }

  event ERC20Refunded(
    bytes32 messageHash,
    address indexed token,
    address indexed to,
    uint256 amount
  );

  mapping(bytes32 => ERC20Deposited) internal _deposits;
  uint256[49] private __gap;

  /*************
   * Modifiers *
   *************/

  modifier onlyFromRemoteEscrow() {
    address localCrossChainChannel = resolve(
      ChainConstants.ADDR_KEY_CROSS_CHAIN_CHANNEL
    );
    require(
      _msgSender() == localCrossChainChannel,
      "msg.sender not local cross chain channel"
    );
    address crossChainMessageSender = ICrossChainChannel(localCrossChainChannel)
      .crossChainMessageSender();
    address remoteEscrow = resolveRemote(ChainConstants.ADDR_KEY_ESCROW);
    require(
      crossChainMessageSender == remoteEscrow,
      "cross chain message sender not remote escrow"
    );
    _;
  }

  function sendCrossChainMessage(
    uint256 callValue,
    uint256 relayFee,
    address owner,
    bytes memory message
  ) internal returns (bytes32 messageHash) {
    messageHash = ICrossChainChannel(
      resolve(ChainConstants.ADDR_KEY_CROSS_CHAIN_CHANNEL)
    ).sendMessage{value: msg.value}({
      target: resolveRemote(ChainConstants.ADDR_KEY_ESCROW),
      owner: owner,
      callValue: callValue,
      relayFee: relayFee,
      data: message
    });
  }

  function refundEther(
    bytes calldata encodedMessage,
    bytes calldata messageStatusProof
  ) external nonReentrant {
    ICrossChainChannel(resolve(ChainConstants.ADDR_KEY_CROSS_CHAIN_CHANNEL))
      .refundEther(encodedMessage, messageStatusProof);
  }

  function refundERC20(
    bytes calldata encodedMessage,
    bytes calldata messageStatusProof
  ) external nonReentrant {
    ICrossChainChannel.Message memory message = abi.decode(
      encodedMessage,
      (ICrossChainChannel.Message)
    );
    require(message.owner != address(0), "refundERC20, owner zero address");
    bool isMessageFailed = ICrossChainChannel(
      resolve(ChainConstants.ADDR_KEY_CROSS_CHAIN_CHANNEL)
    ).isMessageFailedOnDestChain(encodedMessage, messageStatusProof);
    require(isMessageFailed, "refundERC20, status not failed");
    bytes32 messageHash = keccak256(encodedMessage);
    require(
      _deposits[messageHash].token != address(0),
      "refundERC20, already refunded"
    );
    ERC20Deposited memory deposit = _deposits[messageHash];
    delete _deposits[messageHash];
    if (deposit.amount > 0) {
      _refundERC20(deposit.token, message.owner, deposit.amount);
    }
    emit ERC20Refunded(
      messageHash,
      deposit.token,
      message.owner,
      deposit.amount
    );
  }

  function _refundERC20(
    address _token,
    address _to,
    uint256 _amount
  ) internal virtual;
}
