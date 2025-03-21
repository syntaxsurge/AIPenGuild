/**
 * SPDX-License-Identifier: MIT
 *
 * @title NFTMintingPlatform
 *
 * @notice
 *   This contract manages the creation (minting) of NFTs. It also assigns random XP to the newly
 *   minted NFTs and updates the total XP of the receiving user. The marketplace aspect is kept
 *   separate, in the NFTMarketplaceHub contract. This contract is purely for minting and storing
 *   metadata about each NFT.
 *
 * Non-technical Explanation:
 * --------------------------
 *   - Imagine a digital factory that creates brand-new NFTs.
 *   - Each time a new NFT is created ("minted"), a random amount of XP is assigned to it.
 *   - Whoever owns the NFT automatically gets that NFT's XP added to their total.
 *
 * Technical Summary:
 *  - Inherits from ERC721URIStorage to store token URIs and metadata.
 *  - itemCounter tracks how many NFTs have been minted so far.
 *  - `nftItems` stores XP value, resourceUrl, timestamp of minting, and creator for each minted NFT.
 *  - An external contract (like NFTCreatorCollection) calls `generateNFTItem` to do the actual minting.
 *  - XP is assigned randomly, and user XP is updated via the `experienceModule`.
 */

pragma solidity ^0.8.2;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '../solidity/UserExperiencePoints.sol';

/**
 * @title INFTMintingPlatform
 * @notice An interface for external contracts (e.g., NFTCreatorCollection)
 *         to call into the minting logic.
 */
interface INFTMintingPlatform {
  function generateNFTItem(address recipient, uint256 collectionId, string memory imageUrl) external payable;

  function getRewardPool() external view returns (address);
}

/**
 * @title NFTMintingPlatform
 * @notice Core contract for creating NFTs, assigning XP, and storing metadata.
 *         Also references a rewardPool for fees, but does not collect them directly
 *         (that logic is typically handled by the calling contract).
 */
contract NFTMintingPlatform is ERC721URIStorage, Ownable, INFTMintingPlatform {
  /**
   * @dev The address of the reward pool, primarily used for external references
   *      (for example, a collection might ask "where do I send the 10%?").
   */
  address public immutable rewardPool;

  /**
   * @dev The address of the experience module, used to assign random XP upon minting
   *      and adjust user XP totals when NFTs are gained or lost.
   */
  address public immutable experienceModule;

  /**
   * @dev A counter that increments each time a new NFT is minted, providing a unique item ID.
   */
  uint256 private itemCounter;

  /**
   * @notice Holds key data for each minted NFT:
   *   xpValue    - how much XP the NFT is worth
   *   resourceUrl - a pointer to the NFT’s imagery or metadata (could be IPFS or direct URL)
   *   mintedAt   - the timestamp (in seconds) when the NFT was minted
   *   creator    - the address that caused the NFT to be minted (usually tx.origin)
   */
  struct MintedNFTData {
    uint256 xpValue;
    string resourceUrl;
    uint256 mintedAt;
    address creator;
  }

  /**
   * @notice A mapping of tokenId => MintedNFTData struct.
   */
  mapping(uint256 => MintedNFTData) public nftItems;

  /**
   * @notice A mapping of collectionId => contract address that is authorized to call `generateNFTItem`.
   */
  mapping(uint256 => address) public nftCollections;

  /**
   * @notice Emitted when a new NFT is minted.
   *
   * @param itemId The ID of the newly minted NFT.
   * @param collectionContract The contract address that called `generateNFTItem`.
   * @param xpValue The random XP assigned to this NFT.
   * @param resourceUrl The resource pointer (e.g., IPFS) for the NFT's data.
   */
  event NFTItemGenerated(
    uint256 indexed itemId,
    address indexed collectionContract,
    uint256 xpValue,
    string resourceUrl
  );

  /**
   * @notice Emitted when a new collection is registered or updated.
   *
   * @param collectionId The ID for the collection.
   * @param collectionContract The address authorized to mint for that collection ID.
   */
  event NFTCollectionRegistered(uint256 indexed collectionId, address collectionContract);

  /**
   * @notice Constructor sets up references to the reward pool and XP module,
   *         and initializes the ERC721 with a name and symbol.
   *
   * @param _rewardPool The address of the contract to which minting fees might be forwarded.
   * @param _experienceModule The address of the XP system contract.
   * @param _name The name for this NFT collection (at the protocol level).
   * @param _symbol The symbol for these NFTs (at the protocol level).
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
   * @notice Called by the owner to bind a collectionId to a specific contract address.
   *         That contract can then call `generateNFTItem` to mint on behalf of that collection ID.
   *
   * @param collectionId A numeric ID to represent a certain NFT collection.
   * @param collectionAddr The contract that is allowed to invoke `generateNFTItem` for this collectionId.
   */
  function setNFTCollection(uint256 collectionId, address collectionAddr) external onlyOwner {
    nftCollections[collectionId] = collectionAddr;
    emit NFTCollectionRegistered(collectionId, collectionAddr);
  }

  /**
   * @notice Mints a new NFT item. This is typically invoked by an external contract (like NFTCreatorCollection).
   *
   * @dev
   *   - The calling contract is responsible for any payment or fee logic.
   *   - This function randomly assigns XP to the minted NFT and updates the new owner's XP total.
   *
   * @param recipient The address that will receive ownership of the newly minted NFT.
   * @param collectionId Identifies which collection the NFT belongs to (e.g. 0 = primary).
   * @param imageUrl Points to the image or metadata, often an IPFS link.
   */
  function generateNFTItem(address recipient, uint256 collectionId, string memory imageUrl) external payable override {
    // Confirm the caller is authorized for this collectionId
    require(nftCollections[collectionId] == msg.sender, 'Not an authorized collection');
    require(recipient != address(0), 'Invalid recipient');

    itemCounter++;
    uint256 newId = itemCounter;

    // Mint the NFT to the specified recipient
    _safeMint(recipient, newId);

    // Request random XP from the experienceModule
    uint256 xpAssigned = IUserExperiencePoints(experienceModule).assignRandomXP(newId);

    // Record the minted NFT data
    nftItems[newId] = MintedNFTData({
      xpValue: xpAssigned,
      resourceUrl: imageUrl,
      mintedAt: block.timestamp,
      creator: tx.origin
    });

    // Increase the user's XP by the NFT’s XP value
    IUserExperiencePoints(experienceModule).modifyUserXP(recipient, newId, true);

    emit NFTItemGenerated(newId, msg.sender, xpAssigned, imageUrl);
  }

  /**
   * @notice Returns the address of the reward pool, for external referencing.
   */
  function getRewardPool() external view override returns (address) {
    return rewardPool;
  }

  /**
   * @notice Returns the ID of the last minted NFT. Useful for external indexing or UI queries.
   */
  function getLatestMintedId() external view returns (uint256) {
    return itemCounter;
  }
}
