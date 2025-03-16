/**
 * SPDX-License-Identifier: MIT
 *
 * NFTCreatorCollection.sol
 *
 * This contract represents an NFT collection that a creator (owner) can manage.
 * Each collection can have multiple items, and the items are minted through the
 * "NFTMarketplaceHub" contract. The collection defines a "mintPrice" (the cost
 * to create an NFT) and a maximum number of NFTs that can be minted in that collection.
 *
 * Non-technical Explanation:
 * --------------------------
 * Imagine this contract like a "artist's collection" of NFTs. The artist decides
 * how many items can be minted, and how much it costs to mint an item. When someone
 * wants to mint a new NFT from this collection, they pay the required amount; part of
 * that payment goes to a "reward pool" for the platform, and the rest goes to the
 * artist (the contract owner).
 */

pragma solidity ^0.8.2;

// Importing OpenZeppelin's Ownable contract for ownership checks.
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Interface for the NFTMarketplaceHub. We use this interface to call functions in the hub,
 * such as "generateNFTItem" and "getRewardPool".
 */
interface INFTMarketplaceHub {
    /**
     * @dev Generates a new NFT item in the marketplace. This is the function that actually mints
     *      the NFT in the marketplace contract.
     */
    function generateNFTItem(address recipient, uint256 collectionId, string memory imageUrl) external payable;

    /**
     * @dev Returns the address of the reward pool contract.
     */
    function getRewardPool() external view returns (address);

    /**
     * @dev Links a collection ID to this collection contract.
     */
    function setNFTCollection(uint256 collectionId, address collectionAddr) external;
}

/**
 * @title NFTCreatorCollection
 * @notice Represents a creator's NFT collection, allowing minting of new NFTs via a marketplace hub.
 * @dev Inherits Ownable to give the collection's owner certain rights (changing prices, toggling sales, etc.).
 */
contract NFTCreatorCollection is Ownable {
    /**
     * @dev A struct holding essential data for a collection.
     * name         : The name/title of this collection.
     * description  : A descriptive text about the collection.
     * mintPrice    : The price to pay to mint a new NFT from this collection.
     * maxSupply    : The maximum number of NFTs that can be minted.
     * currentSupply: How many NFTs have been minted so far.
     * active       : Indicates if minting from this collection is currently allowed.
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
     * @dev The primary (default) collection data stored in this contract.
     * This is typically collection ID 0 in the marketplace.
     */
    CollectionData public primaryCollection;

    /**
     * @dev A mapping of additional collections, identified by an incremental collectionId
     * (starting from 1 for the first additional collection).
     */
    mapping(uint256 => CollectionData) public additionalCollections;

    /**
     * @dev A numeric index that increments each time a new additional collection is defined.
     */
    uint256 private collectionIndex;

    /**
     * @dev The address of the marketplace hub that this collection interacts with.
     */
    address public immutable marketplace;

    /**
     * @dev The constructor that initializes the contract with default values for the primary collection
     * and stores the marketplace address.
     * @param initialName The name/title of the primary collection.
     * @param initialDescription A descriptive text for the primary collection.
     * @param initialMintPrice The cost to mint an NFT from this primary collection.
     * @param initialMaxSupply The maximum number of NFTs the primary collection can have.
     * @param marketplaceAddress The address of the marketplace hub contract.
     */
    constructor(
        string memory initialName,
        string memory initialDescription,
        uint256 initialMintPrice,
        uint256 initialMaxSupply,
        address marketplaceAddress
    ) Ownable(msg.sender) {
        primaryCollection = CollectionData({
            name: initialName,
            description: initialDescription,
            mintPrice: initialMintPrice,
            maxSupply: initialMaxSupply,
            currentSupply: 0,
            active: true
        });
        marketplace = marketplaceAddress;
    }

    /**
     * @notice Allows the owner to update the mint price for the primary collection.
     * @param newPrice The new price to set (in wei).
     */
    function updateMintPrice(uint256 newPrice) external onlyOwner {
        primaryCollection.mintPrice = newPrice;
    }

    /**
     * @notice Allows the owner to toggle whether the primary collection is active or not.
     * If inactive, minting from the primary collection is not allowed.
     */
    function toggleCollectionActivity() external onlyOwner {
        primaryCollection.active = !primaryCollection.active;
    }

    /**
     * @notice Defines a new "additional" collection with its own name, description, price, and supply limit.
     * @dev This increments the collectionIndex to keep track of newly added collections.
     * @param nameValue The name/title of the new collection.
     * @param descriptionValue A descriptive text for the new collection.
     * @param price The mint price for the new collection (in wei).
     * @param supplyLimit The maximum NFTs allowed in this new collection.
     */
    function defineNewCollection(
        string memory nameValue,
        string memory descriptionValue,
        uint256 price,
        uint256 supplyLimit
    ) external {
        require(price > 0, "Mint price must exceed zero");
        require(supplyLimit > 0, "Max supply must exceed zero");

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

    /**
     * @notice Allows users to mint an NFT from a specific collection (primary or additional).
     * @dev A portion of the mint fee (10%) goes to the platform's reward pool; the remainder is sent to the collection owner.
     * @param collectionId The ID of the collection from which to mint (0 for primary collection).
     * @param imageUrl A string that points to or describes the resource (e.g., an image) for the minted NFT.
     */
    function mintFromCollection(uint256 collectionId, string memory imageUrl) external payable {
        // Create a reference that will point to either the primary or an additional collection.
        CollectionData storage info;

        if (collectionId == 0) {
            // We are minting from the primary collection.
            require(primaryCollection.active, "Primary collection not active");
            require(primaryCollection.currentSupply < primaryCollection.maxSupply, "Sold out");
            require(msg.value >= primaryCollection.mintPrice, "Insufficient funds");
            info = primaryCollection;
        } else {
            // We are minting from one of the additional collections.
            info = additionalCollections[collectionId];
            require(info.active, "Collection not active");
            require(info.currentSupply < info.maxSupply, "Sold out");
            require(msg.value >= info.mintPrice, "Insufficient funds");
        }

        // Calculate the platform fee (10% of the total amount sent).
        uint256 platformFee = (msg.value * 10) / 100;

        // Get the address of the reward pool from the marketplace.
        address rewardPool = INFTMarketplaceHub(marketplace).getRewardPool();

        // Transfer the platform fee to the reward pool.
        (bool feeSuccess, ) = rewardPool.call{value: platformFee}("");
        require(feeSuccess, "Fee payment failed");

        // Transfer the remaining amount to the creator (the owner of this collection).
        (bool creatorPaid, ) = payable(owner()).call{value: msg.value - platformFee}("");
        require(creatorPaid, "Creator payment failed");

        // Finally, call the marketplace function to generate the new NFT item for the minter.
        INFTMarketplaceHub(marketplace).generateNFTItem(msg.sender, collectionId, imageUrl);

        // Increment the supply count to keep track of how many have been minted.
        info.currentSupply++;
    }
}