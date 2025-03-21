/**
 * SPDX-License-Identifier: MIT
 *
 * @title NFTStakingPool
 *
 * @notice
 *  This contract allows users to "stake" their NFTs in order to earn additional XP (experience points)
 *  over time. The XP is accumulated at a rate of `xpPerSecond` for as long as the NFT remains staked.
 *
 *  Non-technical summary:
 *   - You deposit (stake) an NFT into this contract, which locks it so you can't trade it in the meantime.
 *   - While staked, you accrue XP each second, which you can claim.
 *   - If you want your NFT back, you can unstake it, which automatically claims any remaining XP.
 *
 * Real-world scenario:
 *   - Imagine a game that rewards players for "staking" their collectible NFTs. The longer you stake,
 *     the more XP you get. This XP might unlock new levels, skins, or features in the game.
 */

pragma solidity ^0.8.2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import './UserExperiencePoints.sol';

/**
 * @title NFTStakingPool
 * @notice Manages logic for staking an NFT to accumulate XP over time. Each staked NFT has
 *         a record of the staker, the time staked, and the time of last claim. The user
 *         can claim XP (based on how long they've staked) and eventually unstake the NFT,
 *         retrieving it from the pool.
 */
contract NFTStakingPool is Ownable, ReentrancyGuard {
  /**
   * @notice The rate (XP per second) at which staked NFTs accumulate XP for their staker.
   */
  uint256 public xpPerSecond = 1;

  /**
   * @dev Address of the ERC721 contract (the minted NFTs). Typically the NFTMintingPlatform address.
   */
  address public immutable nftContract;

  /**
   * @dev Address of the UserExperiencePoints contract, used to add XP to the user as they stake.
   */
  address public immutable experiencePoints;

  /**
   * @notice Holds data for each staked NFT:
   *         - staker: who currently has it staked.
   *         - startTimestamp: when the NFT was first staked.
   *         - lastClaimed: the last time XP was claimed.
   *         - staked: boolean indicating if it's currently staked.
   */
  struct StakeInfo {
    address staker;
    uint256 startTimestamp;
    uint256 lastClaimed;
    bool staked;
  }

  /**
   * @notice A mapping from itemId (NFT ID) => staking info (who staked it, timestamps, etc.).
   */
  mapping(uint256 => StakeInfo) public stakes;

  /**
   * @notice Emitted when a user stakes an NFT into this contract.
   *
   * @param user The user who staked.
   * @param itemId The ID of the NFT staked.
   * @param timestamp The time of staking.
   */
  event NFTStaked(address indexed user, uint256 indexed itemId, uint256 timestamp);

  /**
   * @notice Emitted when a user unstakes an NFT (removes it from the pool).
   *
   * @param user The user who unstaked.
   * @param itemId The ID of the NFT unstaked.
   * @param timestamp The time of unstaking.
   */
  event NFTUnstaked(address indexed user, uint256 indexed itemId, uint256 timestamp);

  /**
   * @notice Emitted when a user claims XP for a staked NFT.
   *
   * @param user The user who claimed XP.
   * @param itemId The NFT for which rewards were claimed.
   * @param xpAmount The total XP that was granted in this claim.
   */
  event RewardsClaimed(address indexed user, uint256 indexed itemId, uint256 xpAmount);

  /**
   * @notice Constructor sets which NFT contract can be staked, and which XP contract to credit XP in.
   *
   * @param _nftContract The address of the ERC721 contract (likely NFTMintingPlatform).
   * @param _experiencePoints The address of the XP tracking contract (UserExperiencePoints).
   */
  constructor(address _nftContract, address _experiencePoints) {
    require(_nftContract != address(0), 'Invalid NFT contract');
    require(_experiencePoints != address(0), 'Invalid XP address');
    nftContract = _nftContract;
    experiencePoints = _experiencePoints;
  }

  /**
   * @notice The contract owner can adjust the XP accrual rate (per second).
   * @param _xpPerSecond The new XP rate (e.g., 1 means 1 XP per second).
   */
  function setXpPerSecond(uint256 _xpPerSecond) external onlyOwner {
    xpPerSecond = _xpPerSecond;
  }

  /**
   * @notice Stake an NFT by transferring it from your wallet into this contract.
   *         The NFT must be approved for transfer by this contract prior to calling stakeNFT.
   *
   * @param itemId The ID of the NFT to stake (tokenId on the nftContract).
   */
  function stakeNFT(uint256 itemId) external nonReentrant {
    require(!stakes[itemId].staked, 'Already staked');

    // Transfer the NFT from the user to the staking contract
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
   * @notice Claim the XP that has been accumulated so far for a given staked NFT,
   *         without unstaking the NFT.
   * @param itemId The ID of the staked NFT.
   */
  function claimStakingRewards(uint256 itemId) external nonReentrant {
    _claimStakingRewards(itemId);
  }

  /**
   * @notice Unstake (remove) your NFT from this contract, returning it to your wallet.
   *         This automatically claims any unclaimed XP prior to unstaking.
   *
   * @param itemId The ID of the staked NFT to remove.
   */
  function unstakeNFT(uint256 itemId) external nonReentrant {
    StakeInfo storage stakeData = stakes[itemId];
    require(stakeData.staked, 'Not staked');
    require(stakeData.staker == msg.sender, 'Not your stake');

    // First, claim any outstanding XP
    _claimStakingRewards(itemId);

    // Transfer the NFT back to the user
    IERC721(nftContract).safeTransferFrom(address(this), msg.sender, itemId);

    // Mark as unstaked
    stakeData.staked = false;

    emit NFTUnstaked(msg.sender, itemId, block.timestamp);
  }

  /**
   * @dev Internal function to handle the XP calculation and awarding it to the user.
   * @param itemId The ID of the NFT that is staked.
   */
  function _claimStakingRewards(uint256 itemId) private {
    StakeInfo storage stakeData = stakes[itemId];
    require(stakeData.staked, 'Not staked');
    require(stakeData.staker == msg.sender, 'Not your stake');

    uint256 timeDiff = block.timestamp - stakeData.lastClaimed;
    if (timeDiff == 0) {
      // No time has passed => no XP to claim
      return;
    }

    // xpEarned = timeDiff * xpPerSecond
    uint256 xpEarned = timeDiff * xpPerSecond;

    // Update lastClaimed to now
    stakeData.lastClaimed = block.timestamp;

    // Increase the user's XP
    IUserExperiencePoints(experiencePoints).stakeModifyUserXP(msg.sender, xpEarned, true);

    emit RewardsClaimed(msg.sender, itemId, xpEarned);
  }

  /**
   * @dev Required by the ERC721 standard to allow this contract to receive NFTs safely.
   */
  function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
    // Return the magic value that signifies safe receipt of ERC721 tokens
    return 0x150b7a02;
  }
}
