/**
 * SPDX-License-Identifier: MIT
 *
 * NFTMarketplaceHub.sol
 *
 * This contract serves as a marketplace hub for NFTs (Non-Fungible Tokens).
 * It manages:
 *   - Creating new NFT items from a registered collection,
 *   - Listing, unlisting, and purchasing NFTs,
 *   - Handling fees that go to the reward pool,
 *   - Integrating with a UserExperiencePoints contract to track XP for owners.
 *
 * Non-technical Explanation:
 * --------------------------
 * Think of it as the main "store" or "hub" for all NFTs. Collections can register themselves
 * here, so that minted items can appear in this marketplace. The contract:
 *   1) Mints new NFTs (with a unique itemId) whenever a registered collection calls generateNFTItem().
 *   2) Lets NFT owners list their items for sale.
 *   3) Lets buyers purchase those items, sending fees to the platform's reward pool and the rest to the seller.
 *   4) Notifies a separate XP system whenever ownership changes, awarding or removing XP from addresses.
 */

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./UserExperiencePoints.sol";

interface INFTCreatorCollection {
  function owner() external view returns (address);
}

/**
 * @title NFTMarketplaceHub
 * @notice Main marketplace contract to create, list, buy, and track NFTs.
 * @dev Inherits from ERC721URIStorage for NFT logic, and Ownable for admin controls.
 */
