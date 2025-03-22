'use client'

import ImageLightbox from "@/components/ui/ImageLightbox"
import { motion } from "framer-motion"
import Image from "next/image"
import { useState } from "react"

export default function WorkflowOverviewSection() {
  // We'll store each step's image URL in an array, for the lightbox usage
  const stepImages = [
    {
      src: "/images/screenshots/generate-nft.png",
      alt: "Generate"
    },
    {
      src: "/images/screenshots/mint-nft.png",
      alt: "Minting"
    },
    {
      src: "/images/screenshots/stake-nft.png",
      alt: "Stake or Trade"
    }
  ]

  // Lightbox state
  const [open, setOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const handleImageClick = (index: number) => {
    setLightboxIndex(index)
    setOpen(true)
  }

  return (
    <section
      id="workflow-overview"
      className="relative w-full px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-prose text-center"
        >
          <h2 className="mb-6 text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl break-words">
            How AIPenGuild Works
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
            From idea to mint, from staking to trading—here&apos;s a quick overview of
            how you can harness the power of AI-driven NFT creation and on-chain XP management.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* 1) Generate NFT */}
          <motion.div
            className="rounded-lg border border-border bg-secondary/10 p-6 transition hover:shadow-lg"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h3 className="mb-3 text-lg font-bold text-foreground">1. Generate NFT</h3>
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground break-words">
              Use LLM-based prompts to define your NFT&apos;s attributes.
              Then Replicate generates a unique image. Store everything on IPFS.
              Your creation is now ready for on-chain minting!
            </p>
            <div
              className="relative h-40 w-full overflow-hidden rounded-md bg-secondary cursor-pointer"
              onClick={() => handleImageClick(0)}
            >
              <Image
                src={stepImages[0].src}
                alt={stepImages[0].alt}
                fill
                sizes="(max-width: 768px) 100vw,
                       (max-width: 1200px) 50vw,
                       33vw"
                className="object-cover"
              />
            </div>
          </motion.div>

          {/* 2) Mint & Acquire XP */}
          <motion.div
            className="rounded-lg border border-border bg-secondary/10 p-6 transition hover:shadow-lg"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h3 className="mb-3 text-lg font-bold text-foreground">2. Mint &amp; Acquire XP</h3>
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground break-words">
              Pay via native tokens or 100 XP to finalize minting.
              Your personal XP is updated once the NFT is yours—an integer between 1 and 100
              unique to that asset.
            </p>
            <div
              className="relative h-40 w-full overflow-hidden rounded-md bg-secondary cursor-pointer"
              onClick={() => handleImageClick(1)}
            >
              <Image
                src={stepImages[1].src}
                alt={stepImages[1].alt}
                fill
                sizes="(max-width: 768px) 100vw,
                       (max-width: 1200px) 50vw,
                       33vw"
                className="object-cover"
              />
            </div>
          </motion.div>

          {/* 3) Stake, Trade, or Integrate */}
          <motion.div
            className="rounded-lg border border-border bg-secondary/10 p-6 transition hover:shadow-lg"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h3 className="mb-3 text-lg font-bold text-foreground">3. Stake, Trade, or Integrate</h3>
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground break-words">
              Stake your NFT for extra XP, sell it on the marketplace, or
              integrate its attributes into external games using our API.
              Enjoy true NFT interoperability backed by on-chain data.
            </p>
            <div
              className="relative h-40 w-full overflow-hidden rounded-md bg-secondary cursor-pointer"
              onClick={() => handleImageClick(2)}
            >
              <Image
                src={stepImages[2].src}
                alt={stepImages[2].alt}
                fill
                sizes="(max-width: 768px) 100vw,
                       (max-width: 1200px) 50vw,
                       33vw"
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Lightbox for the steps */}
      <ImageLightbox
        images={stepImages.map((img) => img.src)}
        open={open}
        onClose={() => setOpen(false)}
        startIndex={lightboxIndex}
      />
    </section>
  )
}