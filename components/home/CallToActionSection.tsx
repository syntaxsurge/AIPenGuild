"use client"

import Link from "next/link"

export default function CallToActionSection() {
  return (
    <section className='bg-secondary text-secondary-foreground px-4 py-12 sm:py-16 md:py-20 lg:py-24'>
      <div className='mx-auto max-w-6xl text-center'>
        <h2 className='mb-4 text-3xl font-extrabold sm:text-4xl md:text-5xl break-words'>
          Ready to Dive In?
        </h2>
        <p className='mx-auto mb-6 max-w-2xl text-sm leading-relaxed sm:text-base'>
          Experience the future of AI-generated NFTs on AIPenGuild.
          Start minting, staking, and sharing cross-chain assets with ease!
        </p>
        <Link
          href='/mint'
          className='inline-block rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'
        >
          Get Started
        </Link>
      </div>
    </section>
  )
}