'use client'

import { motion } from "framer-motion"

export default function WhatIsAIPenGuildSection() {
  return (
    <section
      id='what-is-aipenguild'
      className='bg-white dark:bg-gray-900 px-4 py-12 sm:py-16 md:py-20 lg:py-24'
    >
      <div className='mx-auto max-w-6xl'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className='mx-auto max-w-prose text-center'
        >
          <h2 className='mb-4 text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl break-words'>
            What is AIPenGuild?
          </h2>
          <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
            AIPenGuild merges the power of AI with decentralized technology,
            letting you create, own, and trade NFTs that come with dynamic,
            game-ready attributes. Whether you’re a seasoned collector,
            a game developer seeking cross-ecosystem items, or a blockchain enthusiast,
            AIPenGuild provides all the tools you need—beautiful AI imagery,
            robust attribute data, staking rewards, and frictionless marketplace transactions.
          </p>
        </motion.div>
      </div>
    </section>
  )
}