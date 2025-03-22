"use client"

import CallToActionSection from "@/components/home/CallToActionSection"
import FAQSection from "@/components/home/FAQSection"
import FeaturedAICreationsSection from "@/components/home/FeaturedAICreationsSection"
import GallerySection from "@/components/home/GallerySection"
import GettingStartedSection from "@/components/home/GettingStartedSection"
import HeroSection from "@/components/home/HeroSection"
import IntroductionSection from "@/components/home/IntroductionSection"
import KeyFeaturesSection from "@/components/home/KeyFeaturesSection"
import WhatIsAIPenGuildSection from "@/components/home/WhatIsAIPenGuildSection"
import WorkflowOverviewSection from "@/components/home/WorkflowOverviewSection"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* What is AIPenGuild */}
      <WhatIsAIPenGuildSection />

      {/* Key Features */}
      <KeyFeaturesSection />

      {/* Introduction Section (restored) */}
      <IntroductionSection />

      {/* Featured AI Creations Section (restored) */}
      <FeaturedAICreationsSection />

      {/* FAQ Section (restored) */}
      <FAQSection />

      {/* Workflow Overview */}
      <WorkflowOverviewSection />

      {/* Gallery */}
      <GallerySection />

      {/* Getting Started */}
      <GettingStartedSection />

      {/* "Why AIPenGuild?" Section */}
      <section
        id="why-aipenguild"
        className="px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50 dark:bg-gray-800"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="grid grid-cols-1 gap-8 md:grid-cols-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col justify-center space-y-4">
              <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
                Why AIPenGuild?
              </h2>
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
                sizes="(max-width: 768px) 100vw,
                       (max-width: 1200px) 50vw,
                       33vw"
                className={cn("object-cover")}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Leaderboard + Dashboard CTA */}
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

      {/* Call to Action */}
      <CallToActionSection />
    </>
  )
}