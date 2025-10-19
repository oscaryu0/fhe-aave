// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, ebool, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";

/// @title Confidential lending pool for fheUSDT deposits and loans
/// @notice Enables encrypted deposits, withdrawals, borrows and repayments using fheUSDT
contract FHELendingPool is SepoliaConfig {
    IERC7984 public immutable asset;

    mapping(address account => euint64) private _deposits;
    mapping(address account => euint64) private _debts;

    euint64 private _totalDeposits;
    euint64 private _totalBorrows;
    euint64 private _poolBalance;

    event Deposited(address indexed account, euint64 amount);
    event Withdrawn(address indexed account, euint64 amount);
    event Borrowed(address indexed account, euint64 amount);
    event Repaid(address indexed account, euint64 amount);

    constructor(address assetAddress) {
        asset = IERC7984(assetAddress);

        euint64 zeroAmount = FHE.asEuint64(0);
        _totalDeposits = zeroAmount;
        _totalBorrows = zeroAmount;
        _poolBalance = zeroAmount;

        FHE.allowThis(_totalDeposits);
        FHE.allowThis(_totalBorrows);
        FHE.allowThis(_poolBalance);
    }

    function deposit(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        FHE.allow(amount, address(asset));
        euint64 transferred = asset.confidentialTransferFrom(msg.sender, address(this), amount);

        euint64 updatedDeposit = FHE.add(_deposits[msg.sender], transferred);
        _deposits[msg.sender] = updatedDeposit;
        FHE.allowThis(updatedDeposit);
        FHE.allow(updatedDeposit, msg.sender);

        _totalDeposits = FHE.add(_totalDeposits, transferred);
        _poolBalance = FHE.add(_poolBalance, transferred);

        FHE.allowThis(_totalDeposits);
        FHE.allowThis(_poolBalance);
        FHE.allow(_totalDeposits, msg.sender);
        FHE.allow(_poolBalance, msg.sender);

        emit Deposited(msg.sender, transferred);
    }

    function withdraw(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        euint64 currentDeposit = _deposits[msg.sender];

        ebool hasEnough = FHE.ge(currentDeposit, amount);
        euint64 safeAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));

        euint64 updatedDeposit = FHE.sub(currentDeposit, safeAmount);
        _deposits[msg.sender] = updatedDeposit;
        FHE.allowThis(updatedDeposit);
        FHE.allow(updatedDeposit, msg.sender);

        _totalDeposits = FHE.sub(_totalDeposits, safeAmount);
        _poolBalance = FHE.sub(_poolBalance, safeAmount);

        FHE.allowThis(_totalDeposits);
        FHE.allowThis(_poolBalance);
        FHE.allow(_totalDeposits, msg.sender);
        FHE.allow(_poolBalance, msg.sender);

        FHE.allow(safeAmount, address(asset));
        asset.confidentialTransfer(msg.sender, safeAmount);

        emit Withdrawn(msg.sender, safeAmount);
    }

    function borrow(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        euint64 depositBalance = _deposits[msg.sender];
        euint64 currentDebt = _debts[msg.sender];

        euint64 available = FHE.sub(depositBalance, currentDebt);
        ebool canBorrow = FHE.ge(available, amount);
        euint64 safeAmount = FHE.select(canBorrow, amount, FHE.asEuint64(0));

        euint64 updatedDebt = FHE.add(currentDebt, safeAmount);
        _debts[msg.sender] = updatedDebt;
        FHE.allowThis(updatedDebt);
        FHE.allow(updatedDebt, msg.sender);

        _totalBorrows = FHE.add(_totalBorrows, safeAmount);
        _poolBalance = FHE.sub(_poolBalance, safeAmount);

        FHE.allowThis(_totalBorrows);
        FHE.allowThis(_poolBalance);
        FHE.allow(_totalBorrows, msg.sender);
        FHE.allow(_poolBalance, msg.sender);

        FHE.allow(safeAmount, address(asset));
        asset.confidentialTransfer(msg.sender, safeAmount);

        emit Borrowed(msg.sender, safeAmount);
    }

    function repay(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        euint64 currentDebt = _debts[msg.sender];

        ebool hasDebt = FHE.ge(currentDebt, amount);
        euint64 safeAmount = FHE.select(hasDebt, amount, currentDebt);

        FHE.allow(safeAmount, address(asset));
        euint64 transferred = asset.confidentialTransferFrom(msg.sender, address(this), safeAmount);

        euint64 updatedDebt = FHE.sub(currentDebt, transferred);
        _debts[msg.sender] = updatedDebt;
        FHE.allowThis(updatedDebt);
        FHE.allow(updatedDebt, msg.sender);

        _totalBorrows = FHE.sub(_totalBorrows, transferred);
        _poolBalance = FHE.add(_poolBalance, transferred);

        FHE.allowThis(_totalBorrows);
        FHE.allowThis(_poolBalance);
        FHE.allow(_totalBorrows, msg.sender);
        FHE.allow(_poolBalance, msg.sender);

        emit Repaid(msg.sender, transferred);
    }

    function getDeposit(address account) external view returns (euint64) {
        return _deposits[account];
    }

    function getDebt(address account) external view returns (euint64) {
        return _debts[account];
    }

    function getAccountData(address account) external view returns (euint64 depositBalance, euint64 debtBalance) {
        depositBalance = _deposits[account];
        debtBalance = _debts[account];
    }

    function getTotals() external view returns (euint64 deposits_, euint64 borrows_, euint64 pool_) {
        deposits_ = _totalDeposits;
        borrows_ = _totalBorrows;
        pool_ = _poolBalance;
    }
}
