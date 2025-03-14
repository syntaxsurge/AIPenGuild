"use client"
import HeroSection from "@/sections/home/Hero"
import Image from "next/image"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function Home() {
  return (
    <>
      <HeroSection />

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
            Explore a curated selection of next-gen AI-generated NFTs minted on AIPenGuild.
          </motion.p>
          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {["featured1.png", "featured2.png", "featured3.png"].map((src, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-lg border border-border p-2"
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

      {/* Promotional Info / Roadmap Teaser */}
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
                AIPenGuild empowers creators and collectors with advanced AI generation and frictionless blockchain integration. Unleash your creativity and discover immersive digital art experiences.
              </p>
              <ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground sm:text-base">
                <li>Cross-chain compatibility with Polkadot ecosystem</li>
                <li>Cutting-edge AI-based NFT generation</li>
                <li>Robust reward system for active participants</li>
              </ul>
            </div>
            <div className="relative h-48 w-full overflow-hidden rounded-md sm:h-64">
              <Image
                src="/why_AIPenGuild.jpg"
                alt="Why AIPenGuild"
                fill
                className={cn("object-cover")}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Check the Latest Rankings */}
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
            See which artists and minters are topping the AIPenGuild charts. Earn XP, create masterpieces, and climb to the top!
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

      {/* Westend Test Network Section (Modernized) */}
      <section className="relative w-full px-4 py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-b from-secondary to-secondary/50 dark:from-gray-800 dark:to-gray-700 text-foreground">
        <div className="mx-auto max-w-5xl rounded-xl bg-white dark:bg-gray-900 p-6 md:p-10 shadow-lg">
          <h2 className="mb-6 text-center text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl">
            About Westend Test Network
          </h2>
          <p className="mx-auto mb-6 max-w-3xl text-center text-base sm:text-lg text-muted-foreground">
            AIPenGuild utilizes the Westend testnet (a Polkadot test environment) so you can explore
            AI-driven NFT minting, trading, and staking without risking real assets.
          </p>
          <div className="mx-auto max-w-3xl space-y-4 text-sm text-foreground sm:text-base">
            <div className="flex items-start gap-3 rounded-lg bg-accent p-4 text-accent-foreground">
              <strong className="min-w-[2rem] text-lg">1.</strong>
              <div>
                <strong>Connect to Westend:</strong> Configure your wallet (e.g., Talisman or MetaMask bridging solution)
                with the Westend AssetHub chain ID <code className="font-mono text-xs">420420421</code>.
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-accent p-4 text-accent-foreground">
              <strong className="min-w-[2rem] text-lg">2.</strong>
              <div>
                <strong>Request Test Tokens:</strong> Get WND tokens from any Westend faucet or from the Polkadot community.
                These tokens cover transaction fees so you can test freely.
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-accent p-4 text-accent-foreground">
              <strong className="min-w-[2rem] text-lg">3.</strong>
              <div>
                <strong>Start Building:</strong> Experiment with AI NFT creation, listing, and more on AIPenGuild—
                all without risking real funds. Push the boundaries of art and tech synergy.
              </div>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">
            For full documentation or support, hop into our Discord and read our official guide.
            <br />
            Happy minting and exploring on the AIPenGuild Westend test network!
          </p>
        </div>
      </section>
    </>
  )
}