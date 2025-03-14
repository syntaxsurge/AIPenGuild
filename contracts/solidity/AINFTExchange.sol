/**
 * SPDX-License-Identifier: MIT
 */

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IAIExperience {
    function assignRandomXP(uint256 itemId) external returns (uint256);
    function modifyUserXP(address user, uint256 itemId, bool add) external;
}

interface IAICreatorCollection {
    function owner() external view returns (address);
}

// We add this to the same file for simplicity:
interface IAINFTExchange {
    function setAiCollection(uint256 collectionId, address collectionAddr) external;
}

contract AINFTExchange is ERC721URIStorage, Ownable {
    uint256 private itemCounter;
    address public immutable rewardPool;
    address public immutable experienceModule;
    uint256 public constant FEE_PERCENT = 10;

    struct AIItem {
        uint256 itemId;
        address creator;
        uint256 xpValue;
        bool isOnSale;
        uint256 salePrice;
        string resourceUrl;
    }

    mapping(uint256 => AIItem) public itemData;
    mapping(address => uint256) public userXP;
    mapping(uint256 => address) public aiCollections;

    event AIItemGenerated(
        uint256 indexed itemId,
        address indexed collectionContract,
        uint256 xpGained,
        string imageURL
    );

    event AIItemListed(uint256 indexed itemId, uint256 price);
    event AIItemSold(uint256 indexed itemId, address seller, address buyer, uint256 amount);
    event AINFTContractRegistered(uint256 indexed collectionId, address collectionContract);

    constructor(address poolAddr, address xpAddr) ERC721("AIDrivenNFT", "AIDNFT") Ownable(msg.sender) {
        rewardPool = poolAddr;
        experienceModule = xpAddr;
    }

    function generateAIItem(
        address recipient,
        uint256 collectionId,
        string memory imageUrl
    ) external payable {
        require(aiCollections[collectionId] == msg.sender, "Not authorized collection");
        uint256 newId = _nextItemId();
        _safeMint(recipient, newId);

        uint256 xpAssigned = IAIExperience(experienceModule).assignRandomXP(newId);
        IAIExperience(experienceModule).modifyUserXP(recipient, newId, true);

        address colOwner = IAICreatorCollection(aiCollections[collectionId]).owner();

        itemData[newId] = AIItem({
            itemId: newId,
            creator: colOwner,
            xpValue: xpAssigned,
            isOnSale: false,
            salePrice: 0,
            resourceUrl: imageUrl
        });

        emit AIItemGenerated(newId, aiCollections[collectionId], xpAssigned, imageUrl);
    }

    function listAIItem(uint256 itemId, uint256 price) external {
        require(ownerOf(itemId) == msg.sender, "Caller not item owner");
        require(price > 0, "Price must be greater than zero");

        itemData[itemId].isOnSale = true;
        itemData[itemId].salePrice = price;
        emit AIItemListed(itemId, price);
    }

    function purchaseAIItem(uint256 itemId) external payable {
        require(itemData[itemId].isOnSale, "Item is not for sale");
        require(msg.value >= itemData[itemId].salePrice, "Payment not sufficient");

        address seller = ownerOf(itemId);
        IAIExperience(experienceModule).modifyUserXP(seller, itemId, false);
        IAIExperience(experienceModule).modifyUserXP(msg.sender, itemId, true);

        _transfer(seller, msg.sender, itemId);

        uint256 feeAmount = (msg.value * FEE_PERCENT) / 100;
        uint256 sellerAmount = msg.value - feeAmount;

        (bool sentFee, ) = rewardPool.call{value: feeAmount}("");
        require(sentFee, "Fee transfer failed");

        (bool sentSeller, ) = payable(seller).call{value: sellerAmount}("");
        require(sentSeller, "Seller payment failed");

        itemData[itemId].isOnSale = false;
        itemData[itemId].salePrice = 0;

        emit AIItemSold(itemId, seller, msg.sender, msg.value);
    }

    function registerAIDerivedContract(address collectionAddr) external returns (uint256) {
        itemCounter++;
        aiCollections[itemCounter] = collectionAddr;
        emit AINFTContractRegistered(itemCounter, collectionAddr);
        return itemCounter;
    }

    function getLatestItemId() external view returns (uint256) {
        return itemCounter;
    }

    function _nextItemId() private returns (uint256) {
        itemCounter++;
        return itemCounter;
    }

    // Add setAiCollection() above the final brace
    function setAiCollection(uint256 collectionId, address collectionAddr) external onlyOwner {
        aiCollections[collectionId] = collectionAddr;
    }

    function getRewardPool() external view returns (address) {
        return rewardPool;
    }
}