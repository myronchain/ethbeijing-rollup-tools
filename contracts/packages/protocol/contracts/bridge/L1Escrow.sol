// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import {IFBaseContract} from "../base/IFBaseContract.sol";
import {IEscrow} from "./IEscrow.sol";
import {L2Escrow} from "./L2Escrow.sol";
import {LibAddress} from "../library/LibAddress.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract L1Escrow is IEscrow {
  event ETHDepositInitiated(
    address indexed from,
    address indexed to,
    uint256 amount,
    uint256 relayFee,
    bytes data
  );

  event ETHWithdrawalFinalized(
    address indexed from,
    address indexed to,
    uint256 amount,
    bytes data
  );

  event ERC20DepositInitiated(
    address indexed l1token,
    address indexed from,
    address to,
    uint256 amount,
    uint256 relayFee,
    bytes data
  );

  event ERC20WithdrawalFinalized(
    address indexed l1token,
    address indexed l2token,
    address indexed from,
    address to,
    uint256 amount,
    bytes data
  );

  uint256[50] private __gap;

  function init(address _addressManager) external initializer {
    IFBaseContract._init(_addressManager);
  }

  function depositETH(
    uint256 amount,
    uint256 relayFee,
    bytes calldata data
  ) external payable nonReentrant {
    _initiateETHDeposit({
      from: _msgSender(),
      to: _msgSender(),
      owner: _msgSender(),
      callValue: amount,
      relayFee: relayFee,
      data: data
    });
  }

  function depositETHTo(
    address to,
    uint256 amount,
    uint256 relayFee,
    bytes calldata data
  ) external payable nonReentrant {
    _initiateETHDeposit({
      from: _msgSender(),
      to: to,
      owner: _msgSender(),
      callValue: amount,
      relayFee: relayFee,
      data: data
    });
  }

  function depositERC20(
    address l1token,
    uint256 amount,
    uint256 relayFee,
    bytes calldata data
  ) external payable nonReentrant {
    _initiateERC20Deposit({
      l1token: l1token,
      from: _msgSender(),
      to: _msgSender(),
      owner: _msgSender(),
      amount: amount,
      relayFee: relayFee,
      data: data
    });
  }

  function depositERC20To(
    address l1token,
    address to,
    uint256 amount,
    uint256 relayFee,
    bytes calldata data
  ) external payable nonReentrant {
    _initiateERC20Deposit({
      l1token: l1token,
      from: _msgSender(),
      to: to,
      owner: _msgSender(),
      amount: amount,
      relayFee: relayFee,
      data: data
    });
  }

  function finalizeETHWithdrawal(
    address from,
    address to,
    uint256 amount,
    bytes calldata data
  ) external payable onlyFromRemoteEscrow nonReentrant {
    require(
      msg.value == amount,
      "finalizeETHWithdrawal: amount sent does not match amount required"
    );
    require(
      to != address(0) && to != address(this),
      "finalizeETHWithdrawal: invalid to"
    );
    LibAddress.sendEther(to, amount);
    emit ETHWithdrawalFinalized({
      from: from,
      to: to,
      amount: amount,
      data: data
    });
  }

  function finalizeERC20Withdrawal(
    address l1token,
    address l2token,
    address from,
    address to,
    uint256 amount,
    bytes calldata data
  ) external onlyFromRemoteEscrow nonReentrant {
    require(
      to != address(0) && to != address(this),
      "finalizeERC20Withdrawal: invalid to"
    );
    SafeERC20.safeTransfer(IERC20(l1token), to, amount);
    emit ERC20WithdrawalFinalized({
      l1token: l1token,
      l2token: l2token,
      from: from,
      to: to,
      amount: amount,
      data: data
    });
  }

  function _initiateETHDeposit(
    address from,
    address to,
    address owner,
    uint256 callValue,
    uint256 relayFee,
    bytes memory data
  ) private {
    require(to != address(0), "_initiateETHDeposit: to zero address");
    bytes memory message = abi.encodeWithSelector(
      L2Escrow.finalizeETHDeposit.selector,
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
    emit ETHDepositInitiated({
      from: from,
      to: to,
      amount: callValue,
      relayFee: relayFee,
      data: data
    });
  }

  function _initiateERC20Deposit(
    address l1token,
    address from,
    address to,
    address owner,
    uint256 amount,
    uint256 relayFee,
    bytes calldata data
  ) private {
    require(to != address(0), "_initiateERC20Deposit: to zero address");
    IERC20Metadata t = IERC20Metadata(l1token);
    SafeERC20.safeTransferFrom({
      token: t,
      from: _msgSender(),
      to: address(this),
      value: amount
    });
    L1StandardERC20 memory l1StandardERC20 = L1StandardERC20({
      addr: l1token,
      name: t.name(),
      symbol: t.symbol(),
      decimals: t.decimals()
    });
    bytes memory message = abi.encodeWithSelector(
      L2Escrow.finalizeERC20Deposit.selector,
      from,
      to,
      amount,
      l1StandardERC20,
      data
    );
    bytes32 messageHash = sendCrossChainMessage({
      callValue: 0,
      relayFee: relayFee,
      owner: owner,
      message: message
    });
    _deposits[messageHash] = ERC20Deposited({token: l1token, amount: amount});
    emit ERC20DepositInitiated({
      l1token: l1token,
      from: from,
      to: to,
      amount: amount,
      relayFee: relayFee,
      data: data
    });
  }

  function _refundERC20(
    address token,
    address to,
    uint256 amount
  ) internal override {
    SafeERC20.safeTransfer(IERC20(token), to, amount);
  }
}
