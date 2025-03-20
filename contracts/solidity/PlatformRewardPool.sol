/**
 * SPDX-License-Identifier: MIT
 *
 * @title PlatformRewardPool
 *
 * @notice
 *  The PlatformRewardPool contract acts like a savings account ("piggy bank") for collecting
 *  platform fees in the form of Ether (ETH). This contract only allows the owner (the contract
 *  deployer or whomever the ownership is transferred to) to withdraw these accumulated funds.
 *
 *  In simpler terms, whenever there's a fee from selling or minting NFTs, some of that fee is
 *  sent here. The owner can later withdraw the collected Ether for platform-related expenses
 *  or profits.
 *
 *  Non-Technical Explanation:
 *  --------------------------
 *  - Think of this contract as the place where the platform’s earnings are stored.
 *  - It’s set up so that only the owner can take money out.
 *
 * Technical Summary:
 *  - Inherits from OpenZeppelin's Ownable to manage ownership.
 *  - Ether is collected by default in the fallback/receive function.
 *  - Only the owner can call `withdrawPoolFunds`.
 *  - `getPoolBalance` returns how much Ether is currently stored.
 */

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PlatformRewardPool is Ownable {
    /**
     * @dev Emitted whenever Ether is sent to this contract (i.e., fees).
     *
     * @param depositor The address that sent the Ether.
     * @param amount The amount of Ether received (in wei).
     */
    event PoolDeposit(address indexed depositor, uint256 amount);

    /**
     * @dev Emitted whenever the owner withdraws Ether from the pool.
     *
     * @param recipient The owner receiving the withdrawn funds.
     * @param amount The amount (in wei) withdrawn.
     */
    event PoolWithdrawal(address indexed recipient, uint256 amount);

    /**
     * @notice The constructor uses Ownable's default mechanism to set the initial owner
     *         as the deployer of this contract. No extra initialization is needed.
     */
    constructor() {
        // Ownable sets owner = msg.sender by default.
    }

    /**
     * @notice A special function that is called automatically whenever Ether is sent
     *         to this contract with no other data. It records a deposit event.
     *
     * @dev The 'receive()' function is an important fallback that helps
     *      this contract collect Ether from sales or other transactions.
     */
    receive() external payable {
        emit PoolDeposit(msg.sender, msg.value);
    }

    /**
     * @notice Allows the owner to withdraw a specified amount of Ether from the pool.
     *
     * @dev Only the contract owner can call this function. The function checks the pool's
     *      balance to ensure there is enough Ether to withdraw.
     *
     * @param amount The amount in wei that the owner wants to withdraw.
     *
     * Requirements:
     * - The pool must have at least `amount` in balance.
     * - The Ether transfer to the owner must succeed.
     */
    function withdrawPoolFunds(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient pool balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit PoolWithdrawal(owner(), amount);
    }

    /**
     * @notice Returns how much Ether is currently stored in this contract.
     *
     * @return The balance of this contract in wei.
     */
    function getPoolBalance() public view returns (uint256) {
        return address(this).balance;
    }
}