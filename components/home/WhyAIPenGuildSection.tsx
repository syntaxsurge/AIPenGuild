"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function WhyAIPenGuildSection() {
  return (
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
              AIPenGuild merges advanced AI capabilities with seamless blockchain
              technology, empowering creators to forge unique NFTs and collectors
              to discover immersive digital art.
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
  )
}