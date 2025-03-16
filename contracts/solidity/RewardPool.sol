/**
 * SPDX-License-Identifier: MIT
 */

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardPool is Ownable {
    event PoolDeposit(address indexed depositor, uint256 amount);
    event PoolWithdrawal(address indexed recipient, uint256 amount);

    constructor() Ownable(msg.sender) {}

    receive() external payable {
        emit PoolDeposit(msg.sender, msg.value);
    }

    function withdrawPoolFunds(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient pool balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");
        emit PoolWithdrawal(owner(), amount);
    }

    function getPoolBalance() public view returns (uint256) {
        return address(this).balance;
    }
}