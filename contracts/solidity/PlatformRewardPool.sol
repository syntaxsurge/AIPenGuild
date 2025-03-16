/**
 * SPDX-License-Identifier: MIT
 *
 * PlatformRewardPool.sol
 *
 * This contract acts as a "bank" for the platform fees collected from NFT sales
 * or minting processes. It holds the funds until the owner (platform) chooses to withdraw.
 *
 * Non-technical Explanation:
 * --------------------------
 * Imagine this as a special wallet that accumulates the fees from the marketplace
 * and collections. Only the contract owner has the ability to withdraw the funds
 * stored here.
 */

pragma solidity ^0.8.2;

// Importing OpenZeppelin's Ownable contract, so only the owner can call certain functions.
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PlatformRewardPool
 * @notice A simple contract to hold and manage funds collected as fees from the platform's marketplace.
 * @dev Inherits Ownable to restrict certain functions to only the owner.
 */
contract PlatformRewardPool is Ownable {
    /**
     * @dev Emitted whenever someone sends Ether (fees) to the pool contract.
     * @param depositor The address that sent funds.
     * @param amount The amount (in wei) that was deposited.
     */
    event PoolDeposit(address indexed depositor, uint256 amount);

    /**
     * @dev Emitted whenever the owner withdraws Ether from the pool contract.
     * @param recipient The owner (platform) receiving the withdrawn funds.
     * @param amount The amount (in wei) that was withdrawn.
     */
    event PoolWithdrawal(address indexed recipient, uint256 amount);

    /**
     * @dev The constructor that sets the initial owner of the contract.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev A "receive" function that runs automatically whenever the contract is
     *      sent Ether with no accompanying function call data. This allows the
     *      contract to simply accept Ether from external transfers.
     */
    receive() external payable {
        emit PoolDeposit(msg.sender, msg.value);
    }

    /**
     * @notice Allows the owner to withdraw a specified amount of Ether from this pool.
     * @dev Only the contract owner can call this.
     * @param amount The amount (in wei) to withdraw.
     */
    function withdrawPoolFunds(uint256 amount) external onlyOwner {
        // Ensure the contract has enough balance to withdraw.
        require(address(this).balance >= amount, "Insufficient pool balance");

        // Transfer the specified amount to the owner.
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit PoolWithdrawal(owner(), amount);
    }

    /**
     * @notice Retrieves the current Ether balance of this contract.
     * @return The amount of Ether (in wei) stored in this contract.
     */
    function getPoolBalance() public view returns (uint256) {
        return address(this).balance;
    }
}