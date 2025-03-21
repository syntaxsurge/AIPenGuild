/**
 * SPDX-License-Identifier: MIT
 *
 * @title NFTMarketplaceHub
 *
 * @notice
 *   The NFTMarketplaceHub is the main contract that facilitates listing and purchasing of NFTs.
 *   It works together with the NFTMintingPlatform but does not mint NFTs itself. Instead, it
 *   allows the owner of an NFT to offer it for sale at a specific price. Buyers can then purchase
 *   the NFT by sending sufficient Ether. A 10% fee goes to the reward pool, and the rest goes
 *   to the seller.
 *
 * Non-technical Explanation:
 * --------------------------
 *   - Think of it as a marketplace bulletin board where NFT owners can put up their tokens for sale,
 *     and buyers can see these listings and purchase them.
 *   - When a sale happens:
 *     1) The buyer pays Ether.
 *     2) The seller receives 90% of that Ether.
 *     3) The platform takes 10% as a fee.
 *     4) Ownership of the NFT is transferred to the buyer.
 *
 * Technical Summary:
 *  - We store whether an NFT is "isOnSale" and at what price in `marketItems`.
 *  - The marketplace references the NFTMintingPlatform for NFT ownership checks
 *    and calls the XP system to remove XP from the seller and add XP to the buyer.
 */

pragma solidity ^0.8.2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '../solidity/UserExperiencePoints.sol';

