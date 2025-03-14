/**
 * SPDX-License-Identifier: MIT
 */

pragma solidity ^0.8.2;

import '@openzeppelin/contracts/access/Ownable.sol';

interface IAINFTExchange {
  function generateAIItem(address recipient, uint256 collectionId, string memory imageUrl) external payable;

  function getRewardPool() external view returns (address);

  function setAiCollection(uint256 collectionId, address collectionAddr) external;
}

contract AICreatorCollection is Ownable {
  struct CollectionData {
    string name;
    string description;
    uint256 mintPrice;
    uint256 maxSupply;
    uint256 currentSupply;
    bool active;
  }

  CollectionData public primaryCollection;
  mapping(uint256 => CollectionData) public additionalCollections;
  uint256 private collectionIndex;
  address public immutable aiExchange;

  constructor(
    string memory initialName,
    string memory initialDescription,
    uint256 initialMintPrice,
    uint256 initialMaxSupply,
    address exchangeAddress
  ) Ownable(msg.sender) {
    primaryCollection = CollectionData({
      name: initialName,
      description: initialDescription,
      mintPrice: initialMintPrice,
      maxSupply: initialMaxSupply,
      currentSupply: 0,
      active: true
    });
    aiExchange = exchangeAddress;
  }

  function updateMintPrice(uint256 newPrice) external onlyOwner {
    primaryCollection.mintPrice = newPrice;
  }

  function toggleCollectionActivity() external onlyOwner {
    primaryCollection.active = !primaryCollection.active;
  }

  function defineNewCollection(
    string memory nameValue,
    string memory descriptionValue,
    uint256 price,
    uint256 supplyLimit
  ) external {
    require(price > 0, 'Mint price must exceed zero');
    require(supplyLimit > 0, 'Max supply must exceed zero');
    collectionIndex++;
    additionalCollections[collectionIndex] = CollectionData({
      name: nameValue,
      description: descriptionValue,
      mintPrice: price,
      maxSupply: supplyLimit,
      currentSupply: 0,
      active: true
    });
  }

  function mintFromCollection(uint256 collectionId, string memory imageUrl) external payable {
    CollectionData storage info;
    if (collectionId == 0) {
      // Minting from the primary collection
      require(primaryCollection.active, 'Primary collection not active');
      require(primaryCollection.currentSupply < primaryCollection.maxSupply, 'Sold out');
      require(msg.value >= primaryCollection.mintPrice, 'Insufficient funds');
      info = primaryCollection;
    } else {
      // Minting from an additional collection
      info = additionalCollections[collectionId];
      require(info.active, 'Collection not active');
      require(info.currentSupply < info.maxSupply, 'Sold out');
      require(msg.value >= info.mintPrice, 'Insufficient funds');
    }

    // Distribute platform fee (10%)
    uint256 platformFee = (msg.value * 10) / 100;
    address rewardPool = IAINFTExchange(aiExchange).getRewardPool();

    (bool feeSuccess, ) = rewardPool.call{value: platformFee}('');
    require(feeSuccess, 'Fee payment failed');

    (bool creatorPaid, ) = payable(owner()).call{value: msg.value - platformFee}('');
    require(creatorPaid, 'Creator payment failed');

    IAINFTExchange(aiExchange).generateAIItem(msg.sender, collectionId, imageUrl);
    info.currentSupply++;
  }
}
