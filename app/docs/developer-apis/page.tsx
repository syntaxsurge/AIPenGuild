"use client"

import ImageLightbox from "@/components/ui/ImageLightbox"
import Image from "next/image"
import { useState } from "react"

export default function DeveloperApisPage() {
  const [open, setOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const images = [
    "/images/AIPenGuild-API-Architecture.png",
    "/images/screenshots/api-terminal-example.png"
  ]

  function handleImageClick(idx: number) {
    setLightboxIndex(idx)
    setOpen(true)
  }

  return (
    <section className="space-y-8">
      <h1 className="text-4xl font-extrabold text-primary">Developer APIs</h1>
      <p className="text-lg text-foreground leading-relaxed">
        AIPenGuild offers straightforward REST endpoints for retrieving NFT data,
        user XP, staking information, minted item details, and more. These endpoints
        allow your dApp or game to communicate seamlessly with the on-chain data stored
        by AIPenGuild’s contracts. Let’s dive in!
      </p>

      <div className="flex flex-col items-center gap-4 md:flex-row">
        {/* Image left */}
        <div className="md:w-1/2 flex justify-center">
          <Image
            src={images[0]}
            alt="AIPenGuild API Architecture"
            width={400}
            height={250}
            className="rounded-md border border-border shadow-sm cursor-pointer"
            onClick={() => handleImageClick(0)}
          />
        </div>
        {/* Text right */}
        <div className="md:w-1/2 space-y-3">
          <h2 className="text-2xl font-bold text-primary">Key Endpoints</h2>
          <p className="text-base text-foreground leading-relaxed">
            All endpoints are available under <code className="bg-accent/10 px-1 rounded">/api/v1</code>.
            For chain-specific queries, append <code className="bg-accent/10 px-1 rounded">?chainId=1287</code>,
            <code className="bg-accent/10 px-1 rounded">?chainId=420420421</code>, etc.
          </p>
        </div>
      </div>

      <div className="border border-border rounded-md p-4 shadow-sm space-y-4">
        <h3 className="text-2xl font-bold text-primary">AI NFT Generation</h3>
        <p className="text-base text-foreground leading-relaxed">
          Use our endpoints to generate AI-based attributes, and then store them on-chain.
        </p>

        <div className="space-y-2">
          <p className="text-base text-foreground">
            <strong>POST /api/v1/ai-nft</strong><br />
            Basic AI image generation using a text prompt. Returns a generated image URL.
          </p>
          <pre className="bg-secondary p-3 rounded-md text-sm text-secondary-foreground whitespace-pre-wrap">
            {`curl -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Vibrant cyberpunk samurai with neon aesthetic"}' \\
  https://example.com/api/v1/ai-nft
`}
          </pre>
        </div>

        <div className="space-y-2">
          <p className="text-base text-foreground">
            <strong>POST /api/v1/ai-nft/metadata</strong><br />
            Generates LLM-based attributes + an AI image. Perfect for structured NFT creation.
          </p>
          <pre className="bg-secondary p-3 rounded-md text-sm text-secondary-foreground whitespace-pre-wrap">
            {`curl -X POST \\
  -H "Content-Type: application/json" \\
  -d '{
        "prompt": "Majestic warrior with fiery sword",
        "category": "Character"
      }' \\
  https://example.com/api/v1/ai-nft/metadata
`}
          </pre>
          <p className="text-base text-foreground">
            Returns JSON with <em>finalReplicatePrompt</em>, refined attributes, and a direct AI image URL.
          </p>
        </div>
      </div>

      <div className="border border-border rounded-md p-4 shadow-sm space-y-4">
        <h3 className="text-2xl font-bold text-primary">Gaming &amp; NFT Data</h3>
        <p className="text-base text-foreground leading-relaxed">
          Fetch comprehensive info for any minted NFT, user holdings, or XP levels.
        </p>

        <div className="space-y-2">
          <p className="text-base text-foreground">
            <strong>GET /api/v1/gaming/nft/[tokenId]</strong><br />
            Retrieve on-chain + IPFS metadata for a single NFT, including XP, staking, etc.
          </p>
          <pre className="bg-secondary p-3 rounded-md text-sm text-secondary-foreground whitespace-pre-wrap">
            {`curl -X GET \\
  https://example.com/api/v1/gaming/nft/42?chainId=1287
`}
          </pre>
        </div>

        <div className="space-y-2">
          <p className="text-base text-foreground">
            <strong>GET /api/v1/gaming/user/[address]/nfts</strong><br />
            List all NFTs owned or staked by a specific user address.
          </p>
          <pre className="bg-secondary p-3 rounded-md text-sm text-secondary-foreground whitespace-pre-wrap">
            {`curl -X GET \\
  https://example.com/api/v1/gaming/user/0x1234abcd.../nfts?chainId=1287
`}
          </pre>
        </div>

        <div className="space-y-2">
          <p className="text-base text-foreground">
            <strong>GET /api/v1/gaming/user/[address]/xp</strong><br />
            Fetch numeric XP for a user. Useful for leaderboards or user progression.
          </p>
          <pre className="bg-secondary p-3 rounded-md text-sm text-secondary-foreground whitespace-pre-wrap">
            {`curl -X GET \\
  https://example.com/api/v1/gaming/user/0x1234abcd.../xp?chainId=1287
`}
          </pre>
        </div>

        <div className="space-y-2">
          <p className="text-base text-foreground">
            <strong>GET /api/v1/gaming/titles</strong><br />
            Returns an array of XP tier ranges and labels (e.g., "Newcomer" = 0–99, etc.).
          </p>
          <pre className="bg-secondary p-3 rounded-md text-sm text-secondary-foreground whitespace-pre-wrap">
            {`curl -X GET https://example.com/api/v1/gaming/titles
`}
          </pre>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center my-8">
        <div className="md:w-1/2 space-y-3">
          <h2 className="text-2xl font-bold text-primary">Seamless Integration</h2>
          <p className="text-base text-foreground leading-relaxed">
            By calling these endpoints, you can easily integrate minted NFTs,
            attribute data, user XP, and marketplace status into your own UI or game logic.
            Build a rich, dynamic experience by leveraging AIPenGuild’s robust API.
          </p>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <Image
            src={images[1]}
            alt="Developer APIs Example"
            width={450}
            height={280}
            className="rounded-md border border-border shadow-sm cursor-pointer"
            onClick={() => handleImageClick(1)}
          />
        </div>
      </div>

      <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
        <h3 className="text-xl font-bold mb-2 text-primary">Summary</h3>
        <p className="text-base text-foreground leading-relaxed">
          The AIPenGuild API is designed to be flexible yet powerful. Whether you’re
          building a new game on Polkadot or hooking into existing EVM chains, these
          endpoints open the door to a synergy of AI-driven NFT content, staking,
          and real-time user progression.
        </p>
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