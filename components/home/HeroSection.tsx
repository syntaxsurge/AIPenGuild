"use client"

import { InteractiveHoverButton } from "@/components/ui/InteractiveButton"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full bg-background px-4 py-10 sm:py-14 md:py-16 lg:py-20"
    >
      <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-12 md:flex-row md:gap-8">
        {/* Left: Text + CTA */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="mb-4 text-4xl font-extrabold leading-tight text-primary sm:text-5xl md:text-6xl">
            Welcome to AIPenGuild
          </h1>
          <p className="mb-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Create AI-driven NFTs that power your gaming experience—choose from
            characters, game items, or power-ups. All interoperable and fully on-chain.
          </p>
          <div className="mt-2">
            <Link href="/mint">
              <InteractiveHoverButton text="Mint Your First AI NFT" />
            </Link>
          </div>
        </motion.div>

        {/* Right: Overlapping GIF images */}
        <motion.div
          className="relative flex-1"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="relative h-[400px] w-full max-w-[500px] mx-auto">
            {/* Middle - Character (largest, top layer) */}
            <div className="absolute left-1/2 top-1/2 z-20 h-[220px] w-[180px] -translate-x-1/2 -translate-y-1/2 sm:h-[260px] sm:w-[200px] md:h-[280px] md:w-[220px] lg:h-[320px] lg:w-[240px]">
              <Image
                src="/images/hero/character.gif"
                alt="AI Character"
                fill
                sizes="(max-width: 768px) 100vw,
                       (max-width: 1200px) 50vw,
                       33vw"
                className="object-contain"
                priority
              />
              <p className="absolute bottom-0 left-1/2 w-max -translate-x-1/2 rounded-md bg-secondary/80 px-2 py-1 text-xs font-semibold text-secondary-foreground">
                Character
              </p>
            </div>

            {/* Left - GameItem (smaller, behind) */}
            <div className="absolute left-[5%] top-1/2 z-10 h-[130px] w-[110px] -translate-y-1/2 rotate-[-10deg] sm:h-[150px] sm:w-[130px] md:h-[160px] md:w-[140px] lg:h-[180px] lg:w-[150px]">
              <Image
                src="/images/hero/game-item.gif"
                alt="AI Game Item"
                fill
                sizes="(max-width: 768px) 100vw,
                       (max-width: 1200px) 50vw,
                       33vw"
                className="object-contain"
              />
              <p className="absolute bottom-0 left-1/2 w-max -translate-x-1/2 rounded-md bg-secondary/80 px-2 py-1 text-xs font-semibold text-secondary-foreground">
                Game Item
              </p>
            </div>

            {/* Right - Powerup (smaller, behind) */}
            <div className="absolute right-[5%] top-1/2 z-10 h-[130px] w-[110px] -translate-y-1/2 rotate-6 sm:h-[150px] sm:w-[130px] md:h-[160px] md:w-[140px] lg:h-[180px] lg:w-[150px]">
              <Image
                src="/images/hero/powerup.gif"
                alt="AI Powerup"
                fill
                sizes="(max-width: 768px) 100vw,
                       (max-width: 1200px) 50vw,
                       33vw"
                className="object-contain"
              />
              <p className="absolute bottom-0 left-1/2 w-max -translate-x-1/2 rounded-md bg-secondary/80 px-2 py-1 text-xs font-semibold text-secondary-foreground">
                Powerup
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}