/**
 * SPDX-License-Identifier: MIT
 *
 * UserExperiencePoints.sol
 *
 * This contract manages "experience points" (XP) for NFT owners.
 * It can also handle extra XP from staking, if an authorized contract calls `stakeModifyUserXP`.
 *
 * Non-technical Explanation:
 * --------------------------
 * Imagine a game-like scoreboard for NFT owners. Each item has some XP, and
 * if you own that NFT, you "gain" that XP in your total. If you lose ownership,
 * you "lose" that NFT's XP. There's also a feature for staking, allowing
 * specialized staking contracts to modify a user's XP over time.
 */

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IUserExperiencePoints
 * @notice This interface describes how external contracts interact with the XP system.
 */
interface IUserExperiencePoints {
    function assignRandomXP(uint256 itemId) external returns (uint256);
    function modifyUserXP(address user, uint256 itemId, bool add) external;
    function stakeModifyUserXP(address user, uint256 xp, bool add) external;
}

/**
 * @title UserExperiencePoints
 * @notice The concrete implementation of the XP system.
 * @dev Inherits Ownable so only the deployer can set or remove authorized stakers.
 */
contract UserExperiencePoints is Ownable, IUserExperiencePoints {
    /**
     * @dev userExperience[address] = total XP for that user.
     */
    mapping(address => uint256) public userExperience;

    /**
     * @dev itemExperience[itemId] = the XP assigned specifically to that item (if any).
     */
    mapping(uint256 => uint256) public itemExperience;

    /**
     * @dev hasGainedXP[user][itemId] indicates whether user has already been credited
     * or debited for the XP of that item. Used to avoid double-counting.
     */
    mapping(address => mapping(uint256 => bool)) public hasGainedXP;

    /**
     * @dev authorizedCallers[address] = whether a given contract can call stakeModifyUserXP().
     */
    mapping(address => bool) public authorizedCallers;

    /// Emitted when a user's total XP changes.
    event ExperienceUpdated(address indexed user, uint256 updatedXP);

    /// Emitted when a random XP is assigned to an item at mint.
    event ExperienceAssigned(uint256 indexed itemId, uint256 xpValue);

    /**
     * @dev Constructor uses Ownable's default approach to set the initial owner.
     */
    constructor() {
        // No extra logic; just rely on Ownable.
    }

    /**
     * @notice Allows only the owner to designate certain contracts (like a staking contract)
     *         as authorized to add or remove XP from users via stakeModifyUserXP.
     * @param _caller The contract address to grant or revoke permission.
     * @param _status true = grant, false = revoke.
     */
    function setAuthorizedCaller(address _caller, bool _status) external onlyOwner {
        authorizedCallers[_caller] = _status;
    }

    /**
     * @notice Assign a random XP (1-100) to an NFT item. Typically called once at NFT mint.
     * @param itemId The minted NFT's ID.
     * @return The randomly generated XP.
     */
    function assignRandomXP(uint256 itemId) external override returns (uint256) {
        uint256 generatedXP = (uint256(keccak256(abi.encodePacked(block.timestamp, itemId))) % 100) + 1;
        itemExperience[itemId] = generatedXP;
        emit ExperienceAssigned(itemId, generatedXP);
        return generatedXP;
    }

    /**
     * @notice Called by e.g. NFTMarketplaceHub to add or remove XP from a user based on an item’s XP.
     * @param user The user address gaining or losing XP.
     * @param itemId The NFT item in question.
     * @param add true = add XP, false = remove XP.
     */
    function modifyUserXP(address user, uint256 itemId, bool add) external override {
        // We require msg.sender != address(0) to avoid a zero-caller edge case
        require(msg.sender != address(0), "Invalid caller");

        uint256 xpVal = itemExperience[itemId];

        if (add) {
            // We add xpVal to the user if they haven't gained it yet
            require(!hasGainedXP[user][itemId], "XP already granted for this item to user");
            userExperience[user] += xpVal;
            hasGainedXP[user][itemId] = true;
        } else {
            // We remove xpVal from the user if they previously had it
            require(hasGainedXP[user][itemId], "No XP found for user and item");
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
     * @notice Allows an authorized staking contract to add or remove XP for a user (bypassing item-based logic).
     * @param user The user address to update.
     * @param xp The amount of XP to add or remove.
     * @param add true = add, false = remove.
     */
    function stakeModifyUserXP(address user, uint256 xp, bool add) external override {
        require(authorizedCallers[msg.sender], "Caller not authorized to modify XP");
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