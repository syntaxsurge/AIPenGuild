/**
 * SPDX-License-Identifier: MIT
 */

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IUserExperiencePoints {
    function assignRandomXP(uint256 itemId) external returns (uint256);
    function modifyUserXP(address user, uint256 itemId, bool add) external;
}

interface INFTCreatorCollection {
    function owner() external view returns (address);
}

contract NFTMarketplaceHub is ERC721URIStorage, Ownable {
    uint256 private itemCounter;
    address public immutable rewardPool;
    address public immutable experienceModule;
    uint256 public constant FEE_PERCENT = 10;

    struct NFTItem {
        uint256 itemId;
        address creator;
        uint256 xpValue;
        bool isOnSale;
        uint256 salePrice;
        string resourceUrl;
    }

    mapping(uint256 => NFTItem) public nftData;
    mapping(uint256 => address) public nftCollections;

    event NFTItemGenerated(uint256 indexed itemId, address indexed collectionContract, uint256 xpGained, string imageURL);
    event NFTItemListed(uint256 indexed itemId, uint256 price);
    event NFTItemUnlisted(uint256 indexed itemId);
    event NFTItemSold(uint256 indexed itemId, address seller, address buyer, uint256 amount);
    event NFTContractRegistered(uint256 indexed collectionId, address collectionContract);

    constructor(
        address poolAddr,
        address xpAddr,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        rewardPool = poolAddr;
        experienceModule = xpAddr;
    }

    function generateNFTItem(address recipient, uint256 collectionId, string memory imageUrl) external payable {
        require(nftCollections[collectionId] == msg.sender, "Not authorized collection");
        uint256 newId = _nextItemId();
        _safeMint(recipient, newId);

        uint256 xpAssigned = IUserExperiencePoints(experienceModule).assignRandomXP(newId);
        IUserExperiencePoints(experienceModule).modifyUserXP(recipient, newId, true);

        address colOwner = INFTCreatorCollection(nftCollections[collectionId]).owner();

        nftData[newId] = NFTItem({
            itemId: newId,
            creator: colOwner,
            xpValue: xpAssigned,
            isOnSale: false,
            salePrice: 0,
            resourceUrl: imageUrl
        });

        emit NFTItemGenerated(newId, nftCollections[collectionId], xpAssigned, imageUrl);
    }

    function listNFTItem(uint256 itemId, uint256 price) external {
        require(ownerOf(itemId) == msg.sender, "Caller not item owner");
        require(price > 0, "Price must be greater than zero");

        nftData[itemId].isOnSale = true;
        nftData[itemId].salePrice = price;
        emit NFTItemListed(itemId, price);
    }

    function unlistNFTItem(uint256 itemId) external {
        require(ownerOf(itemId) == msg.sender, "Caller not item owner");
        require(nftData[itemId].isOnSale, "Item is not listed for sale");

        nftData[itemId].isOnSale = false;
        nftData[itemId].salePrice = 0;
        emit NFTItemUnlisted(itemId);
    }

    function purchaseNFTItem(uint256 itemId) external payable {
        require(nftData[itemId].isOnSale, "Item is not for sale");
        require(msg.value >= nftData[itemId].salePrice, "Payment not sufficient");

        address seller = ownerOf(itemId);
        IUserExperiencePoints(experienceModule).modifyUserXP(seller, itemId, false);
        IUserExperiencePoints(experienceModule).modifyUserXP(msg.sender, itemId, true);

        _transfer(seller, msg.sender, itemId);

        uint256 feeAmount = (msg.value * FEE_PERCENT) / 100;
        uint256 sellerAmount = msg.value - feeAmount;

        (bool sentFee, ) = rewardPool.call{value: feeAmount}("");
        require(sentFee, "Fee transfer failed");

        (bool sentSeller, ) = payable(seller).call{value: sellerAmount}("");
        require(sentSeller, "Seller payment failed");

        nftData[itemId].isOnSale = false;
        nftData[itemId].salePrice = 0;

        emit NFTItemSold(itemId, seller, msg.sender, msg.value);
    }

    function registerNFTDerivedContract(address collectionAddr) external returns (uint256) {
        itemCounter++;
        nftCollections[itemCounter] = collectionAddr;
        emit NFTContractRegistered(itemCounter, collectionAddr);
        return itemCounter;
    }

    function getLatestItemId() external view returns (uint256) {
        return itemCounter;
    }

    function setNFTCollection(uint256 collectionId, address collectionAddr) external onlyOwner {
        nftCollections[collectionId] = collectionAddr;
    }

    function getRewardPool() external view returns (address) {
        return rewardPool;
    }

    function _nextItemId() private returns (uint256) {
        itemCounter++;
        return itemCounter;
    }
}