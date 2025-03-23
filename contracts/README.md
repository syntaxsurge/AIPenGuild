# AIPenGuild Contracts – HardHat Deployment

This directory contains all the smart contracts for the AIPenGuild ecosystem, along with HardHat configurations and scripts to compile, deploy, and manage them.

## Table of Contents

- [AIPenGuild Contracts – HardHat Deployment](#aipenguild-contracts--hardhat-deployment)
  - [Table of Contents](#table-of-contents)
  - [1. Overview of the Contracts](#1-overview-of-the-contracts)
  - [2. Setup Instructions](#2-setup-instructions)
    - [2.1 Install Dependencies](#21-install-dependencies)
    - [2.2 Configure Environment](#22-configure-environment)
    - [2.3 Compilation](#23-compilation)
    - [2.4 Deployment (with Logging)](#24-deployment-with-logging)
    - [2.5 Updating Addresses](#25-updating-addresses)
    - [2.6 Cleaning Build Artifacts](#26-cleaning-build-artifacts)
    - [2.7 One-Line Redeploy](#27-one-line-redeploy)
  - [3. Detailed Contract Descriptions](#3-detailed-contract-descriptions)
  - [4. Common Workflows](#4-common-workflows)
  - [5. Additional Notes](#5-additional-notes)

---

## 1\. Overview of the Contracts

AIPenGuild is designed to bring AI-generated NFTs, staking rewards, XP-based mechanics, and marketplace trading into a single ecosystem. The contracts in this folder handle different facets of the system:

- **NFTMintingPlatform.sol**: Central factory for minting NFTs with random XP assignment.
- **NFTMarketplaceHub.sol**: Marketplace logic for listing and buying NFTs (10% fee goes to _PlatformRewardPool_).
- **NFTCreatorCollection.sol**: Specialized contract allowing users to mint NFTs by paying either native tokens or XP. Delegates actual NFT creation to _NFTMintingPlatform_.
- **NFTStakingPool.sol**: Enables users to stake their NFTs to accumulate XP over time (_xpPerSecond_ rate).
- **PlatformRewardPool.sol**: Holds fees collected from the marketplace. Only the owner can withdraw the pooled funds.
- **UserExperiencePoints.sol**: Manages XP for each user and NFT. Tracks random XP assigned to each NFT, modifies user XP when NFTs change hands or are staked.

In combination, these contracts allow minted NFTs to have dynamic properties (AI-generated visuals, random XP, on-chain attributes), a marketplace for exchanging them, a reward pool for fees, and optional staking to grant additional XP over time.

---

## 2\. Setup Instructions

### 2.1 Install Dependencies

Inside this _contracts_ folder, run:

```bash
npm install
```

This command installs HardHat, OpenZeppelin, TypeScript, and other development dependencies needed for compiling and deploying the contracts.

### 2.2 Configure Environment

Copy `.env.example` to `.env` and fill in the following:

- **MOONBASE_RPC_NETWORK**: RPC endpoint for Moonbase Alpha.
- **WESTEND_RPC_NETWORK**: RPC endpoint for Westend AssetHub.
- **PRIVATE_KEY**: Private key of your deployer account (from a wallet or test account).

### 2.3 Compilation

To compile the smart contracts using HardHat:

```bash
npm run compile
```

This runs `npx hardhat compile` under the hood, generating artifacts in the _artifacts_ folder.

### 2.4 Deployment (with Logging)

Use the following commands to deploy contracts while logging output to `deploy.log` in this directory. That file is essential for updating addresses afterward.

- **Deploy to Moonbase Alpha (logging):**

  ```bash
  npm run deploy:moonbase:log
  ```

- **Deploy to Westend (logging):**

  ```bash
  npm run deploy:westend:log
  ```

The _deploy.log_ file will display lines such as “_PlatformRewardPool deployed to: 0xabc..._ ”. These addresses are used to update your front-end or other references.

### 2.5 Updating Addresses

After logging the deployment, run:

npm run update:addresses

This executes `update-addresses.ts`, which reads from `deploy.log` and updates `addresses.ts` accordingly. The relevant entries are:

- NFTMintingPlatform
- NFTMarketplaceHub
- PlatformRewardPool
- UserExperiencePoints
- NFTCreatorCollection
- NFTStakingPool

### 2.6 Cleaning Build Artifacts

If you need to reset the build state, remove all compiled files, and start fresh, run:

```bash
npm run clean
```

This calls `npx hardhat clean` under the hood and removes the _artifacts_ and _cache_ directories.

### 2.7 One-Line Redeploy

To streamline the entire process—cleaning old artifacts, recompiling, deploying (with logging), and updating addresses in one line—use:

```bash
npm run clean && npm run compile && npm run deploy:moonbase:log && npm run update:addresses
```

Adjust the deploy command if you want to deploy to Westend instead, for example `deploy:westend:log`.

---

## 3\. Detailed Contract Descriptions

1.  **PlatformRewardPool.sol**  
    Collects and holds fees from _NFTMarketplaceHub_ (e.g., 10% of sale prices). The contract’s balance can be withdrawn only by the owner. Acts as the treasury for the ecosystem.
2.  **UserExperiencePoints.sol**  
    Central registry for user XP. It maps NFT IDs to assigned XP and user addresses to the total XP they hold. Whenever NFTs transfer or stake/unstake events occur, `UserExperiencePoints` adjusts XP for the relevant user.
3.  **NFTMintingPlatform.sol**  
    The main ERC721 contract that mints NFTs. Each newly minted NFT is automatically assigned random XP (between 1 and 100). This ensures uniqueness in gameplay or usage across the platform. External calls (like _NFTCreatorCollection_) can request _generateNFTItem_ to produce an NFT on behalf of a user.
4.  **NFTMarketplaceHub.sol**  
    Handles listing NFTs for sale, setting prices, buying, and transferring XP ownership. A portion of each sale (10%) is sent to the _PlatformRewardPool_, while 90% goes to the seller. The contract also ensures the buyer gains the NFT’s assigned XP and the seller loses it.
5.  **NFTCreatorCollection.sol**  
    Allows the platform owner or a designated address to define a “collection” with metadata, max supply, and the ability for users to mint NFTs by paying either a set native token price (like 0.1 DEV on Moonbase) or using 100 XP (subtracted from the user’s XP total). Actual minting is delegated to the _NFTMintingPlatform_.
6.  **NFTStakingPool.sol**  
    Users can stake their NFTs in this pool to accumulate additional XP at `xpPerSecond`. Staked NFTs cannot be traded or listed until they are unstaked. On claiming or unstaking, _UserExperiencePoints_ credits the staker with the appropriate XP.

---

## 4\. Common Workflows

- **Minting an NFT**:
  1.  User calls `mintFromCollection` in _NFTCreatorCollection_, optionally paying native currency or burning XP.
  2.  _NFTCreatorCollection_ delegates to _NFTMintingPlatform_, which mints an NFT with random XP.
  3.  User’s XP is updated in _UserExperiencePoints_ if paying with XP, or user’s wallet is deducted if paying with native tokens (funds going to _PlatformRewardPool_).
- **Listing an NFT for Sale**:
  1.  User calls `listNFTItem` on _NFTMarketplaceHub_ with a desired price.
  2.  The NFT is effectively on sale until purchased or `unlistNFTItem` is called.
- **Buying a Listed NFT**:
  1.  Buyer calls `purchaseNFTItem` with payment >= sale price.
  2.  10% of the amount goes to _PlatformRewardPool_; 90% goes to the seller.
  3.  _UserExperiencePoints_ transfers XP from the seller to the buyer for that NFT. Ownership changes as well in _NFTMintingPlatform_.
- **Staking and Unstaking**:
  1.  **Stake**: Transfer the NFT to _NFTStakingPool_ by calling `stakeNFT`. Start earning XP each second.
  2.  **Claim XP**: Call `claimStakingRewards` at any time to convert accumulated time into additional XP in _UserExperiencePoints_.
  3.  **Unstake**: Call `unstakeNFT` to remove the NFT from _NFTStakingPool_, automatically claiming any final XP and returning the NFT to the user’s wallet.

---

## 5\. Additional Notes

- All contract ABIs are available in `artifacts/` after compilation. The project also references them in the front-end via `contracts/abis/index.ts`.
- Addresses are defined in `addresses.ts` under `CONTRACT_ADDRESSES` for each supported chain (Moonbase Alpha, Westend, etc.).
- The `deploy.ts` script showcases a recommended order to deploy these contracts since _NFTMintingPlatform_ references _UserExperiencePoints_ and _PlatformRewardPool_, and _NFTMarketplaceHub_ references all of them as well.

With these contracts deployed and configured, you can integrate AIPenGuild features—such as AI-driven NFT minting, XP-based user progress, staking for extra rewards, and marketplace listings—into your dApp or game. Happy building!
