"use client"
import HeroSection from "@/sections/home/Hero"
import Image from "next/image"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function Home() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const logoSrc = mounted && resolvedTheme === "dark" ? "/moonbase-logo-white.png" : "/moonbase-logo-black.png"

  return (
    <>
      {/* Hero Section */}
      <HeroSection />
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-primary">Watch Our Introduction</h2>
            <p className="mt-2 text-muted-foreground">Learn more about AIPenGuild in this short video.</p>
            <div className="mt-6 text-center">
              <Link
                href="https://www.canva.com/design/DAGhvgXMfyQ/4wb7P2oUgSfPZp8zXUN8xA/edit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md bg-highlight px-6 py-3 font-semibold text-white hover:bg-highlight/90 transition"
              >
                View Pitch Deck
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
            {["marketplace/nft-1.png", "marketplace/nft-2.png", "marketplace/nft-3.png"].map((src, idx) => (
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

      {/* Promotional Info / Why AIPenGuild */}
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
                src="/why-aipenguild.png"
                alt="Why AIPenGuild"
                fill
                className={cn("object-cover")}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Creator/Minter Rankings */}
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
            href="/ranking/creator"
            className="inline-block rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Creator Highlights
          </Link>
          <Link
            href="/ranking/minter"
            className="ml-3 inline-block rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Minter Stats
          </Link>
        </div>
      </section>

      {/* Moonbase Test Network Section - Modernized */}
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
    </>
  )
}