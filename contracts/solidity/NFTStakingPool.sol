/**
 * SPDX-License-Identifier: MIT
 *
 * NFTStakingPool.sol
 *
 * This contract allows users to stake NFTs minted by the NFTMarketplaceHub
 * in order to earn additional experience points (XP) over time.
 *
 * Non-technical Explanation:
 * --------------------------
 * Think of it as a "staking" system:
 *   1) The user must first approve this contract to transfer their NFT from the marketplace.
 *   2) The user calls stakeNFT(itemId), and that NFT is moved into this contract.
 *   3) The user accumulates XP (xpPerSecond) as time passes.
 *   4) They can call claimStakingRewards(...) at any time to add the XP to their account.
 *   5) They can unstakeNFT(...) to reclaim their NFT, which automatically claims any outstanding XP.
 *
 * The XP is credited in the UserExperiencePoints contract via stakeModifyUserXP(...).
 */

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../solidity/NFTMarketplaceHub.sol"; // for IERC721 usage
import "../solidity/UserExperiencePoints.sol";

/**
 * @title NFTStakingPool
 * @notice Manages staking of NFTs for additional XP rewards.
 * @dev Inherits Ownable for admin tasks (like changing xpPerSecond) and ReentrancyGuard for security.
 */
contract NFTStakingPool is Ownable, ReentrancyGuard {
    /// @dev The rate of XP accrued per second by a staked NFT (by default, 1 XP per second).
    uint256 public xpPerSecond = 1;

    /// @dev The address of the NFT contract (the marketplace hub) from which tokens are staked.
    address public immutable nftMarketplaceHub;

    /// @dev The address of the UserExperiencePoints contract, used to credit or remove XP.
    address public immutable experiencePoints;

    /**
     * @dev Holds stake information for each itemId:
     *   staker: the user who staked the NFT
     *   startTimestamp: when they first staked
     *   lastClaimed: when they last claimed XP
     *   staked: bool for quick check if it's actively staked
     */
    struct StakeInfo {
        address staker;
        uint256 startTimestamp;
        uint256 lastClaimed;
        bool staked;
    }

    /**
     * @dev Mapping of itemId => StakeInfo struct.
     * If staked[itemId].staked == true, it means that NFT is in the contract.
     */
    mapping(uint256 => StakeInfo) public stakes;

    // Emitted when a user stakes an NFT
    event NFTStaked(address indexed user, uint256 indexed itemId, uint256 timestamp);
    // Emitted when a user unstakes an NFT
    event NFTUnstaked(address indexed user, uint256 indexed itemId, uint256 timestamp);
    // Emitted when a user claims XP from a staked NFT
    event RewardsClaimed(address indexed user, uint256 indexed itemId, uint256 xpAmount);

    /**
     * @dev The constructor sets references to the MarketplaceHub (for transferring NFTs)
     * and the XP contract (for awarding staking XP).
     *
     * @param _nftMarketplaceHub address of the NFT contract (must be ERC721).
     * @param _experiencePoints address of the UserExperiencePoints contract.
     */
    constructor(address _nftMarketplaceHub, address _experiencePoints) {
        require(_nftMarketplaceHub != address(0), "Invalid marketplace address");
        require(_experiencePoints != address(0), "Invalid XP address");
        nftMarketplaceHub = _nftMarketplaceHub;
        experiencePoints = _experiencePoints;
    }

    /**
     * @notice Allows the contract owner to update xpPerSecond, controlling how quickly stakers earn XP.
     * @param _xpPerSecond The new XP per second rate.
     */
    function setXpPerSecond(uint256 _xpPerSecond) external onlyOwner {
        xpPerSecond = _xpPerSecond;
    }

    /**
     * @notice Stake an NFT with the given itemId. The user must have approved this contract
     *         to transfer the NFT from their wallet.
     * @param itemId The NFT itemId to stake.
     */
    function stakeNFT(uint256 itemId) external nonReentrant {
        require(!stakes[itemId].staked, "Already staked");

        // Transfer NFT from the user to this contract. Must have prior approval.
        IERC721(nftMarketplaceHub).safeTransferFrom(msg.sender, address(this), itemId);

        // Record the stake details
        stakes[itemId] = StakeInfo({
            staker: msg.sender,
            startTimestamp: block.timestamp,
            lastClaimed: block.timestamp,
            staked: true
        });

        emit NFTStaked(msg.sender, itemId, block.timestamp);
    }

    /**
     * @notice Claim the accumulated XP for a staked NFT, without unstaking it.
     * @param itemId The NFT itemId to claim rewards for.
     */
    function claimStakingRewards(uint256 itemId) public nonReentrant {
        StakeInfo storage stakeData = stakes[itemId];
        require(stakeData.staked, "Not staked");
        require(stakeData.staker == msg.sender, "Not your stake");

        // Calculate how long since last claim
        uint256 timeDiff = block.timestamp - stakeData.lastClaimed;
        if (timeDiff == 0) {
            // No new XP to claim
            return;
        }

        // xpEarned = timeDiff * xpPerSecond
        uint256 xpEarned = timeDiff * xpPerSecond;

        // Update lastClaimed to now
        stakeData.lastClaimed = block.timestamp;

        // Add the XP to the user's account in the XP contract
        IUserExperiencePoints(experiencePoints).stakeModifyUserXP(msg.sender, xpEarned, true);

        emit RewardsClaimed(msg.sender, itemId, xpEarned);
    }

    /**
     * @notice Unstake a staked NFT. This automatically calls claimStakingRewards(...)
     *         to gather any unclaimed XP, then returns the NFT to the user.
     * @param itemId The NFT itemId to unstake.
     */
    function unstakeNFT(uint256 itemId) external nonReentrant {
        StakeInfo storage stakeData = stakes[itemId];
        require(stakeData.staked, "Not staked");
        require(stakeData.staker == msg.sender, "Not your stake");

        // First, claim any outstanding XP
        claimStakingRewards(itemId);

        // Transfer NFT back to the user
        IERC721(nftMarketplaceHub).safeTransferFrom(address(this), msg.sender, itemId);

        // Mark as unstaked
        stakeData.staked = false;

        emit NFTUnstaked(msg.sender, itemId, block.timestamp);
    }

    /**
     * @dev Required by ERC721's safeTransferFrom, ensures that if we receive an NFT,
     * we return the selector that indicates we accept it.
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        // Return the magic value 0x150b7a02 to signal acceptance
        return 0x150b7a02;
    }
}