// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {IFBaseContract} from "../base/IFBaseContract.sol";
import {ChainConstants} from "../library/ChainConstants.sol";
import {LibAddress} from "../library/LibAddress.sol";
import {IEscrow} from "./IEscrow.sol";
import {L1Escrow} from "./L1Escrow.sol";
import {L2BridgedERC20} from "./L2BridgedERC20.sol";

contract L2Escrow is IEscrow {
  // l1token => l2token
  mapping(address => address) public l2Tokens;
  // l2token => l1token
  mapping(address => address) public l1Tokens;
  uint256[48] private __gap;

  event ETHDepositFinalized(
    address indexed from,
    address indexed to,
    uint256 amount,
    bytes data
  );

  event ETHWithdrawalInitiated(
    address indexed from,
    address indexed to,
    uint256 amount,
    uint256 relayFee,
    bytes data
  );

  event ERC20DepositFinalized(
    address indexed l1token,
    address indexed l2token,
    address indexed from,
    address to,
    uint256 amount,
    bytes data
  );

  event ERC20WithdrawalInitiated(
    address indexed l1token,
    address indexed l2token,
    address indexed from,
    address to,
    uint256 amount,
    uint256 relayFee,
    bytes data
  );

  event L2StandardERC20Deployed(
    address indexed l1token,
    address indexed l2token,
    string name,
    string symbol,
    uint256 decimals
  );

  /**********************
   * External Functions *
   **********************/
  function init(address addressManager) external initializer {
    IFBaseContract._init(addressManager);
  }

  function withdrawETH(
    uint256 amount,
    uint256 relayFee,
    bytes calldata data
  ) external payable nonReentrant {
    _initiateETHWithdrawal({
      from: _msgSender(),
      to: _msgSender(),
      owner: _msgSender(),
      callValue: amount,
      relayFee: relayFee,
      data: data
    });
  }

  function withdrawETHTo(
    address to,
    uint256 amount,
    uint256 relayFee,
    bytes calldata data
  ) external payable nonReentrant {
    _initiateETHWithdrawal({
      from: _msgSender(),
      to: to,
      owner: _msgSender(),
      callValue: amount,
      relayFee: relayFee,
      data: data
    });
  }

  function withdrawERC20(
    address l2token,
    uint256 amount,
    uint256 relayFee,
    bytes calldata data
  ) external payable nonReentrant {
    _initiateERC20Withdrawal({
      l2token: l2token,
      from: _msgSender(),
      to: _msgSender(),
      owner: _msgSender(),
      amount: amount,
      relayFee: relayFee,
      data: data
    });
  }

  function withdrawERC20To(
    address l2token,
    address to,
    uint256 amount,
    uint256 relayFee,
    bytes calldata data
  ) external payable nonReentrant {
    _initiateERC20Withdrawal({
      l2token: l2token,
      from: _msgSender(),
      to: to,
      owner: _msgSender(),
      amount: amount,
      relayFee: relayFee,
      data: data
    });
  }

  function finalizeETHDeposit(
    address from,
    address to,
    uint256 amount,
    bytes calldata data
  ) external payable onlyFromRemoteEscrow nonReentrant {
    require(
      msg.value == amount,
      "finalizeETHDeposit: amount sent does not match amount required"
    );
    require(
      to != address(0) && to != address(this),
      "finalizeETHDeposit: invalid to"
    );
    LibAddress.sendEther(to, amount);
    emit ETHDepositFinalized(from, to, amount, data);
  }

  function finalizeERC20Deposit(
    address from,
    address to,
    uint256 amount,
    L1StandardERC20 calldata l1token,
    bytes calldata data
  ) external onlyFromRemoteEscrow nonReentrant {
    require(
      to != address(0) && to != address(this),
      "finalizeERC20Deposit: invalid to"
    );
    address l2token = _getOrDeployL2Token(l1token);
    L2BridgedERC20(l2token).mintTo(to, amount);
    emit ERC20DepositFinalized({
      l1token: l1token.addr,
      l2token: l2token,
      from: from,
      to: to,
      amount: amount,
      data: data
    });
  }

  /*********************
   * Private Functions *
   *********************/
  function _initiateETHWithdrawal(
    address from,
    address to,
    address owner,
    uint256 callValue,
    uint256 relayFee,
    bytes memory data
  ) private {
    require(to != address(0), "_initiateETHWithdrawal: to zero address");
    bytes memory message = abi.encodeWithSelector(
      L1Escrow.finalizeETHWithdrawal.selector,
      from,
      to,
      callValue,
      data
    );
    sendCrossChainMessage({
      callValue: callValue,
      relayFee: relayFee,
      owner: owner,
      message: message
    });
    emit ETHWithdrawalInitiated({
      from: from,
      to: to,
      amount: callValue,
      relayFee: relayFee,
      data: data
    });
  }

  function _initiateERC20Withdrawal(
    address l2token,
    address from,
    address to,
    address owner,
    uint256 amount,
    uint256 relayFee,
    bytes calldata data
  ) private {
    require(to != address(0), "_initiateERC20Withdrawal: to zero address");
    address l1token = l1Tokens[l2token];
    require(
      l1token != address(0),
      "_initiateERC20Withdrawal: l1token zero address"
    );
    L2BridgedERC20(l2token).burnFrom(from, amount);
    bytes memory message = abi.encodeWithSelector(
      L1Escrow.finalizeERC20Withdrawal.selector,
      l1token,
      l2token,
      from,
      to,
      amount,
      data
    );
    bytes32 messageHash = sendCrossChainMessage(0, relayFee, owner, message);
    _deposits[messageHash] = ERC20Deposited({token: l2token, amount: amount});
    emit ERC20WithdrawalInitiated({
      l1token: l1token,
      l2token: l2token,
      from: from,
      to: to,
      relayFee: relayFee,
      amount: amount,
      data: data
    });
  }

  function _getOrDeployL2Token(L1StandardERC20 calldata l1token)
    private
    returns (address)
  {
    address l2token = l2Tokens[l1token.addr];
    if (l2token == address(0)) {
      return _deployL2Token(l1token);
    } else {
      return l2token;
    }
  }

  function _deployL2Token(L1StandardERC20 calldata l1token)
    private
    returns (address l2token)
  {
    L2BridgedERC20 l2BridgedToken = new L2BridgedERC20({
      // l1 token name: A,
      // l2 bridged token name: A(bridged🌈)
      name: string(
        abi.encodePacked(
          l1token.name,
          "(bridged",
          hex"F09F8C88", //🌈
          ")"
        )
      ),
      symbol: l1token.symbol,
      decimals_: l1token.decimals
    });
    l2token = address(l2BridgedToken);
    l1Tokens[l2token] = l1token.addr;
    l2Tokens[l1token.addr] = l2token;
    emit L2StandardERC20Deployed({
      l1token: l1token.addr,
      l2token: l2token,
      name: l1token.name,
      symbol: l1token.symbol,
      decimals: l1token.decimals
    });
  }

  function _refundERC20(
    address token,
    address to,
    uint256 amount
  ) internal override {
    L2BridgedERC20(token).mintTo(to, amount);
  }
}
