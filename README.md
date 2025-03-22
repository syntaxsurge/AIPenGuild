AIPenGuild
==========

## Table of Contents
- [Team Members](#team-members)
- [1. Project Description](#1-project-description)
- [2. Inspiration](#2-inspiration)
- [3. Technical Stack](#3-technical-stack)
- [4. Features](#4-features)
- [5. How It Works](#5-how-it-works)
- [6. Demo Instructions](#6-demo-instructions)
- [7. Challenges](#7-challenges)
- [8. Future Development](#8-future-development)
- [9. Submission Details](#9-submission-details)
- [10. License](#10-license)
- [11. Acknowledgments](#11-acknowledgments)

AIPenGuild is a comprehensive AI-based NFT ecosystem providing custom Marketplace trading, NFT Staking for XP rewards, and real-world game interoperability—where attributes (strength, rarity, agility) are shared seamlessly across multiple blockchain games, ensuring a single NFT can preserve its gameplay stats, staking benefits, and marketplace value everywhere.

* * *

Team Members
------------

*   **Jade Laurence Empleo**  
    Solo Developer (Fullstack Developer, Blockchain Developer, UI/UX Designer)  
    **Contact Information:**
    *   Email: syntaxsurge@gmail.com
    *   Discord: syntaxsurge
    *   Telegram: syntaxsurge

* * *

1\. Project Description
-----------------------

**What does your project do?**

AIPenGuild is a fully-integrated platform for generating AI-driven NFTs with structured, game-oriented attributes (like _strength, agility, durability, boostType_) and storing them on IPFS. This approach allows **external game developers** to easily parse NFT stats for characters, items, or power-ups, ensuring the same NFT can be used across multiple games or chains. The system includes:

*   A custom **Marketplace** with 10% fees to `PlatformRewardPool`
*   **NFT Staking** to earn additional XP over time
*   Gamified **XP Mechanics** (storing random XP in minted NFTs)
*   Structured JSON attributes for cross-chain and cross-game interoperability

Essentially, AIPenGuild offers a universal standard for AI-generated NFT metadata, enabling real-world gaming integrations in a cross-chain, decentralized environment.

* * *

2\. Inspiration
---------------

The project was inspired by the growing need for **interoperable NFTs** in gaming, where a single asset can hold valuable attributes across multiple games. We wanted to merge _AI-based content generation_ (unique visuals and stats) with an on-chain metadata standard that truly ensures ownership and progression to follow players from one ecosystem to another. Combining _LLM-based attribute generation_, _NFT staking for XP_, and easy IPFS integration was too compelling to ignore.

* * *

3\. Technical Stack
-------------------

**Languages & Frameworks:**

*   TypeScript
*   Next.js (React-based)
*   Node.js

**Smart Contract Tooling & Libraries:**

*   Hardhat for contract compilation and deployment
*   OpenZeppelin Contracts (ERC721, AccessControl, etc.)
*   Polkadot Ecosystem (Moonbase Alpha / Westend AssetHub) with bridging to EVM-style usage
*   Ethers & `viem` for on-chain reads/writes

**Blockchain/Protocol:**

*   Polkadot.js (Substrate-based chains) and EVM-compatible flows (Moonbase Alpha, Westend AssetHub test networks)
*   Fully integratable with other EVM-based networks if desired

**Tools, Libraries, & APIs:**

*   OpenAI for LLM-based attribute generation
*   Replicate for AI image generation (black-forest-labs/flux-dev model as example)
*   IPFS (via Unique Network public endpoints) for decentralized file and JSON storage
*   Wagmi + RainbowKit for web3 wallet connections
*   Tailwind CSS for styling
*   Framer Motion & AOS for animations
*   Prettier & ESLint for code formatting and linting

* * *

4\. Features
------------

*   **AI-Powered Attribute Generation**: Generate structured NFT stats (strength, agility, etc.) via LLM.
*   **NFT Staking**: Stake your NFTs to earn XP passively, tracked on-chain in `NFTStakingPool`.
*   **Marketplace with Automatic XP Transfers**: When an NFT is sold, 10% fee goes to `PlatformRewardPool`, and 90% to the seller, while XP data is reassigned to the new owner automatically.
*   **Gamified XP**: Each NFT is assigned random XP (1–100) upon minting, credited to the owner. This XP can be used to pay minting fees or for other in-game utility.
*   **Cross-Chain Potential**: Polkadot-based approach + EVM bridging ensures these NFTs can be recognized across multiple blockchains.

* * *

5\. How It Works
----------------

### 5.1 Architecture

At a high level, AIPenGuild combines a front-end (Next.js) with smart contracts that manage NFT minting, staking, XP tracking, and a marketplace:

*   **NFTCreatorCollection.sol**: Defines how NFTs can be minted (paying with native tokens or XP).
*   **NFTMintingPlatform.sol**: Actually mints NFTs, assigns random XP, references IPFS metadata.
*   **UserExperiencePoints.sol**: Tracks each user’s total XP, adjusts when they gain/lose or stake NFTs.
*   **NFTStakingPool.sol**: Users can lock NFTs here to earn more XP over time.
*   **NFTMarketplaceHub.sol**: Lists, buys, sells NFTs with a 10% fee to `PlatformRewardPool`.
*   **PlatformRewardPool.sol**: Basic treasury contract that accumulates the 10% fee from sales.

The front-end calls Next.js APIs (`/api/v1/ai-nft/metadata` for attribute generation, etc.), orchestrating LLM-based attributes, AI image creation, and IPFS uploads, then finalizes the on-chain mint.

### 5.2 Detailed Workflow

1.  **User Chooses Category & Prompt**: (“Character,” “GameItem,” or “Powerup,” plus a creative text prompt).
2.  **Attribute Generation (LLM)**: Next.js calls `/api/v1/ai-nft/metadata`, enforces strict JSON output with the correct numeric ranges.
3.  **AI Image Creation**: Using `finalReplicatePrompt`, the service obtains an AI-generated image from Replicate, merges it into the final JSON.
4.  **IPFS & Mint**: Upload both the image and JSON to IPFS. Call `mintFromCollection` in `NFTCreatorCollection` to finalize the NFT on-chain, paying either 0.1 native token or 100 XP.
5.  **External Games**: Any external game can query the NFT’s IPFS metadata and parse attributes like _strength_, _power_, or _duration_. No manual guesswork required—just read the standardized JSON from IPFS.
6.  **Marketplace & Staking**:
    *   Marketplace: Lists or unlists NFTs in `NFTMarketplaceHub`, collects 10% fees on a sale, and reassigns XP ownership.
    *   Staking: `NFTStakingPool` lets users stake an NFT to accumulate XP over time at `xpPerSecond`.

* * *

6\. Demo Instructions
---------------------

1.  **Clone the Repo:**
    
        git clone https://github.com/syntaxsurge/AIPenGuild.git
        cd AIPenGuild
        
    
2.  **Install Dependencies & Set Up Contracts:**
    *   Go to `contracts` folder. Read its `README.md` for detailed instructions on installing dependencies, compiling, and deploying the smart contracts (e.g., `npm install`, `npm run compile`, etc.).
    *   After deployment (on Moonbase Alpha or Westend), update the addresses in `addresses.ts` accordingly.
3.  **Create and Populate Your .env File:**
    *   Copy the `.env.example` and rename it to `.env`.
    *   Fill in `REPLICATE_API_TOKEN` (for AI images) and `OPENAI_API_KEY` (for LLM-based attributes).
    *   Optionally set `NEXT_PUBLIC_DEBUG_UPLOAD_CUSTOM_IMAGE` to `true` if you want to manually upload images instead of AI generation.
4.  **Run Front-End Locally:**
    
        npm run dev
    
    *   Connect your wallet (e.g., via MetaMask or Polkadot.js extension) to the correct chain (Moonbase Alpha, Westend AssetHub, etc.).
5.  **Test Mint Flow:**
    *   Navigate to `/mint`. Choose _Character_ or _GameItem_, type an AI prompt, and click “Generate Image & Attributes.”
    *   Click “Mint NFT” (pay with either 100 XP or 0.1 native tokens). Wait for the transaction to confirm. The minted NFT references IPFS metadata.
6.  **Marketplace & Staking:**
    *   **Marketplace:** Visit `/marketplace` to list or unlist items for sale, buy items from others, and see XP ownership transfers automatically.
    *   **Stake:** Visit `/stake` to stake your NFT and earn passive XP. Claim your XP or unstake to retrieve the NFT.
7.  **External Developers & Public APIs:**
    
    *   You can query NFT data directly via `/api/v1/gaming/nft/[tokenId]?chainId=<...>` to get JSON with metadata, XP, stake info, etc.
    *   Fetch a user’s NFTs via `/api/v1/gaming/user/[address]/nfts?chainId=<...>`.
    *   Retrieve XP titles or ranges via `/api/v1/gaming/titles`.
    *   Read user XP via `/api/v1/gaming/user/[address]/xp?chainId=<...>`.
    
    All these endpoints return JSON data to easily integrate your custom game logic. For more details, see the code in `app/api/v1/gaming`.
    

* * *

7\. Challenges
--------------

**What challenges did you face?**

*   **Strict JSON from LLM:** We engineered system prompts carefully to ensure a valid JSON structure with numeric ranges.
*   **IPFS Reliability:** Relying on IPFS can be slow or intermittent, so we used fallback gateways and robust error handling.
*   **Cross-Chain Complexity:** Designing metadata that remains universal across multiple Polkadot/EVM networks required a chain-agnostic approach to URIs and XP logic.

We tackled these by implementing thorough checks in our Next.js backend, fallback IPFS gateway logic, typed ABIs for consistent on-chain calls, and chain-agnostic metadata references.

* * *

8\. Future Development
----------------------

**What’s next for the project?**

*   **More AI Models & Customization**: Integrate multiple AI image generation models (Stable Diffusion, DALL·E) for greater variety.
*   **Additional NFT Categories**: Beyond _Characters_, _GameItems_, and _Powerups_, expand to land plots, vehicles, etc.
*   **Cross-Chain Bridges**: Official bridging solutions so NFTs minted here can be recognized or minted on other networks out-of-the-box.
*   **DAO Governance**: Let the community control fees or reward distribution from `PlatformRewardPool`, or define new staking rates.

* * *

9\. Submission Details
----------------------

*   **GitHub Repository:** [https://github.com/syntaxsurge/AIPenGuild](https://github.com/syntaxsurge/AIPenGuild)
*   **Live Demo:** [YouTube Demo](https://www.youtube.com/watch?v=MH4DsjtsO8c)
*   **Presentation Slides:**  
    [Canva Pitch Deck](https://www.canva.com/design/DAGhvgXMfyQ/4wb7P2oUgSfPZp8zXUN8xA/edit)

* * *

10\. License
------------

This project is licensed under the **MIT License**. See the `LICENSE` file in this repository for more details.

* * *

11\. Acknowledgments
--------------------

We’d like to thank open-source contributors, mentors, and the developers of frameworks like _Next.js_, _Wagmi_, _RainbowKit_, _OpenAI_, _Replicate_, and the Polkadot/Moonbeam community for their documentation and support—enabling this cross-chain vision.