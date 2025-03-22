"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

export default function FeaturedAICreationsSection() {
  return (
    <section
      id='featured'
      className='px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900'
    >
      <div className='mx-auto max-w-6xl'>
        <motion.h2
          className='mb-6 text-center text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Featured AI Creations
        </motion.h2>
        <motion.p
          className='mx-auto mb-8 max-w-2xl text-center text-muted-foreground sm:text-lg'
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Explore a curated selection of next-gen AI-generated NFTs, minted on AIPenGuild by creators worldwide.
        </motion.p>
        <motion.div
          className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {["images/hero/character.png", "images/hero/game-item.png", "images/hero/powerup.png"].map(
            (src, idx) => (
              <div
                key={idx}
                className='group relative overflow-hidden rounded-lg border border-border p-2 transition-shadow hover:shadow-lg'
              >
                <div className='relative h-56 w-full overflow-hidden rounded-lg sm:h-64 md:h-72'>
                  <Image
                    src={`/${src}`}
                    alt={`Featured NFT ${idx + 1}`}
                    fill
                    sizes='(max-width: 768px) 100vw,
                           (max-width: 1200px) 50vw,
                           33vw'
                    className='object-cover transition-transform group-hover:scale-105'
                  />
                </div>
                <div className='mt-3 flex flex-col items-start px-2'>
                  <h3 className='text-sm font-semibold text-foreground'>AI NFT #{idx + 1}</h3>
                  <p className='text-xs text-muted-foreground'>by AIPenGuild Creator</p>
                </div>
              </div>
            )
          )}
        </motion.div>
        <div className='mt-8 text-center'>
          <Link
            href='/marketplace'
            className='inline-block rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90'
          >
            Go to Marketplace
          </Link>
        </div>
      </div>
    </section>
  )
}