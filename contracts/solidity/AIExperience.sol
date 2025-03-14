/**
 * SPDX-License-Identifier: MIT
 */

pragma solidity ^0.8.2;

import '@openzeppelin/contracts/access/Ownable.sol';

contract AIExperience is Ownable {
  mapping(address => uint256) public userExperience;
  mapping(uint256 => uint256) public itemExperience;
  mapping(address => mapping(uint256 => bool)) public hasGainedXP;

  event ExperienceUpdated(address indexed user, uint256 updatedXP);
  event ExperienceAssigned(uint256 indexed itemId, uint256 xpValue);

  constructor() Ownable(msg.sender) {}

  function assignRandomXP(uint256 itemId) external returns (uint256) {
    uint256 generatedXP = (uint256(keccak256(abi.encodePacked(block.timestamp, itemId))) % 100) + 1;
    itemExperience[itemId] = generatedXP;
    emit ExperienceAssigned(itemId, generatedXP);
    return generatedXP;
  }

  function modifyUserXP(address user, uint256 itemId, bool add) external {
    uint256 xpVal = itemExperience[itemId];
    if (add) {
      require(!hasGainedXP[user][itemId], 'XP already granted');
      userExperience[user] += xpVal;
      hasGainedXP[user][itemId] = true;
    } else {
      require(hasGainedXP[user][itemId], 'No XP found for this user and item');
      if (userExperience[user] >= xpVal) {
        userExperience[user] -= xpVal;
      } else {
        userExperience[user] = 0;
      }
      hasGainedXP[user][itemId] = false;
    }
    emit ExperienceUpdated(user, userExperience[user]);
  }
}
