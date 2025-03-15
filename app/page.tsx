'use client'

import Image from "next/image"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { InteractiveHoverButton } from "@/components/ui/interactive-button"

export default function Home() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const logoSrc = mounted && resolvedTheme === "dark" ? "/images/moonbase-logo-white.png" : "/images/moonbase-logo-black.png"

  return (
    <>
      {/* Hero Section */}
      <section className="w-full bg-background px-4 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-10 md:flex-row md:gap-6">
          {/* Left side content */}
          <div className="flex-1">
            <motion.h1
              className="mb-4 text-4xl font-extrabold leading-tight text-primary sm:text-5xl md:text-6xl"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              Welcome to AIPenGuild
            </motion.h1>
            <motion.p
              className="mb-6 max-w-md text-base text-muted-foreground sm:text-lg"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              A new era of AI-driven NFTs. Build, collect, and explore imaginative digital assets
              fueled by cutting-edge blockchain technology.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row sm:items-center sm:gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <Link href="/mint">
                <InteractiveHoverButton text="Mint Your First AI NFT" />
              </Link>
            </motion.div>
          </div>

          {/* Right side media */}
          <motion.div
            className="relative h-[600px] w-full flex-1 overflow-hidden rounded-xl sm:h-[600px]"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Image
              src="/images/hero-nft-preview.png"
              alt="AIPenGuild Showcase"
              width={800}
              height={600}
              className={cn("object-cover")}
            />
          </motion.div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-primary">Watch Our Introduction</h2>
            <p className="mt-2 text-muted-foreground">Learn more about AIPenGuild in this short video.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="https://www.canva.com/design/DAGhvgXMfyQ/4wb7P2oUgSfPZp8zXUN8xA/edit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md bg-highlight px-6 py-3 font-semibold text-white hover:bg-highlight/90 transition"
              >
                View Pitch Deck
              </Link>
              <Link
                href="https://github.com/syntaxsurge/AIPenGuild"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition"
              >
                GitHub Repository
              </Link>
              <Link
                href="https://www.youtube.com/watch?v=MH4DsjtsO8c"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 transition"
              >
                YouTube Demo
              </Link>
            </div>
          </div>
          <div className="relative pb-[56.25%] overflow-hidden rounded-lg shadow-lg">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/MH4DsjtsO8c"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* Featured AI NFTs Section */}
      <section className="px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            className="mb-6 text-center text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Featured AI Creations
          </motion.h2>
          <motion.p
            className="mx-auto mb-8 max-w-2xl text-center text-muted-foreground sm:text-lg"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Explore a curated selection of next-gen AI-generated NFTs, minted on AIPenGuild by creative minds worldwide.
          </motion.p>
          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {["images/marketplace/nft-1.png", "images/marketplace/nft-2.png", "images/marketplace/nft-3.png"].map((src, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-lg border border-border p-2 transition-shadow hover:shadow-lg"
              >
                <div className="relative h-56 w-full overflow-hidden rounded-lg sm:h-64 md:h-72">
                  <Image
                    src={`/${src}`}
                    alt={`Featured NFT ${idx + 1}`}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="mt-3 flex flex-col items-start px-2">
                  <h3 className="text-sm font-semibold text-foreground">AI NFT #{idx + 1}</h3>
                  <p className="text-xs text-muted-foreground">by AIPenGuild Creator</p>
                </div>
              </div>
            ))}
          </motion.div>
          <div className="mt-8 text-center">
            <Link
              href="/marketplace"
              className="inline-block rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Why AIPenGuild Section */}
      <section className="px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="grid grid-cols-1 gap-8 md:grid-cols-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col justify-center space-y-4">
              <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">Why AIPenGuild?</h2>
              <p className="text-muted-foreground sm:text-lg">
                AIPenGuild merges advanced AI capabilities with seamless blockchain technology,
                empowering creators to forge unique NFTs and collectors to discover immersive digital art.
              </p>
              <ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground sm:text-base">
                <li>Cross-chain compatibility with Polkadot ecosystem</li>
                <li>Cutting-edge AI-based NFT generation tools</li>
                <li>Reward system incentivizing creators and collectors</li>
              </ul>
            </div>
            <div className="relative h-48 w-full overflow-hidden rounded-md sm:h-64">
              <Image
                src="/images/why-aipenguild.png"
                alt="Why AIPenGuild"
                fill
                className={cn("object-cover")}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-6xl text-center">
          <motion.h2
            className="mb-6 text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Check the Latest Rankings
          </motion.h2>
          <motion.p
            className="mx-auto mb-8 max-w-xl text-muted-foreground sm:text-lg"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            See which artists and minters are dominating the scene. Earn XP, craft phenomenal NFTs, and climb to the top!
          </motion.p>
          <Link
            href="/leaderboard"
            className="inline-block rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Leaderboard
          </Link>
          <Link
            href="/dashboard"
            className="ml-3 inline-block rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Dashboard
          </Link>
        </div>
      </section>

      {/* Moonbase Test Network Section */}
      <section className="relative w-full px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-secondary/20 via-secondary/30 to-secondary/50 dark:from-gray-800/20 dark:via-gray-800/40 dark:to-gray-800/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 rounded-xl p-6 sm:p-12 md:flex-row md:gap-12 md:p-16 shadow-md dark:shadow-none bg-white dark:bg-gray-900">
          {/* Left Side Text */}
          <div className="flex-1">
            <h2 className="mb-4 text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl">
              About Moonbase Test Network
            </h2>
            <p className="mb-6 text-sm sm:text-base text-muted-foreground">
              AIPenGuild leverages the Moonbase Alpha testnet so you can experiment with AI-driven NFT minting, trading, and staking—completely risk-free. Dive into the future of Web3 creation without using real assets.
            </p>
            <div className="space-y-4 sm:text-base text-sm text-foreground">
              <div className="flex items-start gap-3 rounded-lg bg-accent/80 p-4 text-accent-foreground">
                <strong className="min-w-[2rem] text-lg">1.</strong>
                <div>
                  <strong>Connect to Moonbase:</strong> Configure your wallet with the
                  Moonbase Alpha chain ID{" "}
                  <code className="font-mono text-xs">1287</code>.
                  (Example: MetaMask → Custom RPC).
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-accent/80 p-4 text-accent-foreground">
                <strong className="min-w-[2rem] text-lg">2.</strong>
                <div>
                  <strong>Request DEV Tokens:</strong> Grab free DEV tokens from the official{" "}
                  <a
                    href="https://faucet.moonbeam.network/"
                    className="underline hover:opacity-90"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Moonbeam Faucet
                  </a>
                  . These cover gas fees, enabling you to explore at no cost.
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-accent/80 p-4 text-accent-foreground">
                <strong className="min-w-[2rem] text-lg">3.</strong>
                <div>
                  <strong>Start Creating:</strong> Mint AI NFTs, list them, and trade on AIPenGuild
                  with zero financial risk. Push the boundaries of AI and blockchain innovation on
                  Moonbase Alpha.
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm text-muted-foreground sm:text-base">
              Happy minting and exploring on the AIPenGuild Moonbase test network!
            </p>
          </div>
          {/* Right Side Image */}
          <motion.div
            className="relative w-full max-w-[500px] max-h-[500px] aspect-square overflow-hidden rounded-md shadow-xl md:w-1/2"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0">
              <Image
                src={logoSrc}
                alt="Moonbase Test Network"
                fill
                className="object-contain p-2"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl text-center">Frequently Asked Questions</h2>
          <div className="space-y-8 text-sm sm:text-base text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground">1. What is the Leaderboard?</h3>
              <p className="mt-2">
                The Leaderboard ranks users based on their Experience Points (XP) earned through on-chain activities such as minting NFTs, buying, selling, and listing. The user with the highest XP is displayed at the top. The Leaderboard fosters a friendly competition among community members.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground">2. What are Perks or Achievements?</h3>
              <p className="mt-2">
                Perks or Achievements are special titles or benefits granted to users once they reach certain XP milestones or complete specific achievements. For example, you could see achievements like &quot;Rookie Minter,&quot; &quot;Art Connoisseur,&quot; &quot;Marketplace Whale,&quot; or &quot;AI Master.&quot; Each has its own requirements, such as minting a certain number of NFTs, reaching a certain total XP, or completing unique tasks in the platform.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground">3. How much XP do I get for each interaction?</h3>
              <p className="mt-2">
                While the exact XP distribution can be adjusted by the smart contract or via the admin panel, here&apos;s a general guideline:
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Minting a new NFT: <strong>10 XP</strong></li>
                  <li>Listing an NFT for sale: <strong>5 XP</strong></li>
                  <li>Buying an NFT: <strong>5 XP</strong></li>
                  <li>Unlisting an NFT: <strong>1 XP</strong> (if any XP is assigned here, depends on final setting)</li>
                  <li>Being the creator of a sold NFT: <strong>2 XP</strong></li>
                </ul>
                These numbers may vary, but the general idea is that each type of on-chain action grants you a certain amount of XP to reflect your engagement in the ecosystem.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground">4. What is the Dashboard?</h3>
              <p className="mt-2">
                The Dashboard is a centralized location where you can track your personal statistics, including your total XP, number of NFTs minted, items listed or sold, and more. Think of it as your personal control center for everything happening in the AIPenGuild platform.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground">5. What is the Admin Panel?</h3>
              <p className="mt-2">
                The Admin Panel is where authorized administrators or contract owners can manage platform-wide settings. This can include adjusting XP rewards, toggling certain features, managing official NFT collections, or distributing special rewards. If you do not have administrator privileges, you will not be able to see or access this panel. It is meant for platform maintainers to keep the ecosystem balanced and secure.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground">6. Step-by-Step: How do I use the platform effectively?</h3>
              <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                <li><strong>Connect your Wallet:</strong> Ensure you have set your wallet (e.g., Metamask) to the correct test network (like Moonbase Alpha).</li>
                <li><strong>Mint an AI NFT:</strong> Head to &quot;Mint&quot; to generate an AI-based NFT or upload your own art. Confirm the transaction in your wallet.</li>
                <li><strong>List or Unlist NFTs:</strong> On the &quot;My NFTs&quot; page, set a sale price and list items for sale. You can unlist anytime.</li>
                <li><strong>Buy NFTs:</strong> Explore the &quot;Marketplace&quot; to purchase NFTs from other users. Confirm the transaction to finalize the purchase.</li>
                <li><strong>Track XP & Perks:</strong> Visit the &quot;Leaderboard&quot; or your &quot;Dashboard&quot; to view your rank, XP total, and any Achievements you&apos;ve unlocked.</li>
                <li><strong>Admin Panel (If applicable):</strong> If you have admin privileges, go to the &quot;Admin&quot; page to adjust platform settings, XP rates, or manage collections.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}