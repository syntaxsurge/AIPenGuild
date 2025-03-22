'use client'

import Image from 'next/image'
import { useState } from 'react'

import ImageLightbox from '@/components/ui/ImageLightbox'

export default function DeveloperApisPage() {
  const [open, setOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const images = [
    '/images/AIPenGuild-API-Architecture.png',
    '/images/screenshots/api-terminal-example.png',
  ]

  function handleImageClick(idx: number) {
    setLightboxIndex(idx)
    setOpen(true)
  }

  return (
    <section className='space-y-8'>
      <h1 className='text-4xl font-extrabold text-primary'>Developer APIs</h1>
      <p className='text-lg leading-relaxed text-foreground'>
        AIPenGuild offers straightforward REST endpoints for retrieving NFT data, user XP, staking
        information, minted item details, and more. These endpoints allow your dApp or game to
        communicate seamlessly with the on-chain data stored by AIPenGuild’s contracts. Let’s dive
        in!
      </p>

      <div className='flex flex-col items-center gap-4 md:flex-row'>
        {/* Image left */}
        <div className='flex justify-center md:w-1/2'>
          <Image
            src={images[0]}
            alt='AIPenGuild API Architecture'
            width={400}
            height={250}
            className='cursor-pointer rounded-md border border-border shadow-sm'
            onClick={() => handleImageClick(0)}
          />
        </div>
        {/* Text right */}
        <div className='space-y-3 md:w-1/2'>
          <h2 className='text-2xl font-bold text-primary'>Key Endpoints</h2>
          <p className='text-base leading-relaxed text-foreground'>
            All endpoints are available under{' '}
            <code className='rounded bg-accent/10 px-1'>/api/v1</code>. For chain-specific queries,
            append <code className='rounded bg-accent/10 px-1'>?chainId=1287</code>,
            <code className='rounded bg-accent/10 px-1'>?chainId=420420421</code>, etc.
          </p>
        </div>
      </div>

      <div className='space-y-4 rounded-md border border-border p-4 shadow-sm'>
        <h3 className='text-2xl font-bold text-primary'>AI NFT Generation</h3>
        <p className='text-base leading-relaxed text-foreground'>
          Use our endpoints to generate AI-based attributes, and then store them on-chain.
        </p>

        <div className='space-y-2'>
          <p className='text-base text-foreground'>
            <strong>POST /api/v1/ai-nft</strong>
            <br />
            Basic AI image generation using a text prompt. Returns a generated image URL.
          </p>
          <pre className='whitespace-pre-wrap rounded-md bg-secondary p-3 text-sm text-secondary-foreground'>
            {`curl -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Vibrant cyberpunk samurai with neon aesthetic"}' \\
  https://example.com/api/v1/ai-nft
`}
          </pre>
        </div>

        <div className='space-y-2'>
          <p className='text-base text-foreground'>
            <strong>POST /api/v1/ai-nft/metadata</strong>
            <br />
            Generates LLM-based attributes + an AI image. Perfect for structured NFT creation.
          </p>
          <pre className='whitespace-pre-wrap rounded-md bg-secondary p-3 text-sm text-secondary-foreground'>
            {`curl -X POST \\
  -H "Content-Type: application/json" \\
  -d '{
        "prompt": "Majestic warrior with fiery sword",
        "category": "Character"
      }' \\
  https://example.com/api/v1/ai-nft/metadata
`}
          </pre>
          <p className='text-base text-foreground'>
            Returns JSON with <em>finalReplicatePrompt</em>, refined attributes, and a direct AI
            image URL.
          </p>
        </div>
      </div>

      <div className='space-y-4 rounded-md border border-border p-4 shadow-sm'>
        <h3 className='text-2xl font-bold text-primary'>Gaming &amp; NFT Data</h3>
        <p className='text-base leading-relaxed text-foreground'>
          Fetch comprehensive info for any minted NFT, user holdings, or XP levels.
        </p>

        <div className='space-y-2'>
          <p className='text-base text-foreground'>
            <strong>GET /api/v1/gaming/nft/[tokenId]</strong>
            <br />
            Retrieve on-chain + IPFS metadata for a single NFT, including XP, staking, etc.
          </p>
          <pre className='whitespace-pre-wrap rounded-md bg-secondary p-3 text-sm text-secondary-foreground'>
            {`curl -X GET \\
  https://example.com/api/v1/gaming/nft/42?chainId=1287
`}
          </pre>
        </div>

        <div className='space-y-2'>
          <p className='text-base text-foreground'>
            <strong>GET /api/v1/gaming/user/[address]/nfts</strong>
            <br />
            List all NFTs owned or staked by a specific user address.
          </p>
          <pre className='whitespace-pre-wrap rounded-md bg-secondary p-3 text-sm text-secondary-foreground'>
            {`curl -X GET \\
  https://example.com/api/v1/gaming/user/0x1234abcd.../nfts?chainId=1287
`}
          </pre>
        </div>

        <div className='space-y-2'>
          <p className='text-base text-foreground'>
            <strong>GET /api/v1/gaming/user/[address]/xp</strong>
            <br />
            Fetch numeric XP for a user. Useful for leaderboards or user progression.
          </p>
          <pre className='whitespace-pre-wrap rounded-md bg-secondary p-3 text-sm text-secondary-foreground'>
            {`curl -X GET \\
  https://example.com/api/v1/gaming/user/0x1234abcd.../xp?chainId=1287
`}
          </pre>
        </div>

        <div className='space-y-2'>
          <p className='text-base text-foreground'>
            <strong>GET /api/v1/gaming/titles</strong>
            <br />
            Returns an array of XP tier ranges and labels (e.g., "Newcomer" = 0–99, etc.).
          </p>
          <pre className='whitespace-pre-wrap rounded-md bg-secondary p-3 text-sm text-secondary-foreground'>
            {`curl -X GET https://example.com/api/v1/gaming/titles
`}
          </pre>
        </div>
      </div>

      <div className='my-8 flex flex-col items-center gap-6 md:flex-row'>
        <div className='space-y-3 md:w-1/2'>
          <h2 className='text-2xl font-bold text-primary'>Seamless Integration</h2>
          <p className='text-base leading-relaxed text-foreground'>
            By calling these endpoints, you can easily integrate minted NFTs, attribute data, user
            XP, and marketplace status into your own UI or game logic. Build a rich, dynamic
            experience by leveraging AIPenGuild’s robust API.
          </p>
        </div>
        <div className='flex justify-center md:w-1/2'>
          <Image
            src={images[1]}
            alt='Developer APIs Example'
            width={450}
            height={280}
            className='cursor-pointer rounded-md border border-border shadow-sm'
            onClick={() => handleImageClick(1)}
          />
        </div>
      </div>

      <div className='rounded-md border border-border bg-secondary p-4 text-secondary-foreground shadow-sm'>
        <h3 className='mb-2 text-xl font-bold text-primary'>Summary</h3>
        <p className='text-base leading-relaxed text-foreground'>
          The AIPenGuild API is designed to be flexible yet powerful. Whether you’re building a new
          game on Polkadot or hooking into existing EVM chains, these endpoints open the door to a
          synergy of AI-driven NFT content, staking, and real-time user progression.
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
