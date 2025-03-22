'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

/**
 * A modern, two-column introduction section with a subtle
 * gradient background, unified button styling, and an
 * embedded YouTube video. The left column includes heading,
 * text, and CTA buttons, while the right column has the embed.
 */
export default function IntroductionSection() {
  return (
    <section
      id='introduction'
      className='w-full bg-gradient-to-r from-white to-blue-50 px-4 py-12 dark:from-gray-900 dark:to-gray-800 sm:py-16 md:py-20 lg:py-24'
    >
      <div className='mx-auto flex max-w-6xl flex-col items-center gap-8 md:flex-row'>
        {/* Left Column: Heading, Description, Buttons */}
        <motion.div
          className='flex-1 space-y-6'
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className='text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl'>
            Watch Our Introduction
          </h2>
          <p className='max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base'>
            Learn more about AIPenGuild in this short video. Discover how our AI-driven NFT
            platform, staking rewards, and gamified XP system create a truly immersive experience.
          </p>
          <div className='flex flex-wrap items-center gap-4'>
            <Link
              href='https://www.canva.com/design/DAGhvgXMfyQ/4wb7P2oUgSfPZp8zXUN8xA/edit'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'
            >
              View Pitch Deck
            </Link>
            <Link
              href='https://github.com/syntaxsurge/AIPenGuild'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'
            >
              GitHub Repository
            </Link>
            <Link
              href='https://www.youtube.com/watch?v=gvjl6qbt35s'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'
            >
              YouTube Demo
            </Link>
          </div>
        </motion.div>

        {/* Right Column: YouTube Video Embed */}
        <motion.div
          className='relative h-[220px] w-full overflow-hidden rounded-lg shadow-md sm:h-[320px] md:h-[380px] md:flex-1'
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <iframe
            className='absolute left-0 top-0 h-full w-full'
            src='https://www.youtube.com/embed/gvjl6qbt35s'
            title='YouTube video player'
            frameBorder='0'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          ></iframe>
        </motion.div>
      </div>
    </section>
  )
}
