/**
 * SPDX-License-Identifier: MIT
 *
 * NFTMarketplaceHub.sol
 *
 * This smart contract serves as a marketplace hub for NFTs (Non-Fungible Tokens).
 * It manages the creation, listing, sale, and transfer of NFTs.
 *
 * Non-technical Explanation:
 * --------------------------
 * Think of this contract like a digital marketplace where different NFT collections can
 * be registered. Each item in the marketplace is a unique token with a specific "itemId."
 * You can list your items for sale, unlist them, and buy them. A fee is collected whenever
 * an item is sold, and that fee goes to a "PlatformRewardPool" (another contract).
 * The contract also integrates with an "experience module" to track the XP (experience points)
 * of users owning NFTs.
 */

pragma solidity ^0.8.2;

// Importing OpenZeppelin ERC721 token contract extension (ERC721URIStorage) and Ownable for ownership checks.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Interface for the user experience points (XP) contract. This contract helps assign and modify XP.
 */
interface IUserExperiencePoints {
    /**
     * @dev Assigns random XP to an item (NFT). Returns the newly assigned XP.
     */
    function assignRandomXP(uint256 itemId) external returns (uint256);

    /**
     * @dev Modifies a user's XP.
     * If "add" is true, the XP is credited, otherwise it is removed.
     */
    function modifyUserXP(address user, uint256 itemId, bool add) external;
}

/**
 * @dev Interface for the NFTCreatorCollection. This interface is used to get the owner of a particular collection.
 */
interface INFTCreatorCollection {
    /**
     * @dev Returns the address of the owner of this collection.
     */
    function owner() external view returns (address);
}

/**
 * @title NFTMarketplaceHub
 * @notice This contract acts as an NFT exchange platform, allowing for minting, listing, unlisting, and purchasing of NFT items.
 * @dev Inherits ERC721URIStorage for storing token URI data and Ownable for controlling certain restricted functions.
 */
