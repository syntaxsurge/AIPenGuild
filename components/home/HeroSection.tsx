"use client"

import { InteractiveHoverButton } from "@/components/ui/InteractiveButton"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section id="hero" className="w-full bg-background px-4 py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Container: split text on left, images on right */}
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Left side: Text + CTA */}
          <div>
            <motion.h1
              className="mb-4 text-4xl font-extrabold leading-tight text-primary sm:text-5xl md:text-6xl"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              Welcome to AIPenGuild
            </motion.h1>

            <motion.p
              className="mb-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              Create AI-driven NFTs that power your gaming experience—choose from characters,
              game items, or power-ups. All interoperable and fully on-chain.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row sm:items-center sm:gap-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <Link href="/mint">
                <InteractiveHoverButton text="Mint Your First AI NFT" />
              </Link>
            </motion.div>
          </div>

          {/* Right side: Three images side by side */}
          <motion.div
            className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            {/* Card 1: Character */}
            <div className="w-full sm:w-1/3 overflow-hidden rounded-xl border border-border bg-secondary p-4 shadow-md">
              <div className="relative h-48 w-full sm:h-52 md:h-64 lg:h-72">
                <Image
                  src="/images/hero/character.gif"
                  alt="AI Character"
                  fill
                  sizes="(max-width: 768px) 100vw,
                         (max-width: 1200px) 50vw,
                         33vw"
                  className="object-contain"
                />
              </div>
              <p className="mt-2 text-center text-sm font-semibold text-foreground">Character</p>
            </div>

            {/* Card 2: Game Item */}
            <div className="w-full sm:w-1/3 overflow-hidden rounded-xl border border-border bg-secondary p-4 shadow-md">
              <div className="relative h-48 w-full sm:h-52 md:h-64 lg:h-72">
                <Image
                  src="/images/hero/game-item.gif"
                  alt="AI Game Item"
                  fill
                  sizes="(max-width: 768px) 100vw,
                         (max-width: 1200px) 50vw,
                         33vw"
                  className="object-contain"
                />
              </div>
              <p className="mt-2 text-center text-sm font-semibold text-foreground">Game Item</p>
            </div>

            {/* Card 3: Powerup */}
            <div className="w-full sm:w-1/3 overflow-hidden rounded-xl border border-border bg-secondary p-4 shadow-md">
              <div className="relative h-48 w-full sm:h-52 md:h-64 lg:h-72">
                <Image
                  src="/images/hero/powerup.gif"
                  alt="AI Powerup"
                  fill
                  sizes="(max-width: 768px) 100vw,
                         (max-width: 1200px) 50vw,
                         33vw"
                  className="object-contain"
                />
              </div>
              <p className="mt-2 text-center text-sm font-semibold text-foreground">Powerup</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}