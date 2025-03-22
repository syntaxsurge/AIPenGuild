"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Wallet, Wand2, Coins, Code2 } from "lucide-react"

/**
 * A modern horizontal timeline approach for "Getting Started",
 * distinct from other sections. Steps are arranged in a row
 * with connecting line behind them, each step featuring an
 * icon, short text, and an action link.
 *
 * Background color is inherited (no extra color blocks).
 * The entire layout is horizontal on larger screens,
 * with a subtle, aesthetic design style.
 */
export default function GettingStartedSection() {
  return (
    <section
      id="getting-started"
      className="w-full px-4 py-12 sm:py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mx-auto mb-8 max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl break-words">
            Getting Started with AIPenGuild
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Embark on a streamlined journey to AI-driven NFTs. Connect your wallet,
            mint AI assets, stake or sell them, and integrate your new items into any
            external dApp or game. Ready to explore the future?
          </p>
        </motion.div>

        {/**
          The timeline container: We adopt a horizontal timeline with 4 steps.
          We place a thin line behind them, and each step has:
            - Step Icon (circle with glow)
            - Title
            - Description
            - Link
        */}
        <div className="relative flex flex-col items-center justify-between gap-10 overflow-x-auto px-2 md:flex-row">
          {/* The horizontal line behind the steps */}
          <div className="absolute top-1/2 left-0 right-0 hidden h-[2px] bg-border md:block" style={{ zIndex: 1 }} />

          {/* Step 1 */}
          <StepItem
            icon={<Wallet className="h-7 w-7 text-white" />}
            title="Connect Your Wallet"
            description="Configure for Moonbase Alpha or Westend, then link your wallet to begin exploring AI NFTs."
            linkHref="/dashboard"
            linkText="Go to Dashboard"
          />

          {/* Step 2 */}
          <StepItem
            icon={<Wand2 className="h-7 w-7 text-white" />}
            title="Mint Your AI NFT"
            description="Craft unique NFTs using advanced AI generation. Pay with tokens or 100 XP to finalize minting."
            linkHref="/mint"
            linkText="Mint AI NFT"
          />

          {/* Step 3 */}
          <StepItem
            icon={<Coins className="h-7 w-7 text-white" />}
            title="Stake or Sell"
            description="Lock up your NFT in the Staking Pool for extra XP rewards, or list it on the Marketplace to trade."
            linkHref="/stake"
            linkText="Stake NFTs"
          />

          {/* Step 4 */}
          <StepItem
            icon={<Code2 className="h-7 w-7 text-white" />}
            title="Integrate & Expand"
            description="Use our public APIs to read attributes and XP for your NFTs, embedding them into your games or apps."
            linkHref="/leaderboard"
            linkText="Leaderboard"
          />
        </div>
      </div>
    </section>
  )
}

/**
 * A reusable StepItem component for each step in the timeline.
 */
function StepItem({
  icon,
  title,
  description,
  linkHref,
  linkText,
}: {
  icon: React.ReactNode
  title: string
  description: string
  linkHref: string
  linkText: string
}) {
  return (
    <motion.div
      className="relative flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      style={{ zIndex: 2 }} // ensures step circles appear above the line
    >
      {/* Circle Icon with a subtle glow */}
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg ring-2 ring-offset-2 ring-offset-background ring-primary transition-transform hover:scale-110">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">{title}</h3>
      <p className="mb-3 max-w-xs text-sm leading-relaxed text-muted-foreground sm:text-base">
        {description}
      </p>
      <Link href={linkHref} className="text-sm font-medium text-primary hover:underline">
        {linkText}
      </Link>
    </motion.div>
  )
}