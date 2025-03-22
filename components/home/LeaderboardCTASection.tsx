"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export default function LeaderboardCTASection() {
  return (
    <section id='leaderboard-cta' className="px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900">
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
          See which artists and minters are dominating the scene.
          Earn XP, craft phenomenal NFTs, and climb to the top!
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
  )
}