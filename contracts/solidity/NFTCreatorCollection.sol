/**
 * SPDX-License-Identifier: MIT
 *
 * @title NFTCreatorCollection
 *
 * @notice
 *   This updated NFTCreatorCollection now enables users to mint an NFT by paying either:
 *     1) 0.1 in native currency (which will be stored in the PlatformRewardPool), OR
 *     2) 100 XP, which is deducted from their experience points via stakeModifyUserXP.
 *
 *   The admin can withdraw the collected native currency from the PlatformRewardPool using the existing admin panel.
 */

pragma solidity ^0.8.2;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @dev Interface for the NFTMintingPlatform, which handles the actual NFT minting logic.
 */
interface INFTMintingPlatformForCollection {
  function getRewardPool() external view returns (address);

  function generateNFTItem(address recipient, uint256 collectionId, string memory imageUrl) external payable;
}

interface IUserExperiencePointsForCollection {
  function stakeModifyUserXP(address user, uint256 xp, bool add) external;

  function userExperience(address user) external view returns (uint256);
}

/**
 * @title NFTCreatorCollection
 * @notice A collection contract that now supports payment by XP or native currency.
 */
contract NFTCreatorCollection is Ownable {
  /**
   * @notice Stores configuration about a single collection.
   *
   * @param name The name of the collection.
   * @param description A description of the collection.
   * @param mintPrice The price in wei if the user chooses to pay with native currency.
   * @param maxSupply The total maximum number of NFTs that can be minted.
   * @param currentSupply The number of NFTs already minted.
   * @param active Whether minting is currently enabled.
   */
  struct CollectionData {
    string name;
    string description;
    uint256 mintPrice;
    uint256 maxSupply;
    uint256 currentSupply;
    bool active;
  }

  /**
   * @notice Primary collection (ID=0).
   */
  CollectionData public primaryCollection;

  /**
   * @notice Additional collections stored in a mapping.
   */
  mapping(uint256 => CollectionData) public additionalCollections;

  /**
   * @dev The index for additional collections.
   */
  uint256 private collectionIndex;

  /**
   * @dev Address of the NFTMintingPlatform used for actual minting calls.
   */
  address public immutable minterPlatform;

  /**
   * @dev Address of the experience module, so we can deduct 100 XP if user chooses XP payment.
   */
  address public immutable experienceModule;

  /**
   * @dev The default cost in native currency if the user opts not to pay with XP, set to 0.1 ETH.
   *      Collections can individually set their own "mintPrice," so you can also override per-collection.
   */
  uint256 public constant DEFAULT_NATIVE_COST = 0.1 ether;

  /**
   * @notice Emitted when a new additional collection is defined.
   */
  event NewCollectionDefined(
    uint256 indexed collectionId,
    string name,
    string description,
    uint256 mintPrice,
    uint256 maxSupply
  );

  /**
   * @notice Constructor that sets the primary collection and references to minterPlatform, XP module.
   * @param initialName - name of the primary collection
   * @param initialDescription - description of the primary collection
   * @param initialMintPrice - mint price in wei (if paying with native currency)
   * @param initialMaxSupply - max supply for the primary collection
   * @param minterPlatformAddress - address of NFTMintingPlatform
   * @param xpModuleAddress - address of UserExperiencePoints contract
   */
  constructor(
    string memory initialName,
    string memory initialDescription,
    uint256 initialMintPrice,
    uint256 initialMaxSupply,
    address minterPlatformAddress,
    address xpModuleAddress
  ) {
    primaryCollection = CollectionData({
      name: initialName,
      description: initialDescription,
      mintPrice: initialMintPrice > 0 ? initialMintPrice : DEFAULT_NATIVE_COST,
      maxSupply: initialMaxSupply,
      currentSupply: 0,
      active: true
    });

    require(minterPlatformAddress != address(0), 'Invalid minter platform');
    require(xpModuleAddress != address(0), 'Invalid XP module');
    minterPlatform = minterPlatformAddress;
    experienceModule = xpModuleAddress;
  }

  /**
   * @notice Update the mint price (if paying with native currency) for the primary collection.
   * @param newPrice The new price in wei.
   */
  function updateMintPrice(uint256 newPrice) external onlyOwner {
    primaryCollection.mintPrice = newPrice;
  }

  /**
   * @notice Toggle active status of the primary collection.
   */
  function toggleCollectionActivity() external onlyOwner {
    primaryCollection.active = !primaryCollection.active;
  }

  /**
   * @notice Define a new additional collection.
   * @param nameValue The name for the new collection
   * @param descriptionValue The description for the new collection
   * @param price The mint price if paying with native currency
   * @param supplyLimit The max supply for this new collection
   */
  function defineNewCollection(
    string memory nameValue,
    string memory descriptionValue,
    uint256 price,
    uint256 supplyLimit
  ) external onlyOwner {
    require(price > 0, 'Price must exceed zero');
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

    emit NewCollectionDefined(collectionIndex, nameValue, descriptionValue, price, supplyLimit);
  }

  /**
   * @notice Mint an NFT from a specific collection by paying either 100 XP or the native mint price in wei.
   *
   * @param collectionId The ID of the collection (0 for primary).
   * @param imageUrl The URL or IPFS link for the NFT's artwork.
   * @param payWithXP Whether the user wants to pay with XP (true) or native currency (false).
   */
  function mintFromCollection(uint256 collectionId, string memory imageUrl, bool payWithXP) external payable {
    CollectionData storage info;
    if (collectionId == 0) {
      require(primaryCollection.active, 'Primary collection not active');
      require(primaryCollection.currentSupply < primaryCollection.maxSupply, 'Sold out');
      info = primaryCollection;
    } else {
      CollectionData storage additional = additionalCollections[collectionId];
      require(additional.active, 'Collection not active');
      require(additional.currentSupply < additional.maxSupply, 'Sold out');
      info = additional;
    }

    if (payWithXP) {
      // Deduct 100 XP from user if they choose to pay with XP
      IUserExperiencePointsForCollection xpContract = IUserExperiencePointsForCollection(experienceModule);
      uint256 userXP = xpContract.userExperience(msg.sender);
      require(userXP >= 100, 'Not enough XP (need 100)');
      // remove 100 XP
      xpContract.stakeModifyUserXP(msg.sender, 100, false);
      // no native currency required
      require(msg.value == 0, 'Cannot send ETH if paying with XP');
    } else {
      // Must pay with native currency
      uint256 requiredPrice = info.mintPrice > 0 ? info.mintPrice : DEFAULT_NATIVE_COST;
      require(msg.value >= requiredPrice, 'Insufficient native payment');

      // Entire fee goes to the reward pool for the admin to withdraw
      address rewardPool = INFTMintingPlatformForCollection(minterPlatform).getRewardPool();
      (bool success, ) = rewardPool.call{value: msg.value}('');
      require(success, 'Fee payment to reward pool failed');
    }

    // Actually mint the NFT
    INFTMintingPlatformForCollection(minterPlatform).generateNFTItem(msg.sender, collectionId, imageUrl);

    // Increment supply count
    info.currentSupply++;
  }
}
