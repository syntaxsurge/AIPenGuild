/**
 * SPDX-License-Identifier: MIT
 *
 * @title NFTCreatorCollection
 *
 * @notice
 *   The NFTCreatorCollection contract represents a group ("collection") of NFTs
 *   that a creator can sell. Each collection has:
 *     - A name and description.
 *     - A mint price per NFT.
 *     - A maximum supply (no more NFTs can be minted after reaching this limit).
 *     - An optional active/inactive status to pause or resume minting.
 *
 *   Whenever a new NFT is minted through this collection, 10% of the incoming Ether
 *   goes to the platform’s reward pool, and the remaining 90% goes to this contract's owner
 *   (the collection creator).
 *
 * Non-technical Explanation:
 * --------------------------
 *   - This contract is basically a "catalog" for a set of NFTs created by one person or team.
 *   - People can mint NFTs from this collection by paying the specified mint price.
 *   - Part of the sale goes to the platform for upkeep, and the rest to the collection’s owner.
 */

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Interface for the NFTMintingPlatform, which actually handles minting logic.
 */
interface INFTMintingPlatformForCollection {
    function getRewardPool() external view returns (address);
    function generateNFTItem(
        address recipient,
        uint256 collectionId,
        string memory imageUrl
    ) external payable;
}

contract NFTCreatorCollection is Ownable {
    /**
     * @notice Stores configuration about a single collection.
     *
     * @param name The name of the collection, e.g. "My Art Collection".
     * @param description A description or short text about the collection.
     * @param mintPrice The price in wei that users must pay to mint an NFT from this collection.
     * @param maxSupply The total maximum number of NFTs that can be minted from this collection.
     * @param currentSupply The number of NFTs already minted from this collection.
     * @param active Whether minting is currently enabled (true) or paused (false).
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
     * @notice The primary collection (ID=0), initially set in the constructor.
     */
    CollectionData public primaryCollection;

    /**
     * @notice Additional collections (ID=1,2,3...) can also be defined by the owner.
     */
    mapping(uint256 => CollectionData) public additionalCollections;

    /**
     * @notice An internal counter to keep track of how many collections (beyond the primary) exist.
     */
    uint256 private collectionIndex;

    /**
     * @dev The address of the NFTMintingPlatform used for actual NFT minting.
     *      This contract delegates the actual creation of NFT tokens to that platform.
     */
    address public immutable minterPlatform;

    /**
     * @notice Emitted when a new additional collection is defined by the owner.
     */
    event NewCollectionDefined(
        uint256 indexed collectionId,
        string name,
        string description,
        uint256 mintPrice,
        uint256 maxSupply
    );

    /**
     * @notice Constructor that sets up the primary collection and the address of the NFTMintingPlatform.
     *
     * @param initialName The name of the primary collection.
     * @param initialDescription A descriptive text for the primary collection.
     * @param initialMintPrice The initial mint price for the primary collection.
     * @param initialMaxSupply The maximum supply for the primary collection.
     * @param minterPlatformAddress The contract address of the NFTMintingPlatform.
     */
    constructor(
        string memory initialName,
        string memory initialDescription,
        uint256 initialMintPrice,
        uint256 initialMaxSupply,
        address minterPlatformAddress
    ) {
        primaryCollection = CollectionData({
            name: initialName,
            description: initialDescription,
            mintPrice: initialMintPrice,
            maxSupply: initialMaxSupply,
            currentSupply: 0,
            active: true
        });

        require(minterPlatformAddress != address(0), "Invalid minter platform");
        minterPlatform = minterPlatformAddress;
    }

    /**
     * @notice Allows the contract owner to update the mint price for the primary collection.
     *
     * @param newPrice The new price in wei.
     */
    function updateMintPrice(uint256 newPrice) external onlyOwner {
        primaryCollection.mintPrice = newPrice;
    }

    /**
     * @notice Toggles (switches) the active status of the primary collection between enabled and paused.
     */
    function toggleCollectionActivity() external onlyOwner {
        primaryCollection.active = !primaryCollection.active;
    }

    /**
     * @notice Define a new "additional" collection with unique parameters (price, supply limit, etc.).
     *
     * @param nameValue The name for the new collection.
     * @param descriptionValue A description for the new collection.
     * @param price The mint price in wei for the new collection.
     * @param supplyLimit The maximum supply of NFTs that can be minted from this new collection.
     */
    function defineNewCollection(
        string memory nameValue,
        string memory descriptionValue,
        uint256 price,
        uint256 supplyLimit
    ) external onlyOwner {
        require(price > 0, "Price must exceed zero");
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

        emit NewCollectionDefined(collectionIndex, nameValue, descriptionValue, price, supplyLimit);
    }

    /**
     * @notice Users call this function to buy (mint) a new NFT from a specific collection in this contract.
     *
     * @dev
     *  1) Checks if the collection has capacity and is still active.
     *  2) Takes a 10% platform fee and sends it to the platform's reward pool (found by calling getRewardPool()).
     *  3) Sends the remaining Ether to this contract's owner.
     *  4) Calls `generateNFTItem` on the NFTMintingPlatform to create the actual NFT.
     *
     * @param collectionId The ID of the collection to mint from (0 for primary, or an additional).
     * @param imageUrl The URL or IPFS link for the NFT’s artwork.
     */
    function mintFromCollection(uint256 collectionId, string memory imageUrl) external payable {
        CollectionData storage info;

        if (collectionId == 0) {
            require(primaryCollection.active, "Primary collection not active");
            require(primaryCollection.currentSupply < primaryCollection.maxSupply, "Sold out");
            require(msg.value >= primaryCollection.mintPrice, "Insufficient funds");
            info = primaryCollection;
        } else {
            info = additionalCollections[collectionId];
            require(info.active, "Collection not active");
            require(info.currentSupply < info.maxSupply, "Sold out");
            require(msg.value >= info.mintPrice, "Insufficient funds");
        }

        // Calculate the 10% platform fee
        uint256 platformFee = (msg.value * 10) / 100;

        // Find out where to send the platform fee by asking the NFTMintingPlatform
        address rewardPool = INFTMintingPlatformForCollection(minterPlatform).getRewardPool();

        // Transfer the platform fee to that reward pool
        (bool feeSuccess, ) = rewardPool.call{value: platformFee}("");
        require(feeSuccess, "Fee payment failed");

        // The remainder goes to the contract's owner
        (bool creatorPaid, ) = payable(owner()).call{value: msg.value - platformFee}("");
        require(creatorPaid, "Creator payment failed");

        // Actually mint the NFT by calling the NFTMintingPlatform
        INFTMintingPlatformForCollection(minterPlatform).generateNFTItem(
            msg.sender,
            collectionId,
            imageUrl
        );

        // Bump the supply count
        info.currentSupply++;
    }
}