contract NFTMarketplaceHub is Ownable {
  /**
   * @dev The address of the reward pool (where 10% of the sale price is sent on each purchase).
   */
  address public immutable rewardPool;

  /**
   * @dev The address of the UserExperiencePoints (XP) contract, used to update XP when an NFT changes hands.
   */
  address public immutable experienceModule;

  /**
   * @dev The address of the NFTMintingPlatform (the ERC721 contract) that this marketplace deals with.
   */
  address public immutable nftMintingPlatform;

  /**
   * @notice The marketplace fee taken from each sale (10%).
   */
  uint256 public constant FEE_PERCENT = 10;

  /**
   * @notice Each NFT's listing data: whether it's on sale and the current asking price.
   *
   * @param isOnSale True if the NFT is currently listed on the marketplace.
   * @param salePrice The current listing price (in wei).
   */
  struct MarketItem {
    bool isOnSale;
    uint256 salePrice;
  }

  /**
   * @notice A mapping from itemId (NFT ID) to MarketItem struct.
   */
  mapping(uint256 => MarketItem) public marketItems;

  /**
   * @notice Emitted when an NFT is listed for sale by its owner.
   *
   * @param itemId The ID of the NFT that got listed.
   * @param price The sale price set by the owner.
   */
  event NFTItemListed(uint256 indexed itemId, uint256 price);

  /**
   * @notice Emitted when an NFT listing is removed (no longer for sale).
   *
   * @param itemId The ID of the NFT that got unlisted.
   */
  event NFTItemUnlisted(uint256 indexed itemId);

  /**
   * @notice Emitted when an NFT is sold to a buyer.
   *
   * @param itemId The NFT item ID that was sold.
   * @param seller The address of the seller who owned the NFT before the sale.
   * @param buyer The address of the buyer who purchased the NFT.
   * @param amount The amount of Ether (in wei) paid by the buyer.
   */
  event NFTItemSold(uint256 indexed itemId, address seller, address buyer, uint256 amount);

  /**
   * @notice Constructor sets up references for rewardPool, XP contract, and NFT contract.
   *
   * @param _rewardPool The address of the platform's reward pool.
   * @param _experienceModule The address of the contract that manages XP.
   * @param _nftMintingPlatform The address of the NFTMintingPlatform (the ERC721 contract).
   */
  constructor(address _rewardPool, address _experienceModule, address _nftMintingPlatform) {
    require(_rewardPool != address(0), 'Invalid rewardPool');
    require(_experienceModule != address(0), 'Invalid experienceModule');
    require(_nftMintingPlatform != address(0), 'Invalid NFT contract');

    rewardPool = _rewardPool;
    experienceModule = _experienceModule;
    nftMintingPlatform = _nftMintingPlatform;
  }

  /**
   * @notice List an NFT on the marketplace, setting a sale price.
   *
   * @dev Only the owner of the NFT can do this.
   *
   * @param itemId The ID of the NFT in the NFTMintingPlatform.
   * @param price The price (in wei) at which the NFT is listed.
   */
  function listNFTItem(uint256 itemId, uint256 price) external {
    require(IERC721(nftMintingPlatform).ownerOf(itemId) == msg.sender, 'Not item owner');
    require(price > 0, 'Price must be greater than zero');

    marketItems[itemId].isOnSale = true;
    marketItems[itemId].salePrice = price;

    emit NFTItemListed(itemId, price);
  }

  /**
   * @notice Unlist an NFT that is currently on sale.
   *
   * @dev Only the owner can unlist. If the NFT has never been listed or is already unlisted,
   *      this will simply fail or revert if `isOnSale` is false.
   *
   * @param itemId The ID of the NFT.
   */
  function unlistNFTItem(uint256 itemId) external {
    require(IERC721(nftMintingPlatform).ownerOf(itemId) == msg.sender, 'Not item owner');
    require(marketItems[itemId].isOnSale, 'Item not listed');

    marketItems[itemId].isOnSale = false;
    marketItems[itemId].salePrice = 0;

    emit NFTItemUnlisted(itemId);
  }

  /**
   * @notice Purchase an NFT that is currently for sale, by sending enough Ether to meet the asking price.
   *
   * @dev
   *   - The buyer must pay at least `salePrice`.
   *   - A 10% fee is automatically sent to `rewardPool`.
   *   - The remainder is sent to the seller.
   *   - XP is transferred from the seller to the buyer for this NFT item.
   *   - The NFT is transferred from seller to buyer.
   *
   * @param itemId The ID of the NFT item (tokenId) to purchase.
   */
  function purchaseNFTItem(uint256 itemId) external payable {
    require(marketItems[itemId].isOnSale, 'Item is not for sale');
    uint256 price = marketItems[itemId].salePrice;
    require(msg.value >= price, 'Payment not sufficient');

    // Identify the seller
    address seller = IERC721(nftMintingPlatform).ownerOf(itemId);
    require(seller != msg.sender, 'Buyer cannot be the seller');

    // Remove XP from the seller for this item
    IUserExperiencePoints(experienceModule).modifyUserXP(seller, itemId, false);
    // Give XP to the buyer
    IUserExperiencePoints(experienceModule).modifyUserXP(msg.sender, itemId, true);

    // Transfer the NFT from seller to buyer
    IERC721(nftMintingPlatform).transferFrom(seller, msg.sender, itemId);

    // Calculate the platform fee
    uint256 feeAmount = (msg.value * FEE_PERCENT) / 100;
    uint256 sellerAmount = msg.value - feeAmount;

    // Send the fee to the reward pool
    (bool sentFee, ) = rewardPool.call{value: feeAmount}('');
    require(sentFee, 'Fee transfer failed');

    // Send the remainder to the seller
    (bool sentSeller, ) = payable(seller).call{value: sellerAmount}('');
    require(sentSeller, 'Seller payment failed');

    // Mark item as no longer on sale
    marketItems[itemId].isOnSale = false;
    marketItems[itemId].salePrice = 0;

    emit NFTItemSold(itemId, seller, msg.sender, msg.value);
  }

  /**
   * @notice A helper function that returns whether an item is on sale and its price.
   *
   * @param itemId The ID of the NFT.
   * @return isOnSale Whether the NFT is currently listed for sale.
   * @return salePrice The price (in wei) if it is on sale.
   */
  function getMarketItem(uint256 itemId) external view returns (bool, uint256) {
    MarketItem memory item = marketItems[itemId];
    return (item.isOnSale, item.salePrice);
  }
}
