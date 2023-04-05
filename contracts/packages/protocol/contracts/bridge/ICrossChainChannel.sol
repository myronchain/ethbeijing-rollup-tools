// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {G1G2Data} from "../library/LibData.sol";

interface ICrossChainChannel {
  struct MessageProof {
    bytes mkproof;
    G1G2Data.BlockHeader header;
  }

  struct MessageStatusProof {
    bytes mkproof;
    G1G2Data.BlockHeader header;
  }

  struct Message {
    // message id, filled by contract
    uint256 nonce;
    // msg.sender of `sendMessage` call, filled by contract
    address sender;
    // required, address on the destination chain of an OEA to receive ethers or a contract to receive a function call
    address target;
    // required
    // 1) If fee is set zero, only the owner can relay/retry the message on the destination chain;
    // 2) If the message is failed on the destination chain, the owner can refund ethers/erc20 tokens on the source chain.
    address owner;
    // optional
    // 1) If the target is an EOA, the value is transferred to the target;
    // 2) If the target is a contract and the function is payable, the value is the call value;
    // 3) If the target is a contract and the function is not payable, the value should be set zero.
    uint256 value;
    // optional.
    // 1) If the fee is set zero, only the owner can relay/retry the message, ensure that the owner has enough
    // ethers to relay/retry the message on the destination chain;
    // 2) If the message need to be handled by a relayer (owner does not have enough ethers to initiate a transaction,
    // or you just dont want to handle the message yourself and you would like the relayer help you relaying the message),
    // you should set enough fee to ensure that the relayer will handle the message
    uint256 fee;
    // optional.
    // 1) If target is an EOA, the data should be empty bytes.
    // 2) If the target is a contract, the data is the encoded input. (abi.encodeWithSelector(selector, args...)
    // or abi.encodeWithSignature(signature, args...))
    bytes data;
  }

  enum MessageStatus {
    NEW, // 0
    SUCCESS, // 1
    FAILED, // 2
    RETRYABLE // 3
  }

  event SentMessage(Message message);

  event RelayedMessage(bytes32 indexed messageHash);

  event FailedRelayedMessage(bytes32 indexed messageHash);

  event RetriedMessage(
    bytes32 indexed messageHash,
    MessageStatus indexed status
  );

  event EtherRefunded(
    bytes32 indexed messageHash,
    address recipient,
    uint256 amount
  );

  function sendMessage(
    address target,
    address owner,
    uint256 callValue,
    uint256 relayFee,
    bytes memory data
  ) external payable returns (bytes32 messageHash);

  function relayMessage(bytes calldata encodedMessage, bytes calldata proof)
    external;

  function retryMessage(bytes calldata encodedMessage, bool lastAttempt)
    external;

  function crossChainMessageSender() external returns (address);

  function isMessageReceived(
    bytes calldata encodedMessage,
    bytes calldata proof
  ) external view returns (bool);

  function isMessageFailedOnDestChain(
    bytes calldata encodedMessage,
    bytes calldata messageStatusProof
  ) external view returns (bool);

  function refundEther(
    bytes calldata encodedMessage,
    bytes calldata messageStatusProof
  ) external;
}
