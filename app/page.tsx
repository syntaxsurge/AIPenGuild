'use client'

import Image from "next/image"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { InteractiveHoverButton } from "@/components/ui/interactive-button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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

      {/* FAQ Section */}
      <section
        className="relative px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900"
        data-aos="fade-up"
      >
        <div className="mx-auto max-w-6xl space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary text-center mb-8">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto max-w-3xl text-center text-muted-foreground mb-6">
            Expand each question to learn more about how AIPenGuild works.
          </p>

          <div className="max-w-4xl mx-auto">
            <div className="mt-6">
              <div className="bg-accent/10 rounded-lg p-4 md:p-6">
                <div className="w-full space-y-2">
                  <Accordion type="multiple" className="w-full space-y-2">

                    {/* Leaderboard */}
                    <AccordionItem value="leaderboard">
                      <AccordionTrigger className="text-base md:text-lg font-semibold">
                        1. What is the Leaderboard?
                      </AccordionTrigger>
                      <AccordionContent className="mt-2 text-sm md:text-base text-muted-foreground">
                        The Leaderboard ranks users by their total Experience (XP).
                        Every time you mint a new NFT, random XP (between 1 and 100)
                        is assigned to that item. As you accumulate more NFTs,
                        your total XP increases. The Leaderboard showcases who has
                        accrued the highest XP on AIPenGuild.
                      </AccordionContent>
                    </AccordionItem>

                    {/* Titles */}
                    <AccordionItem value="titles">
                      <AccordionTrigger className="text-base md:text-lg font-semibold">
                        2. What are Titles?
                      </AccordionTrigger>
                      <AccordionContent className="mt-2 text-sm md:text-base text-muted-foreground space-y-3">
                        <p>
                          Titles are fun designations displayed on your profile
                          or in the Leaderboard once you pass certain XP milestones. For
                          example, if your XP surpasses a specific threshold, you might
                          see <em>&quot;Enthusiast&quot;</em> next to your name. Below is an example
                          table of the title tiers currently recognized on the platform:
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm md:text-base border border-border">
                            <thead className="bg-secondary text-secondary-foreground">
                              <tr>
                                <th className="px-4 py-2">Title</th>
                                <th className="px-4 py-2">XP Range</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="even:bg-accent/5">
                                <td className="px-4 py-2">Explorer</td>
                                <td className="px-4 py-2">1 - 99</td>
                              </tr>
                              <tr className="even:bg-accent/5">
                                <td className="px-4 py-2">Enthusiast</td>
                                <td className="px-4 py-2">100 - 299</td>
                              </tr>
                              <tr className="even:bg-accent/5">
                                <td className="px-4 py-2">Connoisseur</td>
                                <td className="px-4 py-2">300 - 499</td>
                              </tr>
                              <tr className="even:bg-accent/5">
                                <td className="px-4 py-2">Master</td>
                                <td className="px-4 py-2">500+</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p>
                          Tiers can be updated in future versions but currently remain as above.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    {/* XP / Experience Distribution */}
                    <AccordionItem value="xp-distribution">
                      <AccordionTrigger className="text-base md:text-lg font-semibold">
                        3. How is XP distributed?
                      </AccordionTrigger>
                      <AccordionContent className="mt-2 text-sm md:text-base text-muted-foreground">
                        The XP assigned for each newly minted NFT is random (ranging from
                        1 to 100). This random XP value is stored in the <code>AIExperience</code>
                        contract. When you own a newly minted NFT, that random XP is credited
                        to your address. The XP updates automatically if you transfer or sell
                        the NFT to someone else. It&apos;s all governed by that random assignment in the
                        smart contract.
                      </AccordionContent>
                    </AccordionItem>

                    {/* Dashboard */}
                    <AccordionItem value="dashboard">
                      <AccordionTrigger className="text-base md:text-lg font-semibold">
                        4. What is the Dashboard used for?
                      </AccordionTrigger>
                      <AccordionContent className="mt-2 text-sm md:text-base text-muted-foreground">
                        The &quot;Dashboard&quot; is your personalized view for tracking
                        all your stats on AIPenGuild: total XP, number of NFTs minted,
                        NFTs listed for sale, and more. It provides a quick snapshot
                        of your entire experience within the platform.
                      </AccordionContent>
                    </AccordionItem>

                    {/* Admin Panel */}
                    <AccordionItem value="admin">
                      <AccordionTrigger className="text-base md:text-lg font-semibold">
                        5. What can I do in the Admin Panel?
                      </AccordionTrigger>
                      <AccordionContent className="mt-2 text-sm md:text-base text-muted-foreground">
                        The Admin Panel is primarily for platform maintainers or the contract
                        owner. In the current implementation, the main admin action is to
                        withdraw (or manage) funds from the reward pool.
                      </AccordionContent>
                    </AccordionItem>

                    {/* Step-by-Step */}
                    <AccordionItem value="usage-guide">
                      <AccordionTrigger className="text-base md:text-lg font-semibold">
                        6. Step-by-step: How do I use AIPenGuild?
                      </AccordionTrigger>
                      <AccordionContent className="mt-2 text-sm md:text-base text-muted-foreground space-y-3">
                        <ol className="list-decimal list-inside ml-4">
                          <li>
                            <strong>Connect your Wallet</strong> to Moonbase Alpha (or the supported
                            chain) so you can interact with the smart contracts.
                          </li>
                          <li>
                            <strong>Mint an AI NFT</strong> by going to &quot;Mint&quot;. Provide a
                            text prompt or upload your own file. Finalize with a wallet transaction.
                          </li>
                          <li>
                            <strong>List or Unlist NFTs</strong> on &quot;My NFTs.&quot; Specify a
                            sale price if you&apos;d like to sell.
                          </li>
                          <li>
                            <strong>Buy NFTs</strong> in the &quot;Marketplace.&quot; Approve the
                            purchase in your wallet. Ownership (and XP) will transfer to you.
                          </li>
                          <li>
                            <strong>Track your XP &amp; Title</strong> in the &quot;Leaderboard&quot;
                            or &quot;Dashboard.&quot; You will see your total XP and the title you have earned.
                          </li>
                          <li>
                            <strong>Admin Panel</strong> (if you have access) to manage reward pool
                            funds or collection parameters.
                          </li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                  </Accordion>
                </div>
              </div>
            </div>
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
    </>
  )
}