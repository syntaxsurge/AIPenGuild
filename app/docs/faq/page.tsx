'use client'

import Image from 'next/image'
import { useState } from 'react'
import ImageLightbox from '@/components/ui/ImageLightbox'
import XPTitlesModal from '@/components/ui/XPTitlesModal'

export default function FAQDocsPage() {
  const [open, setOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const images = ['/images/faq-visual.png']

  function handleImageClick() {
    setLightboxIndex(0)
    setOpen(true)
  }

  return (
    <section className='space-y-8'>
      <h1 className='text-4xl font-extrabold text-primary'>Frequently Asked Questions</h1>
      <p className='text-lg leading-relaxed text-foreground'>
        Below is a comprehensive set of frequently asked questions about AIPenGuild, addressing both
        general user inquiries and deeper technical topics. This guide provides insights into the
        platform’s purpose, usage, development process, and more.
      </p>

      <div className='grid gap-8 lg:grid-cols-2'>
        {/* Left Column (10 Questions) */}
        <div className='flex flex-col gap-6'>
          {/* Q1 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              1. What is the purpose of AIPenGuild?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              AIPenGuild aims to merge advanced AI-generated NFT content with an on-chain ecosystem
              that includes staking, XP leveling, and a marketplace. The platform allows developers
              and end users to create and trade unique NFTs with game-ready attributes, stored in
              IPFS.
            </p>
          </div>

          {/* Q2 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              2. What are Titles, and how do they work?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Titles are milestone-based labels awarded to users who reach certain XP thresholds.
              For instance, you could start as a <em>“Newcomer”</em> and progress to{' '}
              <em>“Adept”</em>, <em>“Master”</em>, and beyond. XP is gained by owning or staking
              NFTs, each carrying a certain XP value.
            </p>
            <div className='mt-2'>
              <XPTitlesModal buttonLabel='View XP Title Table' />
            </div>
          </div>

          {/* Q3 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              3. What networks are supported by AIPenGuild?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Currently, we focus on Moonbase Alpha (an EVM-compatible test network under Moonbeam)
              and Westend AssetHub (a Substrate-based test network). However, the code can be
              adapted to other EVM or Polkadot-based chains with minimal changes to the deployment
              configuration.
            </p>
          </div>

          {/* Q4 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              4. How do I generate an AI NFT, and is it free?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              On the “Mint” page, enter an AI prompt and select a category (Character, Game Item, or
              Powerup). The system calls OpenAI (for attributes) and Replicate (for images) to
              generate your NFT. Using these APIs might incur costs tied to your OpenAI/Replicate
              accounts, so it’s not entirely free. On-chain gas or native token fees also apply for
              minting.
            </p>
          </div>

          {/* Q5 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              5. Do minted NFTs retain their attributes across different dApps?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Yes. Our metadata is stored in IPFS and follows a standardized JSON structure that any
              external dApp or game can parse. This ensures interoperability across multiple
              platforms, so your NFT’s stats (strength, rarity, etc.) remain consistent everywhere.
            </p>
          </div>

          {/* Q6 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              6. How do I handle my NFT if it’s listed for sale but also staked?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Currently, if you stake your NFT, it cannot be sold or transferred until unstaked. If
              an NFT is listed, you must unlist it before staking. This prevents conflicts between
              marketplace listings and staking positions.
            </p>
          </div>

          {/* Q7 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              7. Can I test locally without deploying to an external network?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Yes. You can run a local Hardhat node and deploy your contracts there. Update the
              addresses in
              <em> addresses.ts</em> after deployment. For the AI generation, you would still need
              valid API keys for OpenAI and Replicate. Alternatively, you can mock or stub out those
              calls for purely local testing.
            </p>
          </div>

          {/* Q8 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              8. Is bridging supported for these NFTs?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              At this time, we do not have a built-in bridging mechanism. However, the NFT standard
              we use (ERC721 on EVM-based chains) is portable, and custom bridging solutions may be
              integrated to move your NFTs from one chain to another. This would require an external
              bridging infrastructure or contract.
            </p>
          </div>

          {/* Q9 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              9. Does AIPenGuild support advanced categories or custom attributes?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Yes. The code in <em>app/api/v1/ai-nft/metadata/route.ts</em> and{' '}
              <em>metadata-constants.ts</em> can be expanded to include new categories, attributes,
              and numeric ranges. You can define your own fields or rarity logic to match your
              game’s needs.
            </p>
          </div>

          {/* Q10 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              10. Are there other user roles beyond the Admin?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Primarily, we have “Admin” (the contract owner) who can withdraw from the reward pool.
              Regular users can mint, stake, and sell NFTs. If you need multi-role access, you can
              extend contracts (e.g., add an AccessControl pattern).
            </p>
          </div>
        </div>

        {/* Right Column (10 Questions) */}
        <div className='flex flex-col gap-6'>
          {/* Q11 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              11. Where do marketplace fees go, and can they be changed?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              A 10% fee is sent to the <em>PlatformRewardPool</em> for each sale. The admin can
              withdraw these accumulated funds as needed. If you want a different fee rate, you can
              modify <em>FEE_PERCENT</em> in the
              <em>NFTMarketplaceHub.sol</em> contract.
            </p>
          </div>

          {/* Q12 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              12. How do I rename or remove categories in the AI generation flow?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Edit the constants in <em>metadata-constants.ts</em> (NFT_CATEGORIES array) and the{' '}
              <em>CATEGORIES_CONFIG</em>
              in <em>ai-nft/metadata/route.ts</em>. You can remove or add categories, ensuring you
              handle attribute sets accordingly in your LLM system prompt.
            </p>
          </div>

          {/* Q13 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              13. Are the REST APIs rate-limited or publicly available?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              The Next.js API routes are public by default, so you may want to add rate-limiting or
              authentication if needed. Keep in mind, your OpenAI or Replicate usage is subject to
              their own API key and billing constraints.
            </p>
          </div>

          {/* Q14 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              14. How secure is the IPFS storage for NFT images and metadata?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              While IPFS ensures decentralized content storage, content integrity relies on the IPFS
              hash references. If you require stronger guarantees, you might leverage pinning
              services or store content in multiple gateways.
            </p>
          </div>

          {/* Q15 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              15. How does XP staking continue if I switch to a different chain?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Staking logic resides in <em>NFTStakingPool.sol</em>, so it is chain-specific. If you
              transfer or bridge your NFT to another chain, the original staking session on the old
              chain does not continue. You’d need a cross-chain approach for that scenario.
            </p>
          </div>

          {/* Q16 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              16. Can I customize the “random XP” assignment logic?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Absolutely. The function <em>assignRandomXP</em> in <em>UserExperiencePoints.sol</em>{' '}
              controls the random assignment (1–100). You can alter its random seed generation or
              range if you have a different method or want a deterministic approach using VRF or
              other oracles.
            </p>
          </div>

          {/* Q17 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              17. How do I debug “not found” issues in the Next.js routes?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Check <em>app/not-found.tsx</em> for the 404 fallback. If your Next.js route is
              missing or incorrectly named, Next.js may redirect to this file. Use console logs or
              Next.js debug logs to verify the route patterns. Also make sure your file naming
              matches the route structure exactly.
            </p>
          </div>

          {/* Q18 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              18. Any recommended approach for environment variables with AI tokens?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Store your <em>REPLICATE_API_TOKEN</em> and <em>OPENAI_API_KEY</em> in a{' '}
              <strong>.env</strong> file (based on .env.example). Do not commit these secrets to a
              public repo. Make sure you reference them securely in your Next.js server-side code.
            </p>
          </div>

          {/* Q19 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              19. Can I pay mint fees with something other than 0.1 tokens or 100 XP?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Yes. Adjust the pricing logic in <em>NFTCreatorCollection.sol</em>. You can define new
              payment tiers or alternative token addresses if you want to accept an ERC20 token or
              multiple XP amounts. Just ensure the contract handles the logic in your desired
              manner.
            </p>
          </div>

          {/* Q20 */}
          <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
            <h2 className='mb-2 text-xl font-bold text-primary'>
              20. Developer APIs vs. On-Chain Data—Which should I trust?
            </h2>
            <p className='text-base leading-relaxed text-foreground'>
              Always trust the on-chain data for final authority regarding XP, ownership, and
              staking details. The Next.js API routes simply provide convenience, caching, or
              aggregated results. For critical validation, verify directly on the blockchain through
              the relevant smart contracts.
            </p>
          </div>

          <div className='mt-4 flex justify-center'>
            <Image
              src={images[0]}
              alt='FAQ Illustration'
              width={300}
              height={200}
              className='cursor-pointer rounded-md border border-border shadow-sm'
              onClick={handleImageClick}
            />
          </div>
        </div>
      </div>

      <ImageLightbox
        images={images}
        open={open}
        onClose={() => setOpen(false)}
        startIndex={lightboxIndex}
      />
    </section>
  )
}
