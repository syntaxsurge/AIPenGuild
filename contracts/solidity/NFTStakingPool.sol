/**
 * SPDX-License-Identifier: MIT
 *
 * @title NFTStakingPool
 *
 * @notice
 *   This contract lets users stake their NFTs to earn additional XP over time. By staking, you lock
 *   your NFT in the contract, and it accrues XP at a rate of `xpPerSecond`. You can claim the XP
 *   whenever you want, and eventually unstake your NFT to retrieve it.
 *
 * Non-technical Explanation:
 * --------------------------
 *   - Think of it like a bank for NFTs, where you deposit (stake) your NFT and slowly earn
 *     interest in the form of XP.
 *   - As time passes, your XP goes up. You can claim that XP at any point, and also remove your
 *     NFT from the pool (unstake) if you want to stop earning.
 *
 * Technical Summary:
 *  - Inherits from Ownable and ReentrancyGuard for safe patterns.
 *  - xpPerSecond can be adjusted by the owner to control the earning rate.
 *  - When a user stakes, the NFT is transferred to this contract, and we track the time of stake.
 *  - The user must call `claimStakingRewards` to get the XP added to their account, or it also happens
 *    automatically during `unstakeNFT`.
 */

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./UserExperiencePoints.sol";

contract NFTStakingPool is Ownable, ReentrancyGuard {
    /**
     * @notice The rate at which XP is accrued per second for each staked NFT.
     *
     * @dev e.g. `xpPerSecond = 1` means 1 XP is gained each second the NFT remains staked.
     */
    uint256 public xpPerSecond = 1;

    /**
     * @dev The address of the NFT (ERC721) contract. Typically the NFTMintingPlatform.
     */
    address public immutable nftContract;

    /**
     * @dev The address of the UserExperiencePoints contract. Used to grant or remove XP from stakers.
     */
    address public immutable experiencePoints;

    /**
     * @notice Holds information on each staked NFT.
     *
     * @param staker         The address that staked the NFT.
     * @param startTimestamp When the NFT was first staked (in seconds).
     * @param lastClaimed    When XP was last claimed for this staked NFT.
     * @param staked         Whether this NFT is currently staked or not.
     */
    struct StakeInfo {
        address staker;
        uint256 startTimestamp;
        uint256 lastClaimed;
        bool staked;
    }

    /**
     * @notice Maps an NFT's itemId => StakeInfo for that NFT's stake status.
     */
    mapping(uint256 => StakeInfo) public stakes;

    /**
     * @notice Emitted when a user stakes an NFT.
     *
     * @param user   The address of the user who staked.
     * @param itemId The ID of the staked NFT.
     * @param timestamp The time when staked.
     */
    event NFTStaked(address indexed user, uint256 indexed itemId, uint256 timestamp);

    /**
     * @notice Emitted when a user unstakes an NFT.
     *
     * @param user   The address of the user who unstaked.
     * @param itemId The ID of the unstaked NFT.
     * @param timestamp The time when unstaked.
     */
    event NFTUnstaked(address indexed user, uint256 indexed itemId, uint256 timestamp);

    /**
     * @notice Emitted when a user claims XP rewards for their staked NFT.
     *
     * @param user   The address claiming the rewards.
     * @param itemId The ID of the NFT for which rewards are claimed.
     * @param xpAmount The amount of XP gained.
     */
    event RewardsClaimed(address indexed user, uint256 indexed itemId, uint256 xpAmount);

    /**
     * @notice Constructor sets up which NFT contract can be staked and where XP is tracked.
     *
     * @param _nftContract The address of the ERC721 contract (e.g., NFTMintingPlatform).
     * @param _experiencePoints The address of the XP tracking contract.
     */
    constructor(address _nftContract, address _experiencePoints) {
        require(_nftContract != address(0), "Invalid NFT contract");
        require(_experiencePoints != address(0), "Invalid XP address");
        nftContract = _nftContract;
        experiencePoints = _experiencePoints;
    }

    /**
     * @notice Allows the contract owner to update how much XP is earned per second.
     *
     * @param _xpPerSecond New XP rate for staked NFTs.
     */
    function setXpPerSecond(uint256 _xpPerSecond) external onlyOwner {
        xpPerSecond = _xpPerSecond;
    }

    /**
     * @notice Stake an NFT by transferring it from your wallet into this contract.
     *
     * @dev The user must approve this contract to transfer their NFT beforehand.
     *
     * @param itemId The ID of the NFT to stake.
     */
    function stakeNFT(uint256 itemId) external nonReentrant {
        require(!stakes[itemId].staked, "Already staked");

        // Transfer NFT from the user's wallet to the staking contract
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), itemId);

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
     * @notice Claim any XP that has accumulated since the last claim for a given staked NFT.
     *
     * @param itemId The ID of the staked NFT to claim rewards for.
     */
    function claimStakingRewards(uint256 itemId) external nonReentrant {
        _claimStakingRewards(itemId);
    }

    /**
     * @notice Unstake (remove) your NFT from the contract. Automatically claims any unclaimed XP.
     *
     * @dev The NFT is returned back to your wallet if you were the staker.
     *
     * @param itemId The ID of the staked NFT to unstake.
     */
    function unstakeNFT(uint256 itemId) external nonReentrant {
        StakeInfo storage stakeData = stakes[itemId];
        require(stakeData.staked, "Not staked");
        require(stakeData.staker == msg.sender, "Not your stake");

        // First, claim any outstanding XP
        _claimStakingRewards(itemId);

        // Transfer NFT back to the user
        IERC721(nftContract).safeTransferFrom(address(this), msg.sender, itemId);

        // Mark as unstaked
        stakeData.staked = false;

        emit NFTUnstaked(msg.sender, itemId, block.timestamp);
    }

    /**
     * @dev An internal function that handles XP calculation and claims it for the user.
     *
     * @param itemId The ID of the NFT that is staked.
     */
    function _claimStakingRewards(uint256 itemId) private {
        StakeInfo storage stakeData = stakes[itemId];
        require(stakeData.staked, "Not staked");
        require(stakeData.staker == msg.sender, "Not your stake");

        // Calculate how long it has been since last claim
        uint256 timeDiff = block.timestamp - stakeData.lastClaimed;
        if (timeDiff == 0) {
            // No time has passed => no XP to claim
            return;
        }

        // xpEarned = timeDiff * xpPerSecond
        uint256 xpEarned = timeDiff * xpPerSecond;

        // Update lastClaimed to now
        stakeData.lastClaimed = block.timestamp;

        // Grant XP to the user
        IUserExperiencePoints(experiencePoints).stakeModifyUserXP(msg.sender, xpEarned, true);

        emit RewardsClaimed(msg.sender, itemId, xpEarned);
    }

    /**
     * @dev Part of the ERC721 "safeTransferFrom" standard. This function ensures that this contract
     *      can receive ERC721 tokens. It returns a special byte value (0x150b7a02).
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        // This is the "magic value" that signifies the contract can safely receive ERC721 tokens.
        return 0x150b7a02;
    }
}