/**
 * SPDX-License-Identifier: MIT
 *
 * @title UserExperiencePoints
 *
 * @notice
 *   This contract manages "experience points" (XP) for NFT owners. Each NFT can have a certain
 *   amount of XP assigned to it (for example, assigned randomly upon minting). Whenever a user
 *   holds an NFT, they effectively gain the XP of that NFT. If the user sells or transfers the NFT
 *   away, they lose that XP because they no longer hold the NFT. The contract also supports
 *   staking logic, where an authorized staking contract can add or remove extra XP to a user.
 *
 * Non-technical Explanation:
 * --------------------------
 *   - Imagine a scoreboard that keeps track of each player's total XP.
 *   - When you get a new NFT with some XP assigned, your total XP increases.
 *   - When you lose an NFT, your total XP decreases accordingly.
 *   - Certain special contracts (like a Staking contract) can also give or remove XP from you.
 *
 * Technical Summary:
 *  - Inherits from OpenZeppelin's Ownable to manage admin tasks.
 *  - XP is stored per itemId, and user total XP is updated by calling `modifyUserXP`.
 *  - The random XP is assigned once at mint time with `assignRandomXP`.
 *  - Another function `stakeModifyUserXP` is restricted to authorized callers for staking expansions.
 */

pragma solidity ^0.8.2;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title IUserExperiencePoints
 * @notice Interface for external contracts (like a StakingPool) that interact with XP.
 */
interface IUserExperiencePoints {
  function assignRandomXP(uint256 itemId) external returns (uint256);

  function modifyUserXP(address user, uint256 itemId, bool add) external;

  function stakeModifyUserXP(address user, uint256 xp, bool add) external;
}

/**
 * @title UserExperiencePoints
 * @notice The concrete implementation of the XP system. Manages assignment of XP to NFTs
 *         and overall XP totals for each user.
 */
contract UserExperiencePoints is Ownable, IUserExperiencePoints {
  /**
   * @notice A mapping from user address => total XP
   *
   * Explanation:
   *  - "userExperience" tracks how many total XP points each user currently has.
   *  - This includes XP from any NFTs they hold, as well as any extra XP from staking.
   */
  mapping(address => uint256) public userExperience;

  /**
   * @notice A mapping from itemId => the XP assigned specifically to that item (NFT).
   *
   * Explanation:
   *  - "itemExperience" stores how many XP points an NFT is "worth."
   *  - If you own that NFT, you effectively gain that XP.
   */
  mapping(uint256 => uint256) public itemExperience;

  /**
   * @notice Tracks whether a given user has already been credited or debited XP for a specific NFT.
   *
   * Explanation:
   *  - If "hasGainedXP[user][itemId]" is true, that means user has been assigned the XP
   *    of that NFT. This helps avoid accidentally double-counting the same item for a user.
   */
  mapping(address => mapping(uint256 => bool)) public hasGainedXP;

  /**
   * @notice Tracks which contracts are allowed to call `stakeModifyUserXP`.
   *
   * Explanation:
   *  - For instance, the NFTStakingPool contract might be authorized to call `stakeModifyUserXP`
   *    to grant users XP for staking their NFTs.
   */
  mapping(address => bool) public authorizedCallers;

  /**
   * @notice Emitted whenever a user's total XP changes, for external visibility.
   */
  event ExperienceUpdated(address indexed user, uint256 updatedXP);

  /**
   * @notice Emitted whenever random XP is assigned to a newly minted NFT.
   *
   * @param itemId The ID of the NFT that is assigned random XP.
   * @param xpValue How many points of XP were assigned.
   */
  event ExperienceAssigned(uint256 indexed itemId, uint256 xpValue);

  /**
   * @notice Constructor relies on Ownable (which sets the contract deployer as the owner).
   */
  constructor() {
    // No extra logic; just rely on Ownable to set `owner`.
  }

  /**
   * @notice Allows only the owner to designate certain contracts (like a StakingPool)
   *         as authorized to call `stakeModifyUserXP`.
   *
   * @param _caller The address of the contract to be authorized or deauthorized.
   * @param _status true = grant authorization, false = revoke.
   */
  function setAuthorizedCaller(address _caller, bool _status) external onlyOwner {
    authorizedCallers[_caller] = _status;
  }

  /**
   * @notice Assign a random XP (range: 1–100) to an NFT item, typically when the NFT is minted.
   *
   * @dev This function uses a simple pseudo-random number approach:
   *      keccak256 of (block timestamp + itemId), modulo 100, plus 1.
   *
   * @param itemId The unique ID of the NFT item being assigned XP.
   * @return generatedXP The random XP assigned to this NFT item.
   */
  function assignRandomXP(uint256 itemId) external override returns (uint256) {
    uint256 generatedXP = (uint256(keccak256(abi.encodePacked(block.timestamp, itemId))) % 100) + 1;
    itemExperience[itemId] = generatedXP;

    emit ExperienceAssigned(itemId, generatedXP);
    return generatedXP;
  }

  /**
   * @notice Called by marketplace or minting platforms to update user XP when they gain or lose an NFT.
   *
   * @param user The user who is gaining or losing XP.
   * @param itemId The NFT item in question.
   * @param add If true, user is acquiring the NFT's XP; if false, user is losing it.
   *
   * Requirements:
   * - The caller must not be address(0).
   * - `hasGainedXP[user][itemId]` ensures we do not double-count the same NFT for the same user.
   */
  function modifyUserXP(address user, uint256 itemId, bool add) external override {
    require(msg.sender != address(0), 'Invalid caller');

    uint256 xpVal = itemExperience[itemId];

    if (add) {
      // The user is gaining the NFT => gain its XP
      require(!hasGainedXP[user][itemId], 'XP already granted for this item to user');
      userExperience[user] += xpVal;
      hasGainedXP[user][itemId] = true;
    } else {
      // The user is losing the NFT => remove its XP
      require(hasGainedXP[user][itemId], 'No XP found for user and item');
      if (userExperience[user] >= xpVal) {
        userExperience[user] -= xpVal;
      } else {
        userExperience[user] = 0;
      }
      hasGainedXP[user][itemId] = false;
    }

    emit ExperienceUpdated(user, userExperience[user]);
  }

  /**
   * @notice Allows an authorized contract (e.g., a staking contract) to directly add or remove XP from a user.
   *
   * @dev This bypasses item-based logic. Instead, it modifies a user’s XP with a raw number.
   *
   * @param user The address of the user whose XP will be modified.
   * @param xp The amount of XP to add or remove.
   * @param add True to add XP, false to remove XP.
   *
   * Requirements:
   * - The caller must be in the `authorizedCallers` mapping.
   */
  function stakeModifyUserXP(address user, uint256 xp, bool add) external override {
    require(authorizedCallers[msg.sender], 'Caller not authorized to modify XP');

    if (add) {
      userExperience[user] += xp;
    } else {
      if (userExperience[user] >= xp) {
        userExperience[user] -= xp;
      } else {
        userExperience[user] = 0;
      }
    }
    emit ExperienceUpdated(user, userExperience[user]);
  }
}
