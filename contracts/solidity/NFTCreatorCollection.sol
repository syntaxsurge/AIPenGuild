/**
 * SPDX-License-Identifier: MIT
 *
 * @title NFTCreatorCollection
 *
 * @notice
 *  This contract represents a specialized "collection" factory for creating NFTs with a choice of
 *  payment in either native currency or XP (experience points). The minted NFTs are actually
 *  manufactured by the NFTMintingPlatform contract, referenced here by `minterPlatform`. This contract
 *  adds additional logic to handle:
 *    - Payment in native currency (sent to the reward pool).
 *    - Payment in XP (deducted from the user's total XP).
 *
 *  As an example scenario, imagine you want to allow users to mint a unique, AI-generated NFT that
 *  requires either 0.1 ETH or 100 XP. This contract organizes those minting rules while delegating
 *  the actual minting to NFTMintingPlatform.
 *
 *  Non-technical summary:
 *   - A user can call "mintFromCollection" to create an NFT.
 *   - They either pay the contract's native currency price, or pay with 100 XP.
 *   - The NFT is actually minted by the NFTMintingPlatform but under the umbrella of this collection.
 *   - If user pays with currency, the funds go to the PlatformRewardPool. If user pays with XP,
 *     that XP is subtracted from their account.
 */

pragma solidity ^0.8.2;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @dev Interface for the NFTMintingPlatform, which actually mints the NFTs based on calls from this contract.
 *      This allows NFTCreatorCollection to remain focused on the business logic (price, XP deduction) while
 *      delegating the real token creation to the platform contract.
 */
interface INFTMintingPlatformForCollection {
  /**
   * @notice Gets the address of the reward pool associated with the main minting platform.
   */
  function getRewardPool() external view returns (address);

  /**
   * @notice Instruct the minting platform to actually generate (mint) the NFT item.
   * @param recipient The address that will own the newly minted NFT.
   * @param collectionId The ID of the collection (e.g., 0 for the primary one).
   * @param imageUrl The metadata pointer (IPFS link or other) for the NFT's visuals/attributes.
   */
  function generateNFTItem(address recipient, uint256 collectionId, string memory imageUrl) external payable;
}

/**
 * @dev Interface for the experience points (XP) contract, to allow XP deduction or addition.
 */
interface IUserExperiencePointsForCollection {
  /**
   * @notice Adjust (increase or decrease) the XP of a particular user in a staking-like manner.
   * @param user The user whose XP is changed.
   * @param xp The numeric XP amount to add or remove.
   * @param add If true, add XP; if false, remove XP.
   */
  function stakeModifyUserXP(address user, uint256 xp, bool add) external;

  /**
   * @notice Return how much XP a user currently has.
   * @param user The address whose XP we want to check.
   */
  function userExperience(address user) external view returns (uint256);
}

/**
 * @title NFTCreatorCollection
 * @notice This contract organizes all the logic for a specific "collection" that can be minted.
 *         Users can choose to pay in native currency or XP. If paying in currency,
 *         the funds move to the reward pool. If paying in XP, the user's XP is reduced.
 *
 *         The contract references the minterPlatform (NFTMintingPlatform) to perform
 *         the actual NFT minting calls behind the scenes, ensuring consistent NFT creation
 *         across the entire platform.
 *
 *         This allows multiple "collections" to be configured, each with different
 *         names, descriptions, prices, supplies, etc.
 */
