'use client'

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { InteractiveHoverButton } from "@/components/ui/interactive-button"
import { cn } from "@/lib/utils"

export default function HeroSection() {
  return (
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
  )
}