'use client'

import Image from "next/image"
import ImageLightbox from "@/components/ui/ImageLightbox"
import { useState } from "react"

export default function TechnicalArchitecturePage() {
  const [open, setOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // We'll keep the images in an array for a lightbox.
  // This page specifically references the "overall architecture" and "API architecture" images.
  const images = [
    "/images/AIPenGuild-Overall-Architecture.png",
    "/images/AIPenGuild-API-Architecture.png"
  ]

  function handleImageClick(idx: number) {
    setLightboxIndex(idx)
    setOpen(true)
  }

  return (
    <section className="space-y-8">
      <h1 className="text-4xl font-extrabold text-primary">Technical Architecture</h1>
      <p className="text-lg text-foreground leading-relaxed">
        On this page, we consolidate the two main architectural diagrams for AIPenGuild:
        the Overall Architecture and the API Architecture. While these diagrams also
        appear in the <strong>Overview</strong> and <strong>Developer APIs</strong> pages,
        here we provide an additional, dedicated section to explain the system’s
        technical flow in one place.
      </p>

      <div className="space-y-6">
        <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
          <h2 className="text-2xl font-bold text-primary">Overall Architecture</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            This diagram demonstrates how AI-based NFT creation, IPFS storage, on-chain
            XP tracking, marketplace trading, and staking all connect within AIPenGuild.
            Each part of the ecosystem interacts seamlessly to provide a robust user and
            developer experience.
          </p>
          <div className="flex justify-center">
            <Image
              src={images[0]}
              alt="AIPenGuild Overall Architecture"
              width={600}
              height={350}
              className="rounded-md border border-border shadow-sm cursor-pointer"
              onClick={() => handleImageClick(0)}
            />
          </div>
        </div>

        <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
          <h2 className="text-2xl font-bold text-primary">API Architecture</h2>
          <p className="text-base text-foreground leading-relaxed mb-4">
            This separate diagram zooms in on the REST endpoints and data flow for AI-based
            NFT attribute generation, IPFS uploads, and retrieving chain data (e.g., NFT
            metadata, user XP, staking info). Developers can easily integrate these endpoints
            into their dApps or games, ensuring a consistent, cross-chain experience.
          </p>
          <div className="flex justify-center">
            <Image
              src={images[1]}
              alt="AIPenGuild API Architecture"
              width={600}
              height={350}
              className="rounded-md border border-border shadow-sm cursor-pointer"
              onClick={() => handleImageClick(1)}
            />
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={images}
        open={open}
        onClose={() => setOpen(false)}
        startIndex={lightboxIndex}
      />
    </section>
  )
}