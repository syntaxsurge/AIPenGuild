'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { InteractiveHoverButton } from '@/components/ui/interactive-button'
import { XP_TITLES } from '@/lib/experience'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <>
      {/* HERO / LANDING SECTION */}
      <section className='w-full bg-background px-4 py-12 sm:py-16 md:py-20 lg:py-24'>
        <div className='mx-auto flex max-w-6xl flex-col-reverse items-center gap-10 md:flex-row md:gap-6'>
          {/* Left side content */}
          <div className='flex-1'>
            <motion.h1
              className='mb-4 text-4xl font-extrabold leading-tight text-primary break-words sm:text-5xl md:text-6xl'
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              Welcome to AIPenGuild
            </motion.h1>
            <motion.p
              className='mb-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg'
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              AIPenGuild is your gateway to a next-generation NFT ecosystem.
              Generate AI-based NFTs, stake them for XP, explore an integrated marketplace,
              and benefit from robust cross-chain & cross-game data—everything at your fingertips.
            </motion.p>
            <motion.div
              className='flex flex-col sm:flex-row sm:items-center sm:gap-4'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <Link href='/mint'>
                <InteractiveHoverButton text='Mint Your First AI NFT' />
              </Link>
            </motion.div>
          </div>

          {/* Right side media */}
          <motion.div
            className='relative h-[600px] w-full flex-1 overflow-hidden rounded-xl sm:h-[600px]'
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Image
              src='/images/hero-nft-preview.png'
              alt='AIPenGuild Showcase'
              fill
              sizes='(max-width: 768px) 100vw,
                     (max-width: 1200px) 50vw,
                     33vw'
              className={cn('object-cover')}
            />
          </motion.div>
        </div>
      </section>

      {/* WHAT IS AIPENGUILD */}
      <section className='bg-white dark:bg-gray-900 px-4 py-12 sm:py-16 md:py-20 lg:py-24'>
        <div className='mx-auto max-w-6xl'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className='mx-auto max-w-prose text-center'
          >
            <h2 className='mb-4 text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl break-words'>
              What is AIPenGuild?
            </h2>
            <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
              AIPenGuild merges the power of AI with decentralized technology,
              letting you create, own, and trade NFTs that come with dynamic,
              game-ready attributes. Whether you&apos;re a seasoned collector,
              a game developer seeking cross-ecosystem items, or a blockchain enthusiast,
              AIPenGuild provides all the tools you need—beautiful AI imagery,
              robust attribute data, staking rewards, and frictionless marketplace transactions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* KEY FEATURES SECTION */}
      <section
        id='features'
        className='relative w-full px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50 dark:bg-gray-800'
      >
        <div className='mx-auto max-w-6xl'>
          <motion.h2
            className='mb-8 text-center text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl break-words'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Key Features
          </motion.h2>

          <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            {/* AI-Driven NFT Generation */}
            <motion.div
              className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Image
                src='/images/feature-ai.png'
                alt='AI NFT Generation'
                width={60}
                height={60}
                className='mb-4'
              />
              <h3 className='mb-2 text-lg font-semibold text-foreground'>AI-Powered NFT Generation</h3>
              <p className='text-sm leading-relaxed text-muted-foreground break-words'>
                Harness sophisticated LLM prompts to produce unique NFT attributes,
                while advanced image models craft stunning visuals. Your NFT is stored
                securely on IPFS, complete with robust metadata for cross-game usage.
              </p>
            </motion.div>

            {/* NFT Staking */}
            <motion.div
              className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Image
                src='/images/feature-staking.png'
                alt='NFT Staking'
                width={60}
                height={60}
                className='mb-4'
              />
              <h3 className='mb-2 text-lg font-semibold text-foreground'>NFT Staking &amp; Rewards</h3>
              <p className='text-sm leading-relaxed text-muted-foreground break-words'>
                Lock up your NFTs to passively accumulate XP at a steady rate.
                Claim your rewards anytime, or let them build for bigger benefits—perfect for
                gamers aiming to power up in upcoming titles or experiences.
              </p>
            </motion.div>

            {/* XP & Titles */}
            <motion.div
              className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Image
                src='/images/feature-xp.png'
                alt='XP and Titles'
                width={60}
                height={60}
                className='mb-4'
              />
              <h3 className='mb-2 text-lg font-semibold text-foreground'>XP &amp; User Titles</h3>
              <p className='text-sm leading-relaxed text-muted-foreground break-words'>
                Each NFT carries random XP (1 to 100). Collect more NFTs or stake them to
                climb the ranks, earning prestigious titles like
                &quot;{XP_TITLES[2].label}&quot;, &quot;{XP_TITLES[5].label}&quot;, or
                &quot;{XP_TITLES[8].label}&quot;. Showcase your progress on the Leaderboard.
              </p>
            </motion.div>

            {/* Marketplace */}
            <motion.div
              className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Image
                src='/images/feature-marketplace.png'
                alt='Marketplace'
                width={60}
                height={60}
                className='mb-4'
              />
              <h3 className='mb-2 text-lg font-semibold text-foreground'>Dynamic Marketplace</h3>
              <p className='text-sm leading-relaxed text-muted-foreground break-words'>
                Seamlessly list, purchase, or trade NFTs in our integrated marketplace.
                A 10% platform fee supports the <em>PlatformRewardPool</em>,
                fueling rewards and ecosystem growth. XP ownership transfers automatically
                with each sale.
              </p>
            </motion.div>

            {/* Cross-Chain & Polkadot Ecosystem */}
            <motion.div
              className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Image
                src='/images/feature-crosschain.png'
                alt='Cross Chain Support'
                width={60}
                height={60}
                className='mb-4'
              />
              <h3 className='mb-2 text-lg font-semibold text-foreground'>Multi-Chain Compatibility</h3>
              <p className='text-sm leading-relaxed text-muted-foreground break-words'>
                Operating on networks like Moonbase Alpha and Westend, AIPenGuild
                ensures your NFTs remain portable. Whether bridging to new Polkadot parachains
                or EVM ecosystems, your assets follow you seamlessly.
              </p>
            </motion.div>

            {/* External Developer APIs */}
            <motion.div
              className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Image
                src='/images/feature-apis.png'
                alt='External APIs'
                width={60}
                height={60}
                className='mb-4'
              />
              <h3 className='mb-2 text-lg font-semibold text-foreground'>External Developer APIs</h3>
              <p className='text-sm leading-relaxed text-muted-foreground break-words'>
                Integrate NFT stats into your own dApps or games with simple endpoints,
                e.g. <code className='bg-accent/10 px-1 rounded-sm'>/api/v1/gaming/nft/[tokenId]</code>
                &amp; <code className='bg-accent/10 px-1 rounded-sm'>/api/v1/gaming/user/[address]</code>.
                Fetch metadata, XP, stake status, or attributes to power truly interoperable experiences.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WORKFLOW OVERVIEW SECTION */}
      <section className='relative w-full px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900'>
        <div className='mx-auto max-w-6xl'>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='mx-auto max-w-prose text-center'
          >
            <h2 className='mb-6 text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl break-words'>
              How AIPenGuild Works
            </h2>
            <p className='mb-8 text-sm leading-relaxed text-muted-foreground sm:text-base'>
              From idea to mint, from staking to trading—here&apos;s a quick overview of
              how you can harness the power of AI-driven NFT creation and on-chain XP management.
            </p>
          </motion.div>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
            <motion.div
              className='rounded-lg border border-border bg-secondary/10 p-6 transition hover:shadow-lg'
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h3 className='mb-3 text-lg font-bold text-foreground'>1. Generate NFT</h3>
              <p className='mb-3 text-sm leading-relaxed text-muted-foreground break-words'>
                Use LLM-based prompts to define your NFT&apos;s attributes.
                Then Replicate generates a unique image. Store everything on IPFS.
                Your creation is now ready for on-chain minting!
              </p>
              <div className='relative h-40 w-full overflow-hidden rounded-md bg-secondary'>
                <Image
                  src='/images/overview-generate.png'
                  alt='Generate'
                  fill
                  sizes='(max-width: 768px) 100vw,
                         (max-width: 1200px) 50vw,
                         33vw'
                  className='object-cover'
                />
              </div>
            </motion.div>

            <motion.div
              className='rounded-lg border border-border bg-secondary/10 p-6 transition hover:shadow-lg'
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h3 className='mb-3 text-lg font-bold text-foreground'>2. Mint &amp; Acquire XP</h3>
              <p className='mb-3 text-sm leading-relaxed text-muted-foreground break-words'>
                Pay via native tokens or 100 XP to finalize minting.
                Your personal XP is updated once the NFT is yours—an integer between 1 and 100
                unique to that asset.
              </p>
              <div className='relative h-40 w-full overflow-hidden rounded-md bg-secondary'>
                <Image
                  src='/images/overview-mint.png'
                  alt='Minting'
                  fill
                  sizes='(max-width: 768px) 100vw,
                         (max-width: 1200px) 50vw,
                         33vw'
                  className='object-cover'
                />
              </div>
            </motion.div>

            <motion.div
              className='rounded-lg border border-border bg-secondary/10 p-6 transition hover:shadow-lg'
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h3 className='mb-3 text-lg font-bold text-foreground'>3. Stake, Trade, or Integrate</h3>
              <p className='mb-3 text-sm leading-relaxed text-muted-foreground break-words'>
                Stake your NFT for extra XP, sell it on the marketplace, or
                integrate its attributes into external games using our API.
                Enjoy true NFT interoperability backed by on-chain data.
              </p>
              <div className='relative h-40 w-full overflow-hidden rounded-md bg-secondary'>
                <Image
                  src='/images/overview-stake.png'
                  alt='Stake or Trade'
                  fill
                  sizes='(max-width: 768px) 100vw,
                         (max-width: 1200px) 50vw,
                         33vw'
                  className='object-cover'
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* GALLERY / SCREENSHOTS SECTION */}
      <section
        id='gallery'
        className='px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50 dark:bg-gray-800'
      >
        <div className='mx-auto max-w-6xl'>
          <motion.div
            className='mb-6 max-w-prose text-center mx-auto'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className='text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl break-words'>
              In-Action Screenshots
            </h2>
            <p className='mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base'>
              A glimpse of AIPenGuild in motion—experience unique AI NFT generation,
              user dashboards, staking pages, and on-chain metadata explorers.
            </p>
          </motion.div>

          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3'>
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <motion.div
                key={idx}
                className='relative h-44 w-full overflow-hidden rounded-md bg-secondary transition hover:shadow-lg'
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <Image
                  src={`/images/screenshots/screenshot-${idx}.png`}
                  alt={`Screenshot ${idx}`}
                  fill
                  sizes='(max-width: 768px) 100vw,
                         (max-width: 1200px) 50vw,
                         33vw'
                  className='object-cover'
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GETTING STARTED */}
      <section
        id='getting-started'
        className='w-full bg-white dark:bg-gray-900 px-4 py-12 sm:py-16 md:py-20 lg:py-24'
      >
        <div className='mx-auto max-w-5xl text-center'>
          <motion.h2
            className='mb-6 text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl break-words'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Getting Started with AIPenGuild
          </motion.h2>
          <p className='mx-auto mb-8 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base'>
            Begin your journey: set up your wallet, mint AI NFTs, stake for XP, or list items
            in our marketplace. It&apos;s all just a few steps away.
          </p>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
            {/* Step 1 */}
            <motion.div
              className='flex flex-col gap-3 rounded-lg bg-secondary/10 p-6 text-left transition hover:shadow-md'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h3 className='font-semibold text-lg text-foreground'>Step 1: Connect Your Wallet</h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                Configure for Moonbase Alpha or Westend.
                Get test tokens from the official{' '}
                <a
                  href='https://faucet.moonbeam.network/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline hover:opacity-90 text-primary'
                >
                  Moonbase Alpha Faucet
                </a>
                to cover gas fees. Then you&apos;re all set to explore AIPenGuild.
              </p>
              <Link href='/dashboard' className='text-sm font-medium text-primary hover:underline'>
                Go to Dashboard
              </Link>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className='flex flex-col gap-3 rounded-lg bg-secondary/10 p-6 text-left transition hover:shadow-md'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h3 className='font-semibold text-lg text-foreground'>Step 2: Mint &amp; AI Generate</h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                Provide a creative prompt to shape your NFT&apos;s stats &amp; image.
                Once minted, your new NFT is assigned random XP. Pay with tokens or
                your existing XP.
              </p>
              <Link href='/mint' className='text-sm font-medium text-primary hover:underline'>
                Mint AI NFT
              </Link>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              className='flex flex-col gap-3 rounded-lg bg-secondary/10 p-6 text-left transition hover:shadow-md'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h3 className='font-semibold text-lg text-foreground'>Step 3: Stake or Sell</h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                Head to the staking pool to lock in your NFT and earn
                extra XP over time—or list it in our marketplace for
                sale, letting others benefit from its attributes.
              </p>
              <Link href='/stake' className='text-sm font-medium text-primary hover:underline'>
                Stake NFTs
              </Link>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              className='flex flex-col gap-3 rounded-lg bg-secondary/10 p-6 text-left transition hover:shadow-md'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h3 className='font-semibold text-lg text-foreground'>Step 4: Integrate &amp; Explore</h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                Use our API to integrate NFT attributes into your dApp or game.
                Track your XP and titles via the Leaderboard, or check out
                personal stats in the Dashboard to see your journey.
              </p>
              <Link href='/leaderboard' className='text-sm font-medium text-primary hover:underline'>
                Leaderboard
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION / FOOTER SECTION */}
      <section className='bg-secondary text-secondary-foreground px-4 py-12 sm:py-16 md:py-20 lg:py-24'>
        <div className='mx-auto max-w-6xl text-center'>
          <h2 className='mb-4 text-3xl font-extrabold sm:text-4xl md:text-5xl break-words'>
            Ready to Dive In?
          </h2>
          <p className='mx-auto mb-6 max-w-2xl text-sm leading-relaxed sm:text-base'>
            Experience the future of AI-generated NFTs on AIPenGuild.
            Start minting, staking, and sharing cross-chain assets with ease!
          </p>
          <Link
            href='/mint'
            className='inline-block rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'
          >
            Get Started
          </Link>
        </div>
      </section>
    </>
  )
}