contract NFTCreatorCollection is Ownable {
  /**
   * @notice Stores configuration about a single collection's parameters:
   *         - name: The name of the collection (e.g., "Epic Swords").
   *         - description: A brief explanation for the collection.
   *         - mintPrice: The native currency price (in wei) if paying by tokens.
   *         - maxSupply: The maximum total supply for this collection's NFTs.
   *         - currentSupply: How many have been minted so far (to enforce maxSupply).
   *         - active: Whether minting in this collection is currently active or paused.
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
   * @notice The primary collection (ID = 0). Typically the main or default set of NFTs.
   */
  CollectionData public primaryCollection;

  /**
   * @notice Additional collections stored in a mapping for extended usage:
   *         If you define a new collection, it will get a new ID here.
   */
  mapping(uint256 => CollectionData) public additionalCollections;

  /**
   * @dev An internal counter to assign incremental IDs for newly defined collections.
   */
  uint256 private collectionIndex;

  /**
   * @dev The address of the NFTMintingPlatform used to do the actual minting calls.
   */
  address public immutable minterPlatform;

  /**
   * @dev The address of the XP module to subtract XP from a user if they opt to pay in XP.
   */
  address public immutable experienceModule;

  /**
   * @dev The default cost in native currency if not otherwise overridden by a collection.
   *      Set to 0.1 ETH as the default cost. This is used if no mintPrice is set or if it's 0.
   */
  uint256 public constant DEFAULT_NATIVE_COST = 0.1 ether;

  /**
   * @notice Emitted whenever a new additional collection is defined in the contract.
   *
   * @param collectionId The new ID for that collection.
   * @param name The chosen name for the collection.
   * @param description A text description of the collection.
   * @param mintPrice The cost in native currency.
   * @param maxSupply The maximum number of NFTs that can be minted in this collection.
   */
  event NewCollectionDefined(
    uint256 indexed collectionId,
    string name,
    string description,
    uint256 mintPrice,
    uint256 maxSupply
  );

  /**
   * @notice The constructor sets up the primary collection's configuration and references to both
   *         the minting platform (which actually creates the NFTs) and the XP module (to allow XP-based payments).
   *
   * @param initialName The name of the primary collection (ID=0).
   * @param initialDescription A descriptive text for the primary collection.
   * @param initialMintPrice The mint price in wei if user chooses to pay with native currency.
   * @param initialMaxSupply The maximum supply for the primary collection.
   * @param minterPlatformAddress The address of the NFTMintingPlatform contract.
   * @param xpModuleAddress The address of the UserExperiencePoints contract.
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
   * @notice Update the mint price for the primary collection. This is only feasible by the contract owner.
   * @param newPrice The new price in wei for the primary collection if paying by native tokens.
   */
  function updateMintPrice(uint256 newPrice) external onlyOwner {
    primaryCollection.mintPrice = newPrice;
  }

  /**
   * @notice Toggle the active status of the primary collection, enabling or disabling new mints.
   *         If it's active, you can mint. If toggled off, no new mints can happen (though existing tokens remain).
   */
  function toggleCollectionActivity() external onlyOwner {
    primaryCollection.active = !primaryCollection.active;
  }

  /**
   * @notice Create and define a brand-new additional collection with its own rules.
   * @param nameValue The name for the new collection.
   * @param descriptionValue A textual description for the new collection.
   * @param price The mint price in wei if paying with native currency for this new collection.
   * @param supplyLimit The maximum supply of NFTs for this collection.
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
   * @notice Mint an NFT from a specific collection, paying either with native currency or XP.
   *
   *         If `payWithXP` is true, 100 XP will be deducted from the user's XP.
   *         If `payWithXP` is false, user must send the required amount of native currency
   *         equal to the `mintPrice` (or the default if none is set).
   *
   * @param collectionId The ID of the collection (0 means the primary collection).
   * @param imageUrl The IPFS or other link to the final metadata/art image.
   * @param payWithXP If true, the user will be charged 100 XP. If false, they pay with tokens.
   *
   * Requirements:
   *  - The collection must be active.
   *  - The user must either have enough XP (if paying with XP) or send enough native currency (if paying with tokens).
   *  - The supply limit must not be exceeded.
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
      // The user has chosen to pay with XP. So we check if they have at least 100 XP.
      IUserExperiencePointsForCollection xpContract = IUserExperiencePointsForCollection(experienceModule);
      uint256 userXP = xpContract.userExperience(msg.sender);
      require(userXP >= 100, 'Not enough XP (need 100)');

      // Subtract 100 XP from the user's total experience points.
      xpContract.stakeModifyUserXP(msg.sender, 100, false);

      // Ensure no native currency was sent in this call if paying with XP.
      require(msg.value == 0, 'Cannot send ETH if paying with XP');
    } else {
      // The user is paying with native currency. They must send the required amount.
      uint256 requiredPrice = info.mintPrice > 0 ? info.mintPrice : DEFAULT_NATIVE_COST;
      require(msg.value >= requiredPrice, 'Insufficient native payment');

      // The entire fee goes to the reward pool (owned by the main platform).
      address rewardPool = INFTMintingPlatformForCollection(minterPlatform).getRewardPool();
      (bool success, ) = rewardPool.call{value: msg.value}('');
      require(success, 'Fee payment to reward pool failed');
    }

    // Actually mint the NFT by calling the minter platform's `generateNFTItem`.
    INFTMintingPlatformForCollection(minterPlatform).generateNFTItem(msg.sender, collectionId, imageUrl);

    // Increment the supply count for this collection.
    info.currentSupply++;
  }
}
