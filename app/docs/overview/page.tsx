'use client'

import Image from 'next/image'
import { useState } from 'react'
import ImageLightbox from '@/components/ui/ImageLightbox'

export default function OverviewWithLightbox() {
  const [open, setOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // We'll maintain an array of images for the lightbox.
  // The first is the homepage screenshot, the second is the overall architecture.
  const images = ['/images/screenshots/homepage-overview.png', '/images/AIPenGuild-Overall-Architecture.png']

  // handleClick function for each image by index
  function handleClick(index: number) {
    setLightboxIndex(index)
    setOpen(true)
  }

  return (
    <section className='space-y-8'>
      <div className='flex flex-col-reverse items-center gap-8 md:flex-row'>
        {/* Text Column */}
        <div className='md:w-1/2'>
          <h1 className='mb-4 text-4xl font-extrabold text-primary'>Welcome to the AIPenGuild Documentation</h1>
          <p className='mb-4 text-lg leading-relaxed text-foreground'>
            Experience the power of AI-driven NFT creation and learn how to integrate these robust assets into your dApp
            or game. Whether you are a user trying to mint your first AI NFT or a developer exploring cross-chain
            potential, this is your launchpad.
          </p>
          <p className='mb-4 text-lg leading-relaxed text-foreground'>
            In this documentation, we’ll guide you through connecting your wallet, minting AI NFTs, staking them for XP,
            and exploring our dedicated marketplace. If you're a developer, you’ll discover the best practices for
            harnessing our REST APIs to fetch NFT data, user XP, and more—integrating it seamlessly into your own
            ecosystem.
          </p>
        </div>

        {/* Image Column */}
        <div className='flex justify-center md:w-1/2'>
          <Image
            src={images[0]}
            alt='Homepage Overview'
            width={500}
            height={350}
            className='cursor-pointer rounded-md border border-border object-cover shadow-sm'
            onClick={() => handleClick(0)}
          />
        </div>
      </div>

      {/* Embedded Video Example */}
      <div className='flex flex-col items-center gap-4 md:flex-row md:items-start'>
        <div className='space-y-4 md:w-1/2'>
          <h2 className='text-3xl font-bold text-primary'>Intro Video</h2>
          <p className='text-lg leading-relaxed text-foreground'>
            Check out this short overview of AIPenGuild in action. See how NFT creation, staking, and the marketplace
            come together to form a cohesive, AI-driven ecosystem.
          </p>
        </div>
        <div className='relative mt-4 h-64 w-full md:mt-0 md:w-1/2'>
          <iframe
            className='absolute left-0 top-0 h-full w-full rounded-md border border-border'
            src='https://www.youtube.com/embed/gvjl6qbt35s'
            title='YouTube video player'
            frameBorder='0'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {/* New Section: Overall Architecture */}
      <div className='space-y-4 rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
        <h2 className='text-2xl font-bold text-primary'>AIPenGuild Overall Architecture</h2>
        <p className='text-base leading-relaxed text-foreground'>
          Below is a visualization of how the entire system fits together: from AI-based NFT creation and IPFS storage,
          to staking, marketplace features, XP tracking, and cross-chain interoperability. This diagram provides a
          broader look at AIPenGuild's core contracts and their interactions.
        </p>
        <div className='flex justify-center'>
          <Image
            src={images[1]}
            alt='AIPenGuild Overall Architecture'
            width={600}
            height={350}
            className='cursor-pointer rounded-md border border-border shadow-sm'
            onClick={() => handleClick(1)}
          />
        </div>
      </div>

      <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
        <h3 className='mb-3 text-2xl font-bold text-primary'>Highlights:</h3>
        <ul className='list-inside list-disc space-y-2 text-lg text-foreground'>
          <li>AI-driven NFT generation with integrated IPFS metadata</li>
          <li>Gamified XP system allowing user progress across ecosystems</li>
          <li>Marketplace with auto XP transfer &amp; flexible listing</li>
          <li>NFT Staking Pool for continuous XP accrual</li>
        </ul>
      </div>

      <div className='space-y-3'>
        <h2 className='text-3xl font-bold text-primary'>Sections Covered</h2>
        <p className='text-lg leading-relaxed text-foreground'>
          We recommend checking out the following docs pages in order:
        </p>
        <ul className='ml-4 list-inside list-decimal space-y-1 text-lg text-foreground'>
          <li>
            <strong>User Guide</strong> – Learn how to connect, mint, stake, and manage NFTs with an easy interface.
          </li>
          <li>
            <strong>Developer APIs</strong> – Integrate NFT data, staking stats, and XP queries into your own dApp.
          </li>
          <li>
            <strong>FAQ</strong> – Find answers to common questions about the XP system, listing, bridging, and more.
          </li>
        </ul>
      </div>

      {/* Lightbox */}
      <ImageLightbox images={images} open={open} startIndex={lightboxIndex} onClose={() => setOpen(false)} />
    </section>
  )
}
