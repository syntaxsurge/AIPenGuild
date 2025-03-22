"use client";

import { motion } from "framer-motion";
import Image from "next/image";

// Screenshots arranged logically to reflect user journey and platform exploration
const screenshots = [
  { src: "homepage-overview.png", alt: "Homepage Overview" }, // Entry point
  { src: "dashboard-overview.png", alt: "Dashboard Overview" }, // User Dashboard
  { src: "generate-nft.png", alt: "Generate NFT" }, // NFT Creation process
  { src: "mint-nft.png", alt: "Mint NFT" }, // NFT Minting process
  { src: "stake-nft.png", alt: "Stake NFT" }, // NFT Staking functionality
  { src: "list-nft.png", alt: "List NFT" }, // Listing NFTs for sale
  { src: "marketplace-overview.png", alt: "Marketplace Overview" }, // Marketplace exploration
  { src: "leaderboard-overview.png", alt: "Leaderboard Overview" }, // User ranking and competition
  { src: "admin-withdraw.png", alt: "Admin Withdraw" }, // Admin operations
];

export default function GallerySection() {
  return (
    <section
      id="gallery"
      className="px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50 dark:bg-gray-800"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-6 max-w-prose text-center mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl break-words">
            In-Action Screenshots
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            A glimpse of AIPenGuild in motion—experience unique AI NFT generation,
            user dashboards, staking pages, and on-chain metadata explorers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {screenshots.map(({ src, alt }, idx) => (
            <motion.div
              key={idx}
              className="relative h-44 w-full overflow-hidden rounded-md bg-secondary transition hover:shadow-lg"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Image
                src={`/images/screenshots/${src}`}
                alt={alt}
                fill
                sizes="(max-width: 768px) 100vw,
                       (max-width: 1200px) 50vw,
                       33vw"
                className="object-cover"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}