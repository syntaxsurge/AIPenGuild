'use client'

import { motion } from 'framer-motion'
import { Award, BrainCircuit, Code2, Coins, GitMerge, ShoppingBag } from 'lucide-react'
import { XP_TITLES } from '@/lib/experience'

/**
 * A Key Features section displaying 6 feature cards. Instead of images, we use icons
 * from lucide-react, each placed inside a gradient circular background for a modern look.
 */
export default function KeyFeaturesSection() {
  return (
    <section
      id='key-features'
      className='relative w-full bg-gray-50 px-4 py-12 dark:bg-gray-800 sm:py-16 md:py-20 lg:py-24'
    >
      <div className='mx-auto max-w-6xl'>
        <motion.h2
          className='mb-8 break-words text-center text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl'
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
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
              <BrainCircuit className='h-6 w-6' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-foreground'>AI-Powered NFT Generation</h3>
            <p className='break-words text-sm leading-relaxed text-muted-foreground'>
              Harness sophisticated LLM prompts to produce unique NFT attributes, while advanced image models craft
              stunning visuals. Your NFT is stored securely on IPFS, complete with robust metadata for cross-game usage.
            </p>
          </motion.div>

          {/* NFT Staking */}
          <motion.div
            className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
              <Coins className='h-6 w-6' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-foreground'>NFT Staking &amp; Rewards</h3>
            <p className='break-words text-sm leading-relaxed text-muted-foreground'>
              Lock up your NFTs to passively accumulate XP at a steady rate. Claim your rewards anytime, or let them
              build for bigger benefits—perfect for gamers aiming to power up in upcoming titles or experiences.
            </p>
          </motion.div>

          {/* XP & Titles */}
          <motion.div
            className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
              <Award className='h-6 w-6' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-foreground'>XP &amp; User Titles</h3>
            <p className='break-words text-sm leading-relaxed text-muted-foreground'>
              Each NFT carries random XP (1 to 100). Collect more NFTs or stake them to climb the ranks, earning
              prestigious titles like &quot;{XP_TITLES[2].label}&quot;, &quot;{XP_TITLES[5].label}&quot;, or &quot;
              {XP_TITLES[8].label}&quot;. Showcase your progress on the Leaderboard.
            </p>
          </motion.div>

          {/* Marketplace */}
          <motion.div
            className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
              <ShoppingBag className='h-6 w-6' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-foreground'>Dynamic Marketplace</h3>
            <p className='break-words text-sm leading-relaxed text-muted-foreground'>
              Seamlessly list, purchase, or trade NFTs in our integrated marketplace. A 10% platform fee supports the{' '}
              <em>PlatformRewardPool</em>, fueling rewards and ecosystem growth. XP ownership transfers automatically
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
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
              <GitMerge className='h-6 w-6' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-foreground'>Multi-Chain Compatibility</h3>
            <p className='break-words text-sm leading-relaxed text-muted-foreground'>
              Operating on networks like Moonbase Alpha and Westend, AIPenGuild ensures your NFTs remain portable.
              Whether bridging to new Polkadot parachains or EVM ecosystems, your assets follow you seamlessly.
            </p>
          </motion.div>

          {/* External Developer APIs */}
          <motion.div
            className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
              <Code2 className='h-6 w-6' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-foreground'>External Developer APIs</h3>
            <p className='break-words text-sm leading-relaxed text-muted-foreground'>
              Integrate NFT stats into your own dApps or games with simple endpoints, e.g.{' '}
              <code className='rounded-sm bg-accent/10 px-1'>/api/v1/gaming/nft/[tokenId]</code>
              &amp; <code className='rounded-sm bg-accent/10 px-1'>/api/v1/gaming/user/[address]</code>. Fetch metadata,
              XP, stake status, or attributes to power truly interoperable experiences.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
