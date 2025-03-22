"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export default function GallerySection() {
  return (
    <section
      id='gallery'
      className='px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50 dark:bg-gray-800'
    >
      <div className='mx-auto max-w-6xl'>
        <motion.div
          className='mb-6 max-w-prose text-center mx-auto'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className='text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl break-words'>
            In-Action Screenshots
          </h2>
          <p className='mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base'>
            A glimpse of AIPenGuild in motion—experience unique AI NFT generation,
            user dashboards, staking pages, and on-chain metadata explorers.
          </p>
        </motion.div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3'>
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <motion.div
              key={idx}
              className='relative h-44 w-full overflow-hidden rounded-md bg-secondary transition hover:shadow-lg'
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Image
                src={`/images/screenshots/screenshot-${idx}.png`}
                alt={`Screenshot ${idx}`}
                fill
                sizes='(max-width: 768px) 100vw,
                       (max-width: 1200px) 50vw,
                       33vw'
                className='object-cover'
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}