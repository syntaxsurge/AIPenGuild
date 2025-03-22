"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export default function GettingStartedSection() {
  return (
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
  )
}