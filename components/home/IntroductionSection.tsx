"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export default function IntroductionSection() {
  return (
    <section id='introduction' className='py-12 bg-white dark:bg-gray-900'>
      <div className='mx-auto max-w-6xl px-4'>
        <div className='mb-8 text-center'>
          <h2 className='text-3xl font-extrabold text-primary'>Watch Our Introduction</h2>
          <p className='mt-2 text-muted-foreground'>
            Learn more about AIPenGuild in this short video.
          </p>
          <div className='mt-6 flex flex-wrap items-center justify-center gap-4'>
            <Link
              href='https://www.canva.com/design/DAGhvgXMfyQ/4wb7P2oUgSfPZp8zXUN8xA/edit'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block rounded-md bg-highlight px-6 py-3 font-semibold text-white hover:bg-highlight/90 transition'
            >
              View Pitch Deck
            </Link>
            <Link
              href='https://github.com/syntaxsurge/AIPenGuild'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition'
            >
              GitHub Repository
            </Link>
            <Link
              href='https://www.youtube.com/watch?v=MH4DsjtsO8c'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block rounded-md bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 transition'
            >
              YouTube Demo
            </Link>
          </div>
        </div>
        <div className='relative pb-[56.25%] overflow-hidden rounded-lg shadow-lg'>
          <iframe
            className='absolute top-0 left-0 w-full h-full'
            src='https://www.youtube.com/embed/MH4DsjtsO8c'
            title='YouTube video player'
            frameBorder='0'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </section>
  )
}