/**
 * SPDX-License-Identifier: MIT
 *
 * @title UserExperiencePoints
 *
 * @notice
 *   This contract manages a user's "experience points" (XP), which can come from owning NFTs
 *   that have XP assigned, staking activities that grant XP, or direct XP additions/removals
 *   from authorized contracts.
 *
 * Non-technical summary:
 *   - If you hold an NFT worth 50 XP, your userExperience is incremented by 50.
 *   - If you sell or transfer that NFT, you lose that 50 XP.
 *   - Staking or special in-game actions might add or remove XP from you, performed by authorized contracts.
 */

pragma solidity ^0.8.2;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title IUserExperiencePoints
 * @notice Interface to ensure external contracts can interact with XP functionalities, such as random assignment,
 *         adding/removing XP for a user, etc.
 */
interface IUserExperiencePoints {
  /**
   * @notice Assign a random XP (1–100) to an NFT item, typically when minted.
   * @param itemId The NFT ID.
   * @return generatedXP The random XP assigned.
   */
  function assignRandomXP(uint256 itemId) external returns (uint256);

  /**
   * @notice Adjust the user's XP based on obtaining or losing an NFT.
   * @param user The user in question.
   * @param itemId The NFT ID (which has a stored XP value).
   * @param add If true, user gains that NFT's XP. If false, user loses it.
   */
  function modifyUserXP(address user, uint256 itemId, bool add) external;

  /**
   * @notice A method for authorized (staking or other) contracts to add or remove arbitrary XP from a user.
   * @param user The user whose XP is modified.
   * @param xp The numeric XP to add or remove.
   * @param add If true, add XP; if false, remove XP.
   */
  function stakeModifyUserXP(address user, uint256 xp, bool add) external;
}

/**
 * @title UserExperiencePoints
 * @notice Central registry tracking how much XP each user has. Also tracks how much XP each NFT is worth.
 *         When a user obtains an NFT, they gain that NFT's XP. If they lose it, they lose that XP. Additionally,
 *         special authorized contracts can adjust a user's XP for other reasons (like staking).
 */
contract UserExperiencePoints is Ownable, IUserExperiencePoints {
  /**
   * @notice Maps each user's address => total XP they have currently.
   */
  mapping(address => uint256) public userExperience;

  /**
   * @notice Maps an NFT itemId => the XP assigned to that item. This is set typically at mint time.
   */
  mapping(uint256 => uint256) public itemExperience;

  /**
   * @notice A user can only gain the XP from a specific NFT once. This tracks if the user currently "has" it.
   *         If `hasGainedXP[user][itemId]` is true, that user is credited with that NFT's XP.
   */
  mapping(address => mapping(uint256 => bool)) public hasGainedXP;

  /**
   * @notice Tracks which contracts are authorized to call `stakeModifyUserXP` for advanced XP adjustments.
   */
  mapping(address => bool) public authorizedCallers;

  /**
   * @notice Emitted whenever a user's XP changes (either by obtaining/losing an NFT or by direct staking adjustments).
   * @param user The user whose XP is updated.
   * @param updatedXP The new total XP of that user.
   */
  event ExperienceUpdated(address indexed user, uint256 updatedXP);

  /**
   * @notice Emitted whenever an NFT is assigned a random XP.
   * @param itemId The NFT itemId.
   * @param xpValue How many XP points were assigned.
   */
  event ExperienceAssigned(uint256 indexed itemId, uint256 xpValue);

  /**
   * @notice Constructor. Ownable sets `owner = msg.sender`. No special config needed here.
   */
  constructor() {
    // No custom logic
  }

  /**
   * @notice Allow the owner to designate a contract (like a staking pool) as authorized to call stakeModifyUserXP.
   * @param _caller The contract address to authorize or deauthorize.
   * @param _status True = authorized, false = deauthorized.
   */
  function setAuthorizedCaller(address _caller, bool _status) external onlyOwner {
    authorizedCallers[_caller] = _status;
  }

  /**
   * @notice Assign random XP to an NFT, typically at the time of minting. Range: 1–100.
   * @param itemId The NFT to which we assign random XP.
   * @return generatedXP The XP value assigned.
   */
  function assignRandomXP(uint256 itemId) external override returns (uint256) {
    uint256 generatedXP = (uint256(keccak256(abi.encodePacked(block.timestamp, itemId))) % 100) + 1;
    itemExperience[itemId] = generatedXP;

    emit ExperienceAssigned(itemId, generatedXP);
    return generatedXP;
  }

  /**
   * @notice Modify a user's XP based on an NFT item that they are gaining or losing.
   *         For example, if the NFT is worth 50 XP, and the user is gaining the NFT, add 50 to userExperience.
   *         If the user is losing it, remove 50.
   *
   * @param user The user in question.
   * @param itemId The NFT item.
   * @param add True to add XP, false to remove XP.
   */
  function modifyUserXP(address user, uint256 itemId, bool add) external override {
    require(msg.sender != address(0), 'Invalid caller');

    uint256 xpVal = itemExperience[itemId];

    if (add) {
      // The user is acquiring the NFT => gain its XP
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
   * @notice Allows an authorized contract to add or remove a specified amount of XP from a user.
   *         Typically used by staking or special game logic.
   *
   * @param user The user whose XP is modified.
   * @param xp The amount of XP to add or remove.
   * @param add True if we add XP, false if we remove XP.
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
