/**
 * SPDX-License-Identifier: MIT
 *
 * @title NFTMarketplaceHub
 *
 * @notice
 *  The NFTMarketplaceHub contract handles listing and purchasing of NFTs that originate from
 *  the NFTMintingPlatform. It manages on-chain sale listings, enabling a straightforward method
 *  for NFT owners to list their items for a given price, as well as for buyers to purchase
 *  them with native currency.
 *
 *  Key points:
 *   - 10% platform fee goes to the reward pool upon each sale.
 *   - 90% goes to the seller.
 *   - XP ownership is automatically transferred from seller to buyer for that NFT.
 *
 * Non-technical summary:
 *  - "listNFTItem": The owner of the NFT sets a sale price.
 *  - "unlistNFTItem": The owner can remove it from sale.
 *  - "purchaseNFTItem": A buyer purchases it by paying the set price, with 10% going to the platform fee.
 *  - The actual transfer of XP is done by referencing the userExperiencePoints contract, ensuring
 *    that whoever owns the NFT also owns its XP.
 */

pragma solidity ^0.8.2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '../solidity/UserExperiencePoints.sol';

/**
 * @title NFTMarketplaceHub
 * @notice The core marketplace logic for listing and selling NFTs. This contract references:
 *         - A reward pool for the 10% fee.
 *         - The experience module to adjust XP ownership when NFT changes hands.
 *         - The NFTMintingPlatform contract to verify ownership (and transfer tokens).
 *
 * Usage scenario:
 *   - A user can list an NFT at a desired salePrice.
 *   - Another user can buy it by sending enough Ether. The contract automatically sends 10% to rewardPool,
 *     and the rest to the seller. It also updates XP so the buyer gains XP from that NFT.
 */
contract NFTMarketplaceHub is Ownable {
  /**
   * @dev The address of the platform's reward pool (where 10% of each sale is sent).
   */
  address public immutable rewardPool;

  /**
   * @dev The address of the user XP contract for adjusting XP when NFTs change ownership.
   */
  address public immutable experienceModule;

  /**
   * @dev The address of the NFTMintingPlatform, which is an ERC721 contract.
   *      We rely on it to check ownership, transfer tokens, etc.
   */
  address public immutable nftMintingPlatform;

  /**
   * @notice The percentage fee the platform takes from each sale. Here set to 10%.
   */
  uint256 public constant FEE_PERCENT = 10;

  /**
   * @notice Data structure to hold listing info:
   *         - isOnSale: true if it's currently for sale.
   *         - salePrice: the price in wei the seller wants.
   */
  struct MarketItem {
    bool isOnSale;
    uint256 salePrice;
  }

  /**
   * @notice A mapping from itemId => listing data. itemId is the NFT ID on the NFTMintingPlatform.
   */
  mapping(uint256 => MarketItem) public marketItems;

  /**
   * @notice Emitted when an NFT is listed for sale, indicating the new price.
   */
  event NFTItemListed(uint256 indexed itemId, uint256 price);

  /**
   * @notice Emitted when an NFT is unlisted (no longer for sale).
   */
  event NFTItemUnlisted(uint256 indexed itemId);

  /**
   * @notice Emitted when an NFT is purchased, capturing buyer, seller, and the sale amount.
   */
  event NFTItemSold(uint256 indexed itemId, address seller, address buyer, uint256 amount);

  /**
   * @notice Constructor to initialize the marketplace references: rewardPool, XP, and NFT contract addresses.
   *
   * @param _rewardPool The address where 10% sale fees will be sent.
   * @param _experienceModule The XP contract for transferring XP from seller to buyer.
   * @param _nftMintingPlatform The ERC721 NFT contract (the minted tokens come from there).
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
   * @notice List an NFT on the marketplace, specifying a sale price in wei.
   *
   * @dev Only the current owner can list an NFT. Price must be > 0.
   * @param itemId The tokenId of the NFT on the NFTMintingPlatform.
   * @param price The sale price in wei. Must be positive.
   */
  function listNFTItem(uint256 itemId, uint256 price) external {
    // Verify the caller owns the NFT
    require(IERC721(nftMintingPlatform).ownerOf(itemId) == msg.sender, 'Not item owner');
    require(price > 0, 'Price must be greater than zero');

    marketItems[itemId].isOnSale = true;
    marketItems[itemId].salePrice = price;

    emit NFTItemListed(itemId, price);
  }

  /**
   * @notice Unlist (remove from sale) an NFT that was previously listed. Only the owner can do this.
   *
   * @param itemId The tokenId of the NFT in the NFTMintingPlatform.
   */
  function unlistNFTItem(uint256 itemId) external {
    // Check ownership
    require(IERC721(nftMintingPlatform).ownerOf(itemId) == msg.sender, 'Not item owner');
    // Must currently be on sale
    require(marketItems[itemId].isOnSale, 'Item not listed');

    marketItems[itemId].isOnSale = false;
    marketItems[itemId].salePrice = 0;

    emit NFTItemUnlisted(itemId);
  }

  /**
   * @notice Purchase an NFT that is currently for sale. The buyer sends Ether >= salePrice.
   *
   * Steps:
   *   - The buyer pays. If msg.value < salePrice, it fails.
   *   - 10% is automatically taken as a platform fee, sent to `rewardPool`.
   *   - 90% is sent to the seller.
   *   - XP is transferred from seller to buyer for the NFT in question.
   *   - The NFT is transferred from seller to buyer.
   *
   * @param itemId The tokenId of the NFT to purchase.
   */
  function purchaseNFTItem(uint256 itemId) external payable {
    // Must be on sale
    require(marketItems[itemId].isOnSale, 'Item is not for sale');
    uint256 price = marketItems[itemId].salePrice;
    require(msg.value >= price, 'Payment not sufficient');

    address seller = IERC721(nftMintingPlatform).ownerOf(itemId);
    require(seller != msg.sender, 'Buyer cannot be the seller');

    // Remove XP from the seller for this item, then add it to the buyer.
    IUserExperiencePoints(experienceModule).modifyUserXP(seller, itemId, false);
    IUserExperiencePoints(experienceModule).modifyUserXP(msg.sender, itemId, true);

    // Transfer the NFT from seller to buyer
    IERC721(nftMintingPlatform).transferFrom(seller, msg.sender, itemId);

    // Calculate 10% fee
    uint256 feeAmount = (msg.value * FEE_PERCENT) / 100;
    uint256 sellerAmount = msg.value - feeAmount;

    // Send fee to the reward pool
    (bool sentFee, ) = rewardPool.call{ value: feeAmount }('');
    require(sentFee, 'Fee transfer failed');

    // Send remainder to the seller
    (bool sentSeller, ) = payable(seller).call{ value: sellerAmount }('');
    require(sentSeller, 'Seller payment failed');

    // Unlist the item
    marketItems[itemId].isOnSale = false;
    marketItems[itemId].salePrice = 0;

    emit NFTItemSold(itemId, seller, msg.sender, msg.value);
  }

  /**
   * @notice A helper read function to get the sale status and price of an NFT.
   * @param itemId The token ID in the NFTMintingPlatform.
   * @return isOnSale Boolean indicating if it's on sale.
   * @return salePrice The price (in wei) if on sale.
   */
  function getMarketItem(uint256 itemId) external view returns (bool, uint256) {
    MarketItem memory item = marketItems[itemId];
    return (item.isOnSale, item.salePrice);
  }
}