contract NFTMarketplaceHub is ERC721URIStorage, Ownable {
  // A counter to assign unique itemIds to newly created NFTs
  uint256 private itemCounter;

  // The address of the reward pool (where a fraction of each sale goes)
  address public immutable rewardPool;

  // The address of the experience module that tracks user XP
  address public immutable experienceModule;

  // A constant that defines the platform fee as a percentage (10%)
  uint256 public constant FEE_PERCENT = 10;

  // A mapping from an itemId to the time it was minted, for quick retrieval
  mapping(uint256 => uint256) public mintedAt;

  /**
   * @dev Each NFT item is stored with:
   *   itemId:      A unique numeric identifier
   *   creator:     The address that created this NFT (collection owner)
   *   xpValue:     The random XP assigned at creation (for reference)
   *   isOnSale:    Whether or not this NFT is currently for sale
   *   salePrice:   If isOnSale is true, how much it costs (in wei)
   *   resourceUrl: The metadata or link to the NFT's image or file
   */
  struct NFTItem {
    uint256 itemId;
    address creator;
    uint256 xpValue;
    bool isOnSale;
    uint256 salePrice;
    string resourceUrl;
  }

  /**
   * @dev A mapping from an itemId to its NFTItem data.
   */
  mapping(uint256 => NFTItem) public nftData;

  /**
   * @dev Maps a collectionId (a simple numeric ID) to the contract address that
   * actually defines that collection (like NFTCreatorCollection).
   */
  mapping(uint256 => address) public nftCollections;

  // Events for tracking creation, listing, unlisting, sale, and new contract registrations
  event NFTItemGenerated(uint256 indexed itemId, address indexed collectionContract, uint256 xpGained, string imageURL);
  event NFTItemListed(uint256 indexed itemId, uint256 price);
  event NFTItemUnlisted(uint256 indexed itemId);
  event NFTItemSold(uint256 indexed itemId, address seller, address buyer, uint256 amount);
  event NFTContractRegistered(uint256 indexed collectionId, address collectionContract);

  /**
   * @dev The constructor receives the addresses for the reward pool and the XP contract,
   * plus the typical parameters for an ERC721 (name, symbol).
   */
  constructor(
    address poolAddr,
    address xpAddr,
    string memory _name,
    string memory _symbol
  ) ERC721(_name, _symbol) {
    rewardPool = poolAddr;
    experienceModule = xpAddr;
  }

  /**
   * @notice Called by a registered collection to mint a brand-new NFT item.
   *         The calling collection must be recognized in nftCollections[collectionId].
   * @param recipient The address that will receive (own) the newly minted NFT.
   * @param collectionId The ID referencing which collection is creating this NFT.
   * @param imageUrl A string referencing the NFT's resource or metadata (e.g. IPFS link).
   */
  function generateNFTItem(address recipient, uint256 collectionId, string memory imageUrl) external payable {
    // Ensure that the caller is the recognized contract for this collectionId
    require(nftCollections[collectionId] == msg.sender, "Not authorized collection");
    
    // We increment itemCounter to get a fresh itemId
    uint256 newId = _nextItemId();

    // Mint an ERC721 token to 'recipient'
    _safeMint(recipient, newId);

    // Assign random XP to this NFT by calling the XP contract
    uint256 xpAssigned = IUserExperiencePoints(experienceModule).assignRandomXP(newId);

    // The new owner is credited with that XP
    IUserExperiencePoints(experienceModule).modifyUserXP(recipient, newId, true);

    // The collection contract can specify the "creator" who conceptually made it
    address colOwner = INFTCreatorCollection(nftCollections[collectionId]).owner();

    // Store the item data
    nftData[newId] = NFTItem({
      itemId: newId,
      creator: colOwner,
      xpValue: xpAssigned,
      isOnSale: false,
      salePrice: 0,
      resourceUrl: imageUrl
    });

    // Record the block timestamp of mint
    mintedAt[newId] = block.timestamp;

    // Emit an event about the newly created item
    emit NFTItemGenerated(newId, nftCollections[collectionId], xpAssigned, imageUrl);
  }

  /**
   * @notice List an owned NFT for sale at a specified price.
   * @param itemId The ID of the NFT item (token) to list.
   * @param price The listing price (in wei).
   */
  function listNFTItem(uint256 itemId, uint256 price) external {
    // Only the true owner of this NFT can list it
    require(ownerOf(itemId) == msg.sender, "Caller not item owner");
    // Must have a positive price
    require(price > 0, "Price must be greater than zero");

    nftData[itemId].isOnSale = true;
    nftData[itemId].salePrice = price;

    emit NFTItemListed(itemId, price);
  }

  /**
   * @notice Unlist an NFT that is currently for sale.
   *         This removes the salePrice and marks the NFT as not for sale.
   * @param itemId The ID of the NFT to unlist.
   */
  function unlistNFTItem(uint256 itemId) external {
    require(ownerOf(itemId) == msg.sender, "Caller not item owner");
    require(nftData[itemId].isOnSale, "Item is not listed for sale");

    nftData[itemId].isOnSale = false;
    nftData[itemId].salePrice = 0;

    emit NFTItemUnlisted(itemId);
  }

  /**
   * @notice Purchase an NFT that is currently on sale by sending Ether >= salePrice.
   * @param itemId The ID of the NFT item to buy.
   */
  function purchaseNFTItem(uint256 itemId) external payable {
    // Must be for sale
    require(nftData[itemId].isOnSale, "Item is not for sale");
    // Must send enough ETH
    require(msg.value >= nftData[itemId].salePrice, "Payment not sufficient");

    // The current owner who is selling
    address seller = ownerOf(itemId);

    // Remove XP from the seller for this item
    IUserExperiencePoints(experienceModule).modifyUserXP(seller, itemId, false);
    // Give XP to the buyer
    IUserExperiencePoints(experienceModule).modifyUserXP(msg.sender, itemId, true);

    // Transfer the token from seller to buyer
    _transfer(seller, msg.sender, itemId);

    // Calculate the platform fee
    uint256 feeAmount = (msg.value * FEE_PERCENT) / 100;
    uint256 sellerAmount = msg.value - feeAmount;

    // Send the fee to rewardPool
    (bool sentFee, ) = rewardPool.call{value: feeAmount}("");
    require(sentFee, "Fee transfer failed");

    // Send the remainder to the seller
    (bool sentSeller, ) = payable(seller).call{value: sellerAmount}("");
    require(sentSeller, "Seller payment failed");

    // Mark it no longer for sale
    nftData[itemId].isOnSale = false;
    nftData[itemId].salePrice = 0;

    emit NFTItemSold(itemId, seller, msg.sender, msg.value);
  }

  /**
   * @notice Register a new NFT-derived contract (like NFTCreatorCollection) with a numeric ID.
   * @param collectionAddr The address of the contract that can mint items with this new ID.
   * @return The numeric ID assigned to that contract.
   */
  function registerNFTDerivedContract(address collectionAddr) external returns (uint256) {
    itemCounter++;
    nftCollections[itemCounter] = collectionAddr;

    emit NFTContractRegistered(itemCounter, collectionAddr);
    return itemCounter;
  }

  /**
   * @notice Returns the largest itemId minted so far.
   */
  function getLatestItemId() external view returns (uint256) {
    return itemCounter;
  }

  /**
   * @notice As an admin (owner), link or update a known collection contract address for a given collection ID.
   */
  function setNFTCollection(uint256 collectionId, address collectionAddr) external onlyOwner {
    nftCollections[collectionId] = collectionAddr;
  }

  /**
   * @notice Returns the address of the reward pool in use.
   */
  function getRewardPool() external view returns (address) {
    return rewardPool;
  }

  /**
   * @dev Helper that increments itemCounter and returns a fresh itemId.
   */
  function _nextItemId() private returns (uint256) {
    itemCounter++;
    return itemCounter;
  }
}