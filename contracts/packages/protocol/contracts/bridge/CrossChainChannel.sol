// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {ICrossChainChannel} from "./ICrossChainChannel.sol";
import {IFBaseContract} from "../base/IFBaseContract.sol";
import {ChainConstants} from "../library/ChainConstants.sol";
import {LibTrieProof} from "../library/trie/LibTrieProof.sol";
import {BlockHeaderLibrary} from "../library/BlockHeader.sol";
import {IRemoteChain} from "../base/IRemoteChain.sol";
import {LibAddress} from "../library/LibAddress.sol";
import {G1G2Data} from "../library/LibData.sol";

contract CrossChainChannel is ICrossChainChannel, IFBaseContract {
  event PlaceHolderEventForExportAbi(MessageProof _mp);

  address private constant DEFAULT_CROSS_CHAIN_MESSAGE_SENDER =
    0x000000000000000000000000000000000000dEaD;

  uint256 public messageNonce;
  address private _crossChainMessageSender = DEFAULT_CROSS_CHAIN_MESSAGE_SENDER;
  mapping(bytes32 => bool) private _refunded;
  uint256[47] private __gap;

  /// allow receiving ETH directly.
  receive() external payable {}

  function init(address addressManager) external initializer {
    IFBaseContract._init(addressManager);
  }

  function sendMessage(
    address target,
    address owner,
    uint256 callValue,
    uint256 relayFee,
    bytes memory data
  ) external payable nonReentrant returns (bytes32 messageHash) {
    require(target != address(0), "sendMessage: target zero address");
    require(
      target != resolveRemote(ChainConstants.ADDR_KEY_CROSS_CHAIN_CHANNEL),
      "sendMessage: target cannot be remote channel"
    );
    require(owner != address(0), "sendMessage: owner zero address");
    require(
      callValue + relayFee == msg.value,
      "sendMessage: insufficient msg.value"
    );
    Message memory message;
    message.nonce = messageNonce++;
    message.sender = _msgSender();
    message.target = target;
    message.owner = owner;
    message.value = callValue;
    message.fee = relayFee;
    message.data = data;
    bytes memory encodedMessage = abi.encode(message);
    messageHash = keccak256(encodedMessage);
    require(
      !_isMessageSent(messageHash),
      "sendMessage: provided message has already been sent."
    );
    _markMessageSent(messageHash);
    emit SentMessage(message);
  }

  /**
   * Relay the bridge message on the destination chain.
   *
   * @param encodedMessage Encoded message (abi.encode(Message))
   * @param proof Encoded message proof (abi.encode(MessageProof))
   */
  function relayMessage(bytes calldata encodedMessage, bytes calldata proof)
    external
    nonReentrant
    whenNotPaused
  {
    Message memory message = abi.decode(encodedMessage, (Message));
    if (message.fee == 0) {
      require(
        _msgSender() == message.owner,
        "relayMessage: only message owner can relay this message"
      );
    }

    require(
      _verifyCrossChainMessage(encodedMessage, proof),
      "relayMessage: verify not pass"
    );

    bytes32 messageHash = keccak256(encodedMessage);
    require(
      _getMessageStatus(messageHash) == MessageStatus.NEW,
      "relayMessage: provided message has already been received."
    );

    require(
      message.target != address(this) && message.target != address(0),
      "relayMessage: invalid message target"
    );
    _crossChainMessageSender = message.sender;
    (bool success, ) = message.target.call{
      value: message.value,
      gas: gasleft()
    }(message.data);
    _crossChainMessageSender = DEFAULT_CROSS_CHAIN_MESSAGE_SENDER;

    if (message.fee > 0) {
      LibAddress.sendEther(_msgSender(), message.fee);
    }

    if (success) {
      _setMessageStatus(messageHash, MessageStatus.SUCCESS);
      emit RelayedMessage(messageHash);
    } else {
      _setMessageStatus(messageHash, MessageStatus.RETRYABLE);
      emit FailedRelayedMessage(messageHash);
    }
  }

  function retryMessage(bytes calldata encodedMessage, bool lastAttempt)
    external
    nonReentrant
    whenNotPaused
  {
    Message memory message = abi.decode(encodedMessage, (Message));
    if (message.fee == 0 || lastAttempt) {
      require(
        _msgSender() == message.owner,
        "retryMessage: only message owner can retry this message"
      );
    }

    bytes32 messageHash = keccak256(encodedMessage);
    require(
      _getMessageStatus(messageHash) == MessageStatus.RETRYABLE,
      "retryMessage: not retryable"
    );

    require(
      message.target != address(this) && message.target != address(0),
      "retryMessage: invalid message target"
    );
    _crossChainMessageSender = message.sender;
    (bool success, ) = message.target.call{
      value: message.value,
      gas: gasleft()
    }(message.data);
    _crossChainMessageSender = DEFAULT_CROSS_CHAIN_MESSAGE_SENDER;

    MessageStatus status;
    if (success) {
      status = MessageStatus.SUCCESS;
    } else if (lastAttempt) {
      status = MessageStatus.FAILED;
    } else {
      status = MessageStatus.RETRYABLE;
    }

    _setMessageStatus(messageHash, status);
    emit RetriedMessage(messageHash, status);
  }

  function crossChainMessageSender() external view returns (address) {
    require(
      _crossChainMessageSender != DEFAULT_CROSS_CHAIN_MESSAGE_SENDER,
      "crossChainMessageSender is not set."
    );
    return _crossChainMessageSender;
  }

  /**
   * refund ether if message is failed on dest chain
   */
  function refundEther(
    bytes calldata encodedMessage,
    bytes calldata messageStatusProof
  ) external nonReentrant {
    Message memory message = abi.decode(encodedMessage, (Message));
    require(message.owner != address(0), "refundEther: owner zero address");
    require(message.value > 0, "refundEther: zero value");
    require(
      isMessageFailedOnDestChain(encodedMessage, messageStatusProof),
      "refundEther: status not failed"
    );
    bytes32 messageHash = keccak256(encodedMessage);
    require(!_refunded[messageHash], "refundEther: already refunded");
    _refunded[messageHash] = true;
    LibAddress.sendEther(message.owner, message.value);
    emit EtherRefunded(messageHash, message.owner, message.value);
  }

  function isMessageReceived(
    bytes calldata encodedMessage,
    bytes calldata proof
  ) external view returns (bool) {
    return _verifyCrossChainMessage(encodedMessage, proof);
  }

  function isMessageFailedOnDestChain(
    bytes calldata encodedMessage,
    bytes calldata messageStatusProof
  ) public view returns (bool) {
    MessageStatusProof memory proof = abi.decode(
      messageStatusProof,
      (MessageStatusProof)
    );
    address remoteCrossChainChannel = resolveRemote(
      ChainConstants.ADDR_KEY_CROSS_CHAIN_CHANNEL
    );
    bytes32 messageHash = keccak256(encodedMessage);
    bytes32 storageSlot = _getMessageStatusSlot(messageHash);
    bytes32 value = bytes32(uint256(MessageStatus.FAILED));
    return
      _verifyMerkleProof({
        mkproof: proof.mkproof,
        header: proof.header,
        contractAddr: remoteCrossChainChannel,
        storageSlot: storageSlot,
        value: value
      });
  }

  /*********************
   * Private Functions *
   *********************/
  function _markMessageSent(bytes32 messageHash) private {
    assembly {
      sstore(messageHash, 1)
    }
  }

  function _isMessageSent(bytes32 messageHash)
    private
    view
    returns (bool sent)
  {
    uint256 value;
    assembly {
      value := sload(messageHash)
    }
    sent = value == 1;
  }

  function _getMessageStatus(bytes32 messageHash)
    private
    view
    returns (MessageStatus)
  {
    bytes32 slot = _getMessageStatusSlot(messageHash);
    MessageStatus status;
    assembly {
      status := sload(slot)
    }
    return status;
  }

  function _setMessageStatus(bytes32 messageHash, MessageStatus status)
    private
  {
    bytes32 slot = _getMessageStatusSlot(messageHash);
    assembly {
      sstore(slot, status)
    }
  }

  function _getMessageStatusSlot(bytes32 messageHash)
    private
    pure
    returns (bytes32)
  {
    return keccak256(abi.encodePacked("message_status", messageHash));
  }

  function _verifyMerkleProof(
    bytes memory mkproof,
    G1G2Data.BlockHeader memory header,
    address contractAddr,
    bytes32 storageSlot,
    bytes32 value
  ) private view returns (bool) {
    bytes32 otherSideChainHeaderHash = IRemoteChain(
      resolve(ChainConstants.ADDR_KEY_ROLLUP)
    ).getRemoteHeaderByNumber(header.height);
    if (
      otherSideChainHeaderHash == 0 ||
      otherSideChainHeaderHash != BlockHeaderLibrary.hashme(header)
    ) {
      return false;
    }
    bool verified = LibTrieProof.verify(
      header.root,
      contractAddr,
      storageSlot,
      value,
      mkproof
    );
    return verified;
  }

  function _verifyCrossChainMessage(
    bytes memory encodedMessage,
    bytes memory proof
  ) private view returns (bool) {
    MessageProof memory messageProof = abi.decode(proof, (MessageProof));
    address remoteCrossChainChannel = resolveRemote(
      ChainConstants.ADDR_KEY_CROSS_CHAIN_CHANNEL
    );
    bytes32 messageHash = keccak256(encodedMessage);
    bytes32 storageSlot = messageHash;
    bytes32 value = bytes32(uint256(1));
    return
      _verifyMerkleProof({
        mkproof: messageProof.mkproof,
        header: messageProof.header,
        contractAddr: remoteCrossChainChannel,
        storageSlot: storageSlot,
        value: value
      });
  }
}
