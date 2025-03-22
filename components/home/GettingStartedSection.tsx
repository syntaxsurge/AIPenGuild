"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Wallet, Wand2, Coins, Code2 } from "lucide-react"

/**
 * A modern, icon-driven "Getting Started" section that mirrors
 * the style from KeyFeaturesSection, providing a refined visual
 * aesthetic with hover effects, a card layout, and step icons.
 */
export default function GettingStartedSection() {
  return (
    <section
      id='getting-started'
      className='w-full bg-gray-50 dark:bg-gray-800 px-4 py-12 sm:py-16 md:py-20 lg:py-24'
    >
      <div className='mx-auto max-w-6xl'>
        <motion.div
          className='mx-auto mb-8 max-w-3xl text-center'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className='mb-4 text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl break-words'>
            Getting Started with AIPenGuild
          </h2>
          <p className='text-sm leading-relaxed text-muted-foreground sm:text-base'>
            Kickstart your journey with just a few simple steps. From wallet setup
            to minting AI NFTs and staking them for XP, we've got everything you need
            to begin your immersive AIPenGuild experience.
          </p>
        </motion.div>

        <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4'>
          {/* Step 1: Connect Wallet */}
          <motion.div
            className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
              <Wallet className='h-6 w-6' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-foreground'>
              1. Connect Your Wallet
            </h3>
            <p className='text-sm leading-relaxed text-muted-foreground mb-3'>
              Configure for Moonbase Alpha or Westend, then link your wallet with AIPenGuild
              to start minting and interacting with AI NFTs.
            </p>
            <Link
              href='/dashboard'
              className='text-sm font-medium text-primary transition-colors hover:underline'
            >
              Go to Dashboard
            </Link>
          </motion.div>

          {/* Step 2: Mint AI NFT */}
          <motion.div
            className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
              <Wand2 className='h-6 w-6' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-foreground'>
              2. Mint Your AI NFT
            </h3>
            <p className='text-sm leading-relaxed text-muted-foreground mb-3'>
              Craft one-of-a-kind NFTs with AI-generated images & attributes.
              Choose to pay with tokens or utilize 100 XP to finalize minting.
            </p>
            <Link
              href='/mint'
              className='text-sm font-medium text-primary transition-colors hover:underline'
            >
              Mint AI NFT
            </Link>
          </motion.div>

          {/* Step 3: Stake or Sell */}
          <motion.div
            className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
              <Coins className='h-6 w-6' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-foreground'>
              3. Stake or Sell
            </h3>
            <p className='text-sm leading-relaxed text-muted-foreground mb-3'>
              Use the <em>Stake</em> page to lock in your NFTs and accumulate extra XP,
              or list them for sale on our Marketplace to allow others
              to benefit from your AI-generated items.
            </p>
            <Link
              href='/stake'
              className='text-sm font-medium text-primary transition-colors hover:underline'
            >
              Stake NFTs
            </Link>
          </motion.div>

          {/* Step 4: Integrate & Expand */}
          <motion.div
            className='group flex flex-col items-start rounded-lg border border-border bg-background p-6 shadow-md transition hover:shadow-lg'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
              <Code2 className='h-6 w-6' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-foreground'>
              4. Integrate &amp; Expand
            </h3>
            <p className='text-sm leading-relaxed text-muted-foreground mb-3'>
              Fetch NFT attributes or user XP via our public APIs,
              embed them into your dApps and games, and explore new
              cross-chain possibilities within Polkadot.
            </p>
            <Link
              href='/leaderboard'
              className='text-sm font-medium text-primary transition-colors hover:underline'
            >
              Leaderboard
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}