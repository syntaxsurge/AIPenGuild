/**
 * SPDX-License-Identifier: MIT
 *
 * UserExperiencePoints.sol
 *
 * This contract manages the "experience points" (XP) for users who own NFTs in the platform.
 * It allows assigning random XP to new items, and updating XP for users when they gain or lose ownership of an NFT.
 *
 * Non-technical Explanation:
 * --------------------------
 * Think of it like a game scoreboard. Each user accumulates XP based on the NFTs they own.
 * Whenever an NFT is minted, it is assigned a random XP value. When a user acquires that NFT,
 * they get that XP added to their total. If they sell or transfer the NFT, they lose that portion of XP.
 */

pragma solidity ^0.8.2;

// Importing Ownable from OpenZeppelin to allow only the owner to do certain actions if needed.
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UserExperiencePoints
 * @notice This contract handles the logic of assigning and tracking XP for NFTs and the users who own them.
 * @dev Inherits Ownable to restrict possible administrative functionalities if needed.
 */
contract UserExperiencePoints is Ownable {
    /**
     * @dev A mapping that keeps track of each user's total XP.
     *      Key: user address, Value: total XP this user has accumulated.
     */
    mapping(address => uint256) public userExperience;

    /**
     * @dev A mapping that keeps track of how much XP is associated with each item (NFT).
     *      Key: itemId, Value: the XP assigned to that item.
     */
    mapping(uint256 => uint256) public itemExperience;

    /**
     * @dev A nested mapping to check if a user has previously gained XP from a specific item.
     *      Key1: user address
     *      Key2: itemId
     *      Value: boolean (true if they have gained XP from owning this item)
     */
    mapping(address => mapping(uint256 => bool)) public hasGainedXP;

    /**
     * @dev Emitted whenever a user's XP changes (e.g., they gained or lost XP due to an item).
     * @param user The user whose XP was updated.
     * @param updatedXP The new total XP of that user.
     */
    event ExperienceUpdated(address indexed user, uint256 updatedXP);

    /**
     * @dev Emitted when XP is assigned to an item. This typically occurs upon minting.
     * @param itemId The ID of the NFT item that had XP assigned.
     * @param xpValue The amount of XP assigned.
     */
    event ExperienceAssigned(uint256 indexed itemId, uint256 xpValue);

    /**
     * @dev The constructor, assigning the initial owner of the contract.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Assigns a random XP value to a given NFT item.
     * @dev The randomization is not cryptographically secure, but it uses a simple hash of block timestamp and itemId.
     * @param itemId The ID of the NFT to assign XP to.
     * @return The randomly generated XP value.
     */
    function assignRandomXP(uint256 itemId) external returns (uint256) {
        // Generate a pseudo-random number between 1 and 100.
        uint256 generatedXP = (uint256(keccak256(abi.encodePacked(block.timestamp, itemId))) % 100) + 1;
        // Store that XP in the itemExperience mapping.
        itemExperience[itemId] = generatedXP;
        // Emit an event indicating the item has XP assigned.
        emit ExperienceAssigned(itemId, generatedXP);
        return generatedXP;
    }

    /**
     * @notice Adjusts a user's XP based on the item they've acquired or lost.
     * @dev If "add" is true, the user gains XP. Otherwise, the user loses XP associated with that item.
     * @param user The address of the user whose XP is being modified.
     * @param itemId The NFT item that is causing the XP change.
     * @param add Whether we are adding (true) or removing (false) XP for this user.
     */
    function modifyUserXP(address user, uint256 itemId, bool add) external {
        // Retrieve the XP for this item.
        uint256 xpVal = itemExperience[itemId];

        if (add) {
            // We are adding XP to the user for this item.
            require(!hasGainedXP[user][itemId], "XP already granted");
            userExperience[user] += xpVal;
            hasGainedXP[user][itemId] = true;
        } else {
            // We are removing XP from the user for this item.
            require(hasGainedXP[user][itemId], "No XP found for this user and item");

            // Only remove as much XP as the user has (avoid negative values).
            if (userExperience[user] >= xpVal) {
                userExperience[user] -= xpVal;
            } else {
                userExperience[user] = 0;
            }
            hasGainedXP[user][itemId] = false;
        }

        // Emit an event to inform that the user's XP has been updated.
        emit ExperienceUpdated(user, userExperience[user]);
    }
}