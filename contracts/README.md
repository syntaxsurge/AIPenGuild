# AIPenGuild Contracts - HardHat Deployment

This folder contains the smart contracts and HardHat configuration for AIPenGuild.

## Setup

1. **Environment Setup**

   - Copy `.env.example` (located in this folder) to `.env` and fill in the required environment variables:
     - `PRIVATE_KEY`
     - `MOONBASE_RPC_NETWORK`
     - `WESTEND_RPC_NETWORK`

2. **Install Dependencies**

   In the contracts folder, run:
   ```bash
   npm install
   ```

3. **Compile Contracts**

   To compile the contracts, run:
   ```bash
   npm run compile
   ```

4. **Deploy Contracts with Logging**

   It is recommended to deploy contracts using the logging scripts so that deployment logs are automatically saved to a file (`deploy.log`). This log file is required for updating the contract addresses.

   - To deploy to Moonbase Alpha and save logs:
     ```bash
     npm run deploy:moonbase:log
     ```
   - To deploy to Westend and save logs:
     ```bash
     npm run deploy:westend:log
     ```

   These commands will generate a `deploy.log` file in the contracts directory.

5. **Update Contract Addresses**

   After deployment, update the `addresses.ts` file by running:
   ```bash
   npm run update:addresses
   ```

   This command will read the `deploy.log` file and update the contract addresses accordingly.

6. **Clean Artifacts**

   If you need to remove all build artifacts (such as compiled files and caches), run:
   ```bash
   npm run clean
   ```
   This command calls `npx hardhat clean` under the hood, clearing the `artifacts` and `cache` directories.

7. **One-Line Redeploy**

   If you want to quickly clean, compile, deploy to Moonbase, and update addresses in one command, run:
   ```bash
   npm run clean && npm run compile && npm run deploy:moonbase:log && npm run update:addresses
   ```

## Contract Overview
- **PlatformRewardPool.sol**: Manages the reward pool for the platform.
- **UserExperiencePoints.sol**: Handles the assignment and modification of experience points.
- **NFTMarketplaceHub.sol**: NFT exchange contract that manages minting, listing, and trading of NFTs.
- **NFTCreatorCollection.sol**: NFT collection contract for creators to launch and manage their collections.

For further details on contract interactions, refer to the in-code documentation.

Happy deploying!