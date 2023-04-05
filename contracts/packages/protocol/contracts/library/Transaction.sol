// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {RLPReader} from "./rlp/RLPReader.sol";
import {Bytes} from "./Bytes.sol";
import {LibConfig} from "./LibConfig.sol";

/// @author g1g2 <g1g2@g1g2.xyz>
struct Tx {
  uint8 txType;
  address destination;
  bytes data;
  uint256 gasLimit;
  uint8 v;
  uint256 r;
  uint256 s;
  bytes txData;
}

struct TxList {
  Tx[] items;
}

library TransactionLibrary {
  struct EthTransaction {
    uint256 nonce;
    uint256 gasPrice;
    uint256 gasLimit;
    address destination;
    uint256 amount;
    bytes data;
    uint8 v;
    uint256 r;
    uint256 s;
  }

  /**
   * We introduce a new EIP-2718 transaction type, with the format 0x01 || rlp([chainId, nonce, gasPrice, gasLimit, to, value, data, accessList, signatureYParity, signatureR, signatureS]).
   */
  struct EIP2930 {
    uint256 chainId;
    uint256 nonce;
    uint256 gasPrice;
    uint256 gasLimit;
    address to;
    uint256 value;
    bytes data;
    AccessItem[] accessList;
    uint8 signatureYParity;
    uint256 signatureR;
    uint256 signatureS;
  }

  /**
   * We introduce a new EIP-2718 transaction type, with the format 0x02 || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, destination, amount, data, access_list, signature_y_parity, signature_r, signature_s]).
   */
  struct EIP1559 {
    uint256 chainId;
    uint256 nonce;
    uint256 maxPriorityFeePerGas;
    uint256 maxFeePerGas;
    uint256 gasLimit;
    address destination;
    uint256 amount;
    bytes data;
    AccessItem[] accessList;
    uint8 signatureYParity;
    uint256 signatureR;
    uint256 signatureS;
  }

  struct AccessItem {
    address addr;
    bytes32[] slots;
  }

  function decodeTxList(bytes calldata encoded, uint256 chainId)
    public
    pure
    returns (TxList memory txList)
  {
    RLPReader.RLPItem[] memory txs = RLPReader.readList(encoded);
    require(txs.length > 0, "empty txList");

    Tx[] memory _txList = new Tx[](txs.length);
    for (uint256 i = 0; i < txs.length; i++) {
      _txList[i] = decodeTx(RLPReader.readBytes(txs[i]), chainId);
    }

    txList = TxList(_txList);
  }

  function decodeTx(bytes memory txBytes, uint256 chainId)
    public
    pure
    returns (Tx memory _tx)
  {
    uint8 txType;
    assembly {
      txType := byte(0, mload(add(txBytes, 32)))
    }

    _tx.txData = txBytes;

    // see eip-2718 for typed transaction envelope.
    if (txType >= 0xc0 && txType <= 0xfe) {
      _tx.txType = 0;
      RLPReader.RLPItem[] memory txBody = RLPReader.readList(txBytes);
      EthTransaction memory ethTx = decodeEthTx(txBody, chainId);
      _tx.gasLimit = ethTx.gasLimit;
      _tx.destination = ethTx.destination;
      _tx.v = ethTx.v;
      _tx.r = ethTx.r;
      _tx.s = ethTx.s;
      _tx.data = ethTx.data;
    } else if (txType <= 0x7f) {
      _tx.txType = txType;
      RLPReader.RLPItem[] memory txBody = RLPReader.readList(
        Bytes.slice(txBytes, 1)
      );

      if (txType == 1) {
        EIP2930 memory eip2930 = decodeEIP2930(txBody);
        _tx.gasLimit = eip2930.gasLimit;
        _tx.destination = eip2930.to;
        _tx.v = eip2930.signatureYParity;
        _tx.r = eip2930.signatureR;
        _tx.s = eip2930.signatureS;
        _tx.data = eip2930.data;
      } else if (_tx.txType == 2) {
        EIP1559 memory eip1559 = decodeEIP1559(txBody);
        _tx.gasLimit = eip1559.gasLimit;
        _tx.destination = eip1559.destination;
        _tx.v = eip1559.signatureYParity;
        _tx.r = eip1559.signatureR;
        _tx.s = eip1559.signatureS;
        _tx.data = eip1559.data;
      } else {
        revert("invalid txType");
      }
    } else {
      revert("invalid prefix");
    }
  }

  function decodeEIP1559(RLPReader.RLPItem[] memory body)
    internal
    pure
    returns (EIP1559 memory eip1559)
  {
    require(body.length == 12, "invalid items length");

    eip1559.chainId = RLPReader.readUint256(body[0]);
    eip1559.nonce = RLPReader.readUint256(body[1]);
    eip1559.maxPriorityFeePerGas = RLPReader.readUint256(body[2]);
    eip1559.maxFeePerGas = RLPReader.readUint256(body[3]);
    eip1559.gasLimit = RLPReader.readUint256(body[4]);
    eip1559.destination = RLPReader.readAddress(body[5]);
    eip1559.amount = RLPReader.readUint256(body[6]);
    eip1559.data = RLPReader.readBytes(body[7]);
    eip1559.accessList = decodeAccessList(RLPReader.readList(body[8]));
    eip1559.signatureYParity = uint8(RLPReader.readUint256(body[9]));
    eip1559.signatureR = RLPReader.readUint256(body[10]);
    eip1559.signatureS = RLPReader.readUint256(body[11]);
  }

  function decodeAccessList(RLPReader.RLPItem[] memory accessListRLP)
    internal
    pure
    returns (AccessItem[] memory accessList)
  {
    accessList = new AccessItem[](accessListRLP.length);
    for (uint256 i = 0; i < accessListRLP.length; i++) {
      RLPReader.RLPItem[] memory items = RLPReader.readList(accessListRLP[i]);
      address addr = RLPReader.readAddress(items[0]);
      RLPReader.RLPItem[] memory slotListRLP = RLPReader.readList(items[1]);
      bytes32[] memory slots = new bytes32[](slotListRLP.length);
      for (uint256 j = 0; j < slotListRLP.length; j++) {
        slots[j] = RLPReader.readBytes32(slotListRLP[j]);
      }
      accessList[i] = AccessItem(addr, slots);
    }
  }

  function decodeEthTx(RLPReader.RLPItem[] memory body, uint256 chainId)
    internal
    pure
    returns (EthTransaction memory ethTx)
  {
    require(body.length == 9, "invalid items length");

    ethTx.nonce = RLPReader.readUint256(body[0]);
    ethTx.gasPrice = RLPReader.readUint256(body[1]);
    ethTx.gasLimit = RLPReader.readUint256(body[2]);
    ethTx.destination = RLPReader.readAddress(body[3]);
    ethTx.amount = RLPReader.readUint256(body[4]);
    ethTx.data = RLPReader.readBytes(body[5]);
    // https://eips.ethereum.org/EIPS/eip-155
    ethTx.v = uint8(RLPReader.readUint256(body[6]) - chainId * 2 + 35);
    ethTx.r = RLPReader.readUint256(body[7]);
    ethTx.s = RLPReader.readUint256(body[8]);
  }

  function decodeEIP2930(RLPReader.RLPItem[] memory body)
    internal
    pure
    returns (EIP2930 memory eip2930)
  {
    require(body.length == 11, "invalid items length");

    eip2930.chainId = RLPReader.readUint256(body[0]);
    eip2930.nonce = RLPReader.readUint256(body[1]);
    eip2930.gasPrice = RLPReader.readUint256(body[2]);
    eip2930.gasLimit = RLPReader.readUint256(body[3]);
    eip2930.to = RLPReader.readAddress(body[4]);
    eip2930.value = RLPReader.readUint256(body[5]);
    eip2930.data = RLPReader.readBytes(body[6]);
    eip2930.accessList = decodeAccessList(RLPReader.readList(body[7]));
    eip2930.signatureYParity = uint8(RLPReader.readUint256(body[8]));
    eip2930.signatureR = RLPReader.readUint256(body[9]);
    eip2930.signatureS = RLPReader.readUint256(body[10]);
  }
}
