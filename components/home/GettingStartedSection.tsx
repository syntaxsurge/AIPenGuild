"use client"

import { motion } from "framer-motion"
import { Code2, Coins, Wallet, Wand2 } from "lucide-react"
import Link from "next/link"

/**
 * A modern, horizontal timeline approach for "Getting Started",
 * placing a center line behind the steps. The icons are placed
 * in normal flow at the top of each step, ensuring no overlap
 * with text. Each step includes icon, title, description, link,
 * aligned in a row on larger screens.
 *
 * The line is absolutely placed at mid-height, while steps are
 * in normal flow with higher z-index to appear above the line.
 * The icon is not absolute, avoiding any overlap on the text below.
 */
export default function GettingStartedSection() {
  return (
    <section
      id="getting-started"
      className="w-full px-4 py-12 sm:py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
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
            Connect your wallet, mint AI-driven NFTs, stake or sell them
            on our marketplace, and seamlessly integrate with other dApps
            or games. Begin your journey in a few simple steps!
          </p>
        </motion.div>

        {/**
          Timeline container:
           - horizontal layout with 4 steps
           - a line behind them at mid-height
           - each step is z-10 so icons & text appear above line
        */}
        <div className="relative mt-10 flex flex-col items-center gap-8 md:flex-row md:justify-between md:gap-0">
          {/* Horizontal line in the middle */}
          <div
            className="absolute left-0 right-0 top-1/2 h-[2px] bg-border"
            style={{ zIndex: 1, transform: "translateY(-50%)" }}
          />

          <Step
            icon={<Wallet className="h-8 w-8 text-white" />}
            title="Connect Your Wallet"
            description="Set up for Moonbase Alpha or Westend, then link your wallet with AIPenGuild for AI-based NFT creation.  Be sure to grab free DEV tokens from the official Moonbeam Faucet if needed: https://faucet.moonbeam.network/"
            linkHref="/dashboard"
            linkText="Go to Dashboard"
            delay={0}
          />
          <Step
            icon={<Wand2 className="h-8 w-8 text-white" />}
            title="Mint AI NFT"
            description="Generate your NFT with advanced AI prompts. Pay with tokens or burn 100 XP to finalize."
            linkHref="/mint"
            linkText="Mint AI NFT"
            delay={0.1}
          />
          <Step
            icon={<Coins className="h-8 w-8 text-white" />}
            title="Stake or Sell"
            description="Lock your NFT in our Staking Pool for passive XP earnings, or list it on the Marketplace to trade."
            linkHref="/stake"
            linkText="Stake NFTs"
            delay={0.2}
          />
          <Step
            icon={<Code2 className="h-8 w-8 text-white" />}
            title="Integrate &amp; Expand"
            description="Leverage our public APIs to fetch NFT attributes, user XP, and more—perfect for any dApp or game."
            linkHref="/leaderboard"
            linkText="Leaderboard"
            delay={0.3}
          />
        </div>
      </div>
    </section>
  )
}

/**
 * Single Step component in normal flow, no absolute icon, ensuring
 * the icon does not overlap text. Each step has a circle for the icon
 * on top, then title, description, and link.
 */
function Step({
  icon,
  title,
  description,
  linkHref,
  linkText,
  delay,
}: {
  icon: React.ReactNode
  title: string
  description: string
  linkHref: string
  linkText: string
  delay?: number
}) {
  return (
    <motion.div
      className="relative z-10 flex w-full max-w-[220px] flex-col items-center text-center md:w-auto"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      {/* Icon circle (no absolute, so no overlap) */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg ring-2 ring-offset-2 ring-offset-background ring-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
        {title}
      </h3>
      <p className="mb-3 max-w-[240px] text-sm leading-relaxed text-muted-foreground sm:text-base">
        {description}
      </p>
      <Link href={linkHref} className="text-sm font-medium text-primary hover:underline">
        {linkText}
      </Link>
    </motion.div>
  )
}