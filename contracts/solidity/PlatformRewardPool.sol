/**
 * SPDX-License-Identifier: MIT
 *
 * PlatformRewardPool.sol
 *
 * This contract accumulates platform fees from NFT sales/minting. Only the owner
 * can withdraw those fees.
 *
 * Non-technical Explanation:
 * --------------------------
 * Think of this as the platform's "piggy bank" for fees. Whenever a sale or mint
 * charges a 10% platform fee, it goes here. The platform owners can later withdraw
 * these funds.
 */

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PlatformRewardPool
 * @notice Holds and manages the Ether collected as platform fees.
 * @dev Inherits Ownable, so only the contract owner can withdraw funds.
 */
contract PlatformRewardPool is Ownable {
    /**
     * @dev Event triggered when the pool receives Ether.
     * @param depositor The address that sent the Ether.
     * @param amount The amount received (in wei).
     */
    event PoolDeposit(address indexed depositor, uint256 amount);

    /**
     * @dev Event triggered when the owner withdraws Ether from the pool.
     * @param recipient The owner receiving the withdrawn funds.
     * @param amount The amount (in wei) withdrawn.
     */
    event PoolWithdrawal(address indexed recipient, uint256 amount);

    /**
     * @dev The constructor uses Ownable's default mechanism to set the initial owner.
     */
    constructor() {
        // Nothing extra needed; Ownable sets owner=msg.sender automatically.
    }

    /**
     * @dev A receive() function that is automatically called whenever Ether is sent
     * with no function data.
     */
    receive() external payable {
        emit PoolDeposit(msg.sender, msg.value);
    }

    /**
     * @notice Lets the owner withdraw a specified amount of Ether from the pool.
     * @param amount The amount (in wei) to withdraw.
     */
    function withdrawPoolFunds(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient pool balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit PoolWithdrawal(owner(), amount);
    }

    /**
     * @notice Return how much Ether is currently stored in this contract.
     */
    function getPoolBalance() public view returns (uint256) {
        return address(this).balance;
    }
}