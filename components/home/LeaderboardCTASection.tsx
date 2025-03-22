'use client'

import Image from 'next/image'
import Link from 'next/link'

import { motion } from 'framer-motion'

/**
 * Modified "Check the Latest Ranking" section to have a unique,
 * modern layout distinct from the final "Call to Action" section.
 * Now uses a gradient background and a two-column style with
 * an illustrative image on the right, plus text/buttons on the left.
 */
export default function LeaderboardCTASection() {
  return (
    <section
      id='leaderboard-cta'
      className='relative w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-12 text-white sm:py-16 md:py-20 lg:py-24'
    >
      <div className='mx-auto flex max-w-6xl flex-col items-start justify-center gap-8 md:flex-row'>
        {/* Left Column: Heading, Subtitle, Buttons */}
        <div className='flex flex-1 flex-col justify-center space-y-5'>
          <motion.h2
            className='text-3xl font-extrabold sm:text-4xl md:text-5xl'
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            Check the Latest Rankings
          </motion.h2>
          <motion.p
            className='max-w-md text-sm leading-relaxed text-white/90 sm:text-base'
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            Dive into our Leaderboard to see which collectors and creators are dominating the XP
            race. Rank up by minting NFTs, staking them, or trading to grow your XP—and become an
            AIPenGuild legend!
          </motion.p>
          <motion.div
            className='mt-4 flex flex-wrap gap-4'
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Link
              href='/leaderboard'
              className='inline-block rounded-md border border-white bg-white/0 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10'
            >
              Leaderboard
            </Link>
            <Link
              href='/dashboard'
              className='inline-block rounded-md border border-white bg-white/0 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10'
            >
              Dashboard
            </Link>
          </motion.div>
        </div>

        {/* Right Column: Decorative Image */}
        <motion.div
          className='relative h-64 w-full flex-1 overflow-hidden rounded-xl md:h-72 lg:h-80'
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src='/images/hero/running-characters.gif'
            alt='Leaderboard Illustration'
            fill
            sizes='(max-width: 768px) 100vw,
                   (max-width: 1200px) 50vw,
                   33vw'
            className='object-cover'
          />
        </motion.div>
      </div>
    </section>
  )
}
