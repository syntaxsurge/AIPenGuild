"use client"

import { InteractiveHoverButton } from "@/components/ui/InteractiveButton"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section id='hero' className='w-full bg-background px-4 py-12 sm:py-16 md:py-20 lg:py-24'>
      <div className='mx-auto max-w-6xl'>
        {/* Hero Content Wrapper */}
        <div className='flex flex-col-reverse items-center justify-between gap-10 md:flex-row md:gap-6'>

          {/* Left side content */}
          <div className='flex-1'>
            <motion.h1
              className='mb-4 text-4xl font-extrabold leading-tight text-primary sm:text-5xl md:text-6xl break-words'
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              Welcome to AIPenGuild
            </motion.h1>

            <motion.p
              className='mb-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg'
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              A next-gen AI-driven platform where you can mint NFTs with
              special attributes—characters, game items, and powerups—
              for cross-chain gaming experiences.
            </motion.p>

            <motion.div
              className='flex flex-col sm:flex-row sm:items-center sm:gap-4'
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <Link href='/mint'>
                <InteractiveHoverButton text='Mint Your First AI NFT' />
              </Link>
            </motion.div>
          </div>

          {/* Right side: Three images in a "card" arrangement */}
          <div className='relative flex-1 flex items-center justify-center'>
            {/* We can wrap these images in a container with position relative to layer them. */}
            <div className='relative w-[300px] h-[300px] md:w-[380px] md:h-[380px] lg:w-[420px] lg:h-[420px]'>
              {/* Game Item (back-left) */}
              <motion.div
                className='absolute -left-8 top-8 z-0 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40'
                initial={{ opacity: 0, y: 20, x: -10, rotate: -10 }}
                whileInView={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <Image
                  src='/images/hero/game-item.png'
                  alt='AI Game Item'
                  fill
                  sizes='(max-width: 768px) 100vw,
                         (max-width: 1200px) 50vw,
                         33vw'
                  className='object-contain'
                />
              </motion.div>

              {/* Powerup (back-right) */}
              <motion.div
                className='absolute bottom-0 right-[-10%] z-0 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40'
                initial={{ opacity: 0, y: 20, x: 10, rotate: 10 }}
                whileInView={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <Image
                  src='/images/hero/powerup.png'
                  alt='AI Powerup'
                  fill
                  sizes='(max-width: 768px) 100vw,
                         (max-width: 1200px) 50vw,
                         33vw'
                  className='object-contain'
                />
              </motion.div>

              {/* Character (front) */}
              <motion.div
                className='relative z-10 h-full w-full'
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.7 }}
              >
                <Image
                  src='/images/hero/character.png'
                  alt='AI Character'
                  fill
                  sizes='(max-width: 768px) 100vw,
                         (max-width: 1200px) 50vw,
                         33vw'
                  className='object-contain drop-shadow-md'
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}