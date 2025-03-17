/**
 * SPDX-License-Identifier: MIT
 *
 * NFTCreatorCollection.sol
 *
 * This contract represents an NFT collection that a creator (owner) can manage.
 *
 * Each collection can have multiple items, minted through the "NFTMarketplaceHub" contract.
 * The collection defines:
 *   - A mintPrice for each NFT minted,
 *   - A maximum supply,
 *   - A toggled 'active' status (whether minting is open or not).
 *
 * When a user mints from this collection, they pay a fee. Part of that fee goes to
 * the platform's reward pool, and part goes to the creator (this contract's owner).
 *
 * Non-technical Explanation:
 * --------------------------
 * Imagine a digital artist launching a collection of art pieces. This contract sets
 * the price and total number of items allowed in that collection. Anyone can pay
 * the required amount to create one piece of that collection (an NFT). A fraction
 * of that payment is shared with the platform as a fee, while the rest goes to the
 * artist who owns this contract.
 */

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Interface for the NFTMarketplaceHub. We use this interface to call functions in the hub,
 * such as "generateNFTItem" (which mints the NFT) and "getRewardPool" (to find where fees go).
 */
interface INFTMarketplaceHub {
    function generateNFTItem(address recipient, uint256 collectionId, string memory imageUrl) external payable;
    function getRewardPool() external view returns (address);
    function setNFTCollection(uint256 collectionId, address collectionAddr) external;
}

/**
 * @title NFTCreatorCollection
 * @notice Represents a creator's NFT collection, allowing minting of new NFTs via the marketplace hub.
 * @dev Inherits Ownable to give the contract deployer certain rights: e.g. toggling or updating prices.
 */
contract NFTCreatorCollection is Ownable {
    /**
     * @dev A struct holding essential data for each collection (including the primary collection).
     *
     * name:        A title or label for this collection.
     * description: A short text describing the theme or style of this collection.
     * mintPrice:   The cost (in wei) for minting each NFT.
     * maxSupply:   The maximum number of NFTs that can be minted in this collection.
     * currentSupply: The number of NFTs already minted.
     * active:      Whether minting is currently enabled.
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
     * @dev Stores a "primary" collection with ID = 0. This might be the main or default collection.
     */
    CollectionData public primaryCollection;

    /**
     * @dev Maps an additional collection ID (1,2,3,...) to its CollectionData.
     * This allows the contract owner to define multiple collections inside one contract.
     */
    mapping(uint256 => CollectionData) public additionalCollections;

    /**
     * @dev A simple counter for additional collections. Increments each time defineNewCollection(...) is used.
     */
    uint256 private collectionIndex;

    /**
     * @dev The address of the marketplace hub that can mint items from this collection.
     * This is set once in the constructor and is immutable.
     */
    address public immutable marketplace;

    /**
     * @dev Constructor sets up the primary collection's data and the marketplace address,
     * and uses Ownable's default constructor for ownership.
     */
    constructor(
        string memory initialName,
        string memory initialDescription,
        uint256 initialMintPrice,
        uint256 initialMaxSupply,
        address marketplaceAddress
    ) {
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
     * @notice Allows the contract owner to update the mint price for the primary (ID=0) collection.
     * @param newPrice The new price in wei for minting from that primary collection.
     */
    function updateMintPrice(uint256 newPrice) external onlyOwner {
        primaryCollection.mintPrice = newPrice;
    }

    /**
     * @notice Toggle whether the primary (ID=0) collection can be minted.
     * If inactive, no new NFTs can be minted from that collection.
     */
    function toggleCollectionActivity() external onlyOwner {
        primaryCollection.active = !primaryCollection.active;
    }

    /**
     * @notice Define a new "additional" collection with its own parameters.
     * This increments `collectionIndex` to generate a unique ID for that collection.
     * @param nameValue A short name/title for the new collection.
     * @param descriptionValue A descriptive text explaining the collection's theme.
     * @param price The mintPrice for this new collection (in wei).
     * @param supplyLimit The maximum number of NFTs that can be minted from this collection.
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
     * @notice Mint an NFT from one of this contract's collections (either ID=0 or an additional collection).
     * @dev
     *  1) Checks if the chosen collection has capacity and is active.
     *  2) Applies a 10% platform fee that is sent to the platform's reward pool.
     *  3) Sends the remainder to the contract's owner (the creator).
     *  4) Calls `generateNFTItem` in the marketplace to actually mint the NFT.
     * @param collectionId The ID of the collection from which to mint (0 for primary).
     * @param imageUrl The resource pointer (image link, IPFS link, etc.) for the minted NFT.
     */
    function mintFromCollection(uint256 collectionId, string memory imageUrl) external payable {
        CollectionData storage info;

        if (collectionId == 0) {
            // Using the primary collection
            require(primaryCollection.active, "Primary collection not active");
            require(primaryCollection.currentSupply < primaryCollection.maxSupply, "Sold out");
            require(msg.value >= primaryCollection.mintPrice, "Insufficient funds");
            info = primaryCollection;
        } else {
            // One of the additional collections
            info = additionalCollections[collectionId];
            require(info.active, "Collection not active");
            require(info.currentSupply < info.maxSupply, "Sold out");
            require(msg.value >= info.mintPrice, "Insufficient funds");
        }

        // Platform fee is 10% of total minted cost
        uint256 platformFee = (msg.value * 10) / 100;

        // Ask the marketplace which pool to send fees to
        address rewardPool = INFTMarketplaceHub(marketplace).getRewardPool();

        // Transfer the platform fee to that reward pool
        (bool feeSuccess, ) = rewardPool.call{value: platformFee}("");
        require(feeSuccess, "Fee payment failed");

        // The remainder goes to the contract's owner (the creator)
        (bool creatorPaid, ) = payable(owner()).call{value: msg.value - platformFee}("");
        require(creatorPaid, "Creator payment failed");

        // Now let the marketplace handle actual NFT minting
        INFTMarketplaceHub(marketplace).generateNFTItem(msg.sender, collectionId, imageUrl);

        // Increment the supply count to track minted NFTs
        info.currentSupply++;
    }
}