/**
 * SPDX-License-Identifier: MIT
 *
 * @title NFTMintingPlatform
 *
 * @notice
 *   This contract manages the creation (minting) of NFTs. It assigns random XP to each newly minted NFT
 *   and updates the user's total XP accordingly. It also allows different "collections" to be referenced
 *   so that external contracts like NFTCreatorCollection can call "generateNFTItem" on behalf of a user.
 *
 * Non-technical summary:
 *   - This is the "factory" that actually produces NFT tokens (using ERC721).
 *   - Whenever a new NFT is created, it stores a random XP value in `itemExperience`, and updates the user's XP.
 *   - Each NFT has a resourceUrl pointing to IPFS (or somewhere else) with the NFT's metadata (including AI attributes).
 */

pragma solidity ^0.8.2;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '../solidity/UserExperiencePoints.sol';

/**
 * @title Interface for external references to this platform. For instance, NFTCreatorCollection
 *        uses `generateNFTItem` to mint on behalf of a user.
 */
interface INFTMintingPlatform {
  /**
   * @notice Actually mints the NFT item and assigns random XP. Called by an authorized contract (e.g., NFTCreatorCollection).
   */
  function generateNFTItem(address recipient, uint256 collectionId, string memory imageUrl) external payable;

  /**
   * @notice Return the platform's reward pool address, used for referencing where fees go.
   */
  function getRewardPool() external view returns (address);
}

/**
 * @title NFTMintingPlatform
 * @notice The main ERC721 contract that stores minted NFTs. Each minted NFT automatically gets
 *         a random XP assigned, and the user's XP is increased accordingly. The resourceUrl for
 *         the NFT is typically an IPFS link storing the final metadata and AI attributes.
 */
contract NFTMintingPlatform is ERC721URIStorage, Ownable, INFTMintingPlatform {
  /**
   * @dev The address of the reward pool, so external referencing can know where to send fees, etc.
   */
  address public immutable rewardPool;

  /**
   * @dev The address of the experience module, used to manage user XP.
   */
  address public immutable experienceModule;

  /**
   * @dev A counter for how many NFTs have been minted, ensuring each NFT has a unique ID.
   */
  uint256 private itemCounter;

  /**
   * @notice Holds key data for each minted NFT:
   *   - xpValue: how many XP points are assigned to the NFT
   *   - resourceUrl: a pointer (IPFS or similar) to the NFT’s external JSON/data
   *   - mintedAt: timestamp when the NFT was minted
   *   - creator: which address triggered the minting (tx.origin or similar)
   */
  struct MintedNFTData {
    uint256 xpValue;
    string resourceUrl;
    uint256 mintedAt;
    address creator;
  }

  /**
   * @notice A mapping from tokenId => MintedNFTData. This helps store NFT-specific data on-chain.
   */
  mapping(uint256 => MintedNFTData) public nftItems;

  /**
   * @notice Maps collectionId => a contract address authorized to call generateNFTItem for that collection.
   */
  mapping(uint256 => address) public nftCollections;

  /**
   * @notice Emitted when a new NFT is minted, providing references to its XP, resource URL, etc.
   */
  event NFTItemGenerated(
    uint256 indexed itemId,
    address indexed collectionContract,
    uint256 xpValue,
    string resourceUrl
  );

  /**
   * @notice Emitted when a new collection is registered or updated with a contract address that can mint for it.
   */
  event NFTCollectionRegistered(uint256 indexed collectionId, address collectionContract);

  /**
   * @notice Constructor sets up the references to the reward pool, the XP module, and the token name/symbol.
   *
   * @param _rewardPool Where platform fees might be directed if needed.
   * @param _experienceModule The XP system contract for awarding XP to the user who mints the NFT.
   * @param _name The ERC721 name for this entire suite of NFTs.
   * @param _symbol The ERC721 symbol for these NFTs.
   */
  constructor(
    address _rewardPool,
    address _experienceModule,
    string memory _name,
    string memory _symbol
  ) ERC721(_name, _symbol) {
    require(_rewardPool != address(0), 'Invalid rewardPool');
    require(_experienceModule != address(0), 'Invalid experienceModule');
    rewardPool = _rewardPool;
    experienceModule = _experienceModule;
  }

  /**
   * @notice Bind a collectionId to a specific contract address. That contract can then mint NFTs
   *         via "generateNFTItem" for that collection ID.
   *
   * @param collectionId A numeric ID representing a specific NFT collection.
   * @param collectionAddr The contract authorized to mint for that collection.
   */
  function setNFTCollection(uint256 collectionId, address collectionAddr) external onlyOwner {
    nftCollections[collectionId] = collectionAddr;
    emit NFTCollectionRegistered(collectionId, collectionAddr);
  }

  /**
   * @notice Mint a new NFT item. Typically called by an authorized collection contract (like NFTCreatorCollection).
   *         The minted NFT is assigned a random XP, stored in `nftItems`.
   *
   * @param recipient The address that will own the newly minted NFT.
   * @param collectionId Identifies the collection (so we can verify the caller's authorization).
   * @param imageUrl A pointer to the NFT's resource (IPFS with metadata).
   */
  function generateNFTItem(address recipient, uint256 collectionId, string memory imageUrl) external payable override {
    // Ensure the caller is authorized for this collectionId
    require(nftCollections[collectionId] == msg.sender, 'Not an authorized collection');
    require(recipient != address(0), 'Invalid recipient');

    itemCounter++;
    uint256 newId = itemCounter;

    // Mint the NFT to the specified user
    _safeMint(recipient, newId);

    // Ask the XP module to assign random XP for this new NFT
    uint256 xpAssigned = IUserExperiencePoints(experienceModule).assignRandomXP(newId);

    // Record the minted NFT data on-chain
    nftItems[newId] = MintedNFTData({
      xpValue: xpAssigned,
      resourceUrl: imageUrl,
      mintedAt: block.timestamp,
      creator: tx.origin
    });

    // The user gets credited with the XP from the newly minted NFT
    IUserExperiencePoints(experienceModule).modifyUserXP(recipient, newId, true);

    emit NFTItemGenerated(newId, msg.sender, xpAssigned, imageUrl);
  }

  /**
   * @notice Returns the address of the reward pool, so external systems can know where to direct funds if needed.
   */
  function getRewardPool() external view override returns (address) {
    return rewardPool;
  }

  /**
   * @notice Returns how many NFTs have been minted so far. Also the highest tokenId minted.
   */
  function getLatestMintedId() external view returns (uint256) {
    return itemCounter;
  }
}