contract NFTMarketplaceHub is ERC721URIStorage, Ownable {
    // A simple counter used to increment the unique ID for each new NFT item.
    uint256 private itemCounter;

    // The address of the reward pool contract where fees are sent when an item is sold.
    address public immutable rewardPool;

    // The address of the experience module contract that tracks user XP.
    address public immutable experienceModule;

    // A constant that represents the marketplace fee, expressed as a percentage (10%).
    uint256 public constant FEE_PERCENT = 10;

    /**
     * @dev Struct representing each NFT item.
     * itemId    : the ID for this item (unique for each NFT).
     * creator   : the address that created this NFT (collection owner).
     * xpValue   : the XP (experience points) assigned to this NFT item.
     * isOnSale  : indicates if the item is currently on sale.
     * salePrice : the price at which the item is listed for sale.
     * resourceUrl : a link or reference to the NFT media (e.g. an image or resource).
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
     * @dev A mapping from an NFT item ID to its corresponding NFT data (NFTItem struct).
     */
    mapping(uint256 => NFTItem) public nftData;

    /**
     * @dev A mapping that associates a collectionId (just a number) with the address of its collection contract.
     * Example: 0 -> address of the primary collection.
     */
    mapping(uint256 => address) public nftCollections;

    /**
     * @dev Emitted when a new NFT item is generated.
     * @param itemId The ID of the newly created item.
     * @param collectionContract The address of the collection contract this item belongs to.
     * @param xpGained The XP assigned to this item.
     * @param imageURL The URL/resource used for the NFT.
     */
    event NFTItemGenerated(uint256 indexed itemId, address indexed collectionContract, uint256 xpGained, string imageURL);

    /**
     * @dev Emitted when an NFT item is listed for sale.
     * @param itemId The ID of the NFT item.
     * @param price The price at which the NFT is listed.
     */
    event NFTItemListed(uint256 indexed itemId, uint256 price);

    /**
     * @dev Emitted when an NFT item is unlisted from sale.
     * @param itemId The ID of the NFT item.
     */
    event NFTItemUnlisted(uint256 indexed itemId);

    /**
     * @dev Emitted when an NFT item is sold.
     * @param itemId The ID of the NFT item.
     * @param seller The address that previously owned the NFT.
     * @param buyer The address that purchased the NFT.
     * @param amount The amount of Ether paid for the NFT.
     */
    event NFTItemSold(uint256 indexed itemId, address seller, address buyer, uint256 amount);

    /**
     * @dev Emitted when a new NFT-derived contract (a new collection) is registered.
     * @param collectionId The ID (just a number) under which this collection was registered.
     * @param collectionContract The address of the NFT collection contract.
     */
    event NFTContractRegistered(uint256 indexed collectionId, address collectionContract);

    /**
     * @dev Constructor: Sets up the marketplace with references to the reward pool and experience module.
     * @param poolAddr The address of the reward pool contract.
     * @param xpAddr The address of the experience points contract.
     * @param _name The name for the NFT token standard (ERC721).
     * @param _symbol The symbol for the NFT token standard (ERC721).
     */
    constructor(
        address poolAddr,
        address xpAddr,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        rewardPool = poolAddr;
        experienceModule = xpAddr;
    }

    /**
     * @notice Generates a new NFT item for a particular collection. Only the collection contract can call this.
     * @dev The function mints an NFT with a unique itemId, assigns XP to it, and updates relevant data structures.
     * @param recipient The address that will receive the newly minted NFT.
     * @param collectionId The ID that links to the collection contract in the marketplace.
     * @param imageUrl A string that points to or describes the NFT's resource (e.g., an image URL).
     */
    function generateNFTItem(address recipient, uint256 collectionId, string memory imageUrl) external payable {
        // Ensure the caller is the registered collection contract for this collectionId.
        require(nftCollections[collectionId] == msg.sender, "Not authorized collection");

        // Get the next available item ID by incrementing our itemCounter.
        uint256 newId = _nextItemId();

        // Mint the NFT to the recipient. This calls the inherited ERC721 _safeMint function.
        _safeMint(recipient, newId);

        // Assign random XP to this new item using the experience module.
        uint256 xpAssigned = IUserExperiencePoints(experienceModule).assignRandomXP(newId);

        // Increase the recipient's total XP by adding the XP from this item.
        IUserExperiencePoints(experienceModule).modifyUserXP(recipient, newId, true);

        // Retrieve the collection's owner address from the collection contract.
        address colOwner = INFTCreatorCollection(nftCollections[collectionId]).owner();

        // Populate the NFTItem struct in our mapping.
        nftData[newId] = NFTItem({
            itemId: newId,
            creator: colOwner,
            xpValue: xpAssigned,
            isOnSale: false,
            salePrice: 0,
            resourceUrl: imageUrl
        });

        // Emit an event to show that this new NFT item has been generated.
        emit NFTItemGenerated(newId, nftCollections[collectionId], xpAssigned, imageUrl);
    }

    /**
     * @notice Lists an NFT item on the marketplace for a given price.
     * @dev The caller must be the owner of the NFT.
     * @param itemId The ID of the NFT item to list.
     * @param price The sale price for this NFT in wei (1 ETH = 10^18 wei).
     */
    function listNFTItem(uint256 itemId, uint256 price) external {
        // Only the current owner can list the NFT.
        require(ownerOf(itemId) == msg.sender, "Caller not item owner");
        require(price > 0, "Price must be greater than zero");

        // Mark the NFT as on sale and set the sale price.
        nftData[itemId].isOnSale = true;
        nftData[itemId].salePrice = price;

        // Emit an event that the item has been listed.
        emit NFTItemListed(itemId, price);
    }

    /**
     * @notice Unlists an NFT item from the marketplace (removes it from sale).
     * @dev The caller must be the current owner of the NFT.
     * @param itemId The ID of the NFT item to unlist.
     */
    function unlistNFTItem(uint256 itemId) external {
        // Only the owner can unlist the NFT.
        require(ownerOf(itemId) == msg.sender, "Caller not item owner");
        // The NFT should currently be on sale.
        require(nftData[itemId].isOnSale, "Item is not listed for sale");

        // Mark the NFT as not on sale.
        nftData[itemId].isOnSale = false;
        nftData[itemId].salePrice = 0;

        // Emit an event that the item has been unlisted.
        emit NFTItemUnlisted(itemId);
    }

    /**
     * @notice Purchases an NFT item if it is currently listed for sale.
     * @dev The buyer sends Ether to the contract. A portion goes to the reward pool (fee),
     *      and the remainder goes to the seller.
     * @param itemId The ID of the NFT item to purchase.
     */
    function purchaseNFTItem(uint256 itemId) external payable {
        // Ensure the item is on sale.
        require(nftData[itemId].isOnSale, "Item is not for sale");
        // The buyer must send enough ETH to cover the item's sale price.
        require(msg.value >= nftData[itemId].salePrice, "Payment not sufficient");

        // Identify the current seller (the owner of the NFT).
        address seller = ownerOf(itemId);

        // Remove XP from the seller for this item, and add XP for the buyer.
        IUserExperiencePoints(experienceModule).modifyUserXP(seller, itemId, false);
        IUserExperiencePoints(experienceModule).modifyUserXP(msg.sender, itemId, true);

        // Transfer the NFT from the seller to the buyer.
        _transfer(seller, msg.sender, itemId);

        // Calculate the fee to take from the sale (FEE_PERCENT%).
        uint256 feeAmount = (msg.value * FEE_PERCENT) / 100;
        // The rest (seller's amount) is what's left after the fee.
        uint256 sellerAmount = msg.value - feeAmount;

        // Transfer the fee to the reward pool contract.
        (bool sentFee, ) = rewardPool.call{value: feeAmount}("");
        require(sentFee, "Fee transfer failed");

        // Transfer the remainder to the seller.
        (bool sentSeller, ) = payable(seller).call{value: sellerAmount}("");
        require(sentSeller, "Seller payment failed");

        // Mark the NFT as not for sale anymore.
        nftData[itemId].isOnSale = false;
        nftData[itemId].salePrice = 0;

        // Emit an event that the item has been sold.
        emit NFTItemSold(itemId, seller, msg.sender, msg.value);
    }

    /**
     * @notice Registers a new NFT-derived contract (like a new NFT collection).
     * @dev This returns a numeric ID for the collection.
     * @param collectionAddr The address of the new collection contract.
     * @return The collectionId that was just assigned to this new contract.
     */
    function registerNFTDerivedContract(address collectionAddr) external returns (uint256) {
        // Increments the counter, then sets the mapping for that collection ID to the contract's address.
        itemCounter++;
        nftCollections[itemCounter] = collectionAddr;

        // Emit an event showing that a new NFT contract is registered.
        emit NFTContractRegistered(itemCounter, collectionAddr);
        return itemCounter;
    }

    /**
     * @notice Returns the latest item ID that has been created in this marketplace.
     * @return The current value of the itemCounter.
     */
    function getLatestItemId() external view returns (uint256) {
        return itemCounter;
    }

    /**
     * @notice Allows the contract owner to set or update the address of a collection contract for a given collection ID.
     * @param collectionId The numeric ID used to identify the collection.
     * @param collectionAddr The address of the collection contract to associate with this ID.
     */
    function setNFTCollection(uint256 collectionId, address collectionAddr) external onlyOwner {
        nftCollections[collectionId] = collectionAddr;
    }

    /**
     * @notice Returns the address of the reward pool.
     * @return The stored rewardPool address.
     */
    function getRewardPool() external view returns (address) {
        return rewardPool;
    }

    /**
     * @dev Internal function to increment the item counter and return the new item ID.
     * @return The new item ID (as an incremented counter).
     */
    function _nextItemId() private returns (uint256) {
        itemCounter++;
        return itemCounter;
    }
}