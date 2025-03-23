/**
 * SPDX-License-Identifier: MIT
 *
 * @title PlatformRewardPool
 *
 * @notice
 *  The PlatformRewardPool is a simple contract that accumulates Ether (native currency)
 *  from fees collected by the platform. Only the owner can withdraw the funds.
 *
 * Non-technical summary:
 *   - Any time the platform charges a fee (like 10% from the marketplace), it's sent here.
 *   - The contract just holds the Ether until the platform owner withdraws it.
 *   - This is effectively the "treasury" or "piggy bank" of the system.
 */

pragma solidity ^0.8.2;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title PlatformRewardPool
 * @notice A minimal Ether holding contract that collects fees for the platform. The contract
 *         has a receive function to accept Ether, plus a method for the owner to withdraw.
 */
contract PlatformRewardPool is Ownable {
  /**
   * @notice Emitted whenever Ether is deposited into the contract.
   * @param depositor The address that sent the Ether.
   * @param amount The amount of Ether received.
   */
  event PoolDeposit(address indexed depositor, uint256 amount);

  /**
   * @notice Emitted whenever the owner withdraws Ether from the pool.
   * @param recipient The owner (withdrawer) address.
   * @param amount How much Ether was withdrawn.
   */
  event PoolWithdrawal(address indexed recipient, uint256 amount);

  /**
   * @notice The constructor sets the deployer as the owner. No additional logic.
   */
  constructor() {
    // Ownable constructor sets owner = msg.sender by default
  }

  /**
   * @notice Fallback function that triggers whenever Ether is sent directly to this contract's address.
   *         It logs a deposit event.
   */
  receive() external payable {
    emit PoolDeposit(msg.sender, msg.value);
  }

  /**
   * @notice The owner can withdraw a specified amount of Ether from this contract to their own address.
   * @param amount The amount (in wei) to withdraw.
   */
  function withdrawPoolFunds(uint256 amount) external onlyOwner {
    require(address(this).balance >= amount, 'Insufficient pool balance');
    (bool success, ) = payable(owner()).call{ value: amount }('');
    require(success, 'Withdrawal failed');

    emit PoolWithdrawal(owner(), amount);
  }

  /**
   * @notice Shows how much Ether is currently stored in this reward pool.
   * @return The contract's Ether balance, in wei.
   */
  function getPoolBalance() public view returns (uint256) {
    return address(this).balance;
  }
}
