"use client"

import ImageLightbox from "@/components/ui/ImageLightbox"
import Image from "next/image"
import { useState } from "react"

export default function FAQDocsPage() {
  const [open, setOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const images = [
    "/images/faq-visual.png"
  ]

  function handleImageClick() {
    setLightboxIndex(0)
    setOpen(true)
  }

  return (
    <section className="space-y-8">
      <h1 className="text-4xl font-extrabold text-primary">Frequently Asked Questions</h1>
      <p className="text-lg text-foreground leading-relaxed">
        Below are some of the most common questions about AIPenGuild.
        If you don’t see your question here, please check our <strong>Overview</strong> or <strong>User Guide</strong> sections, or ask the community.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column FAQ List */}
        <div className="flex flex-col gap-6">
          {/* Q1 */}
          <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
            <h2 className="text-xl font-bold text-primary mb-2">1. What is the Leaderboard?</h2>
            <p className="text-base text-foreground leading-relaxed">
              The Leaderboard is a real-time ranking of users based on their total XP. Each
              NFT you own contributes XP. Higher XP translates to a higher rank, unlocking
              special titles in the process.
            </p>
          </div>

          {/* Q2 */}
          <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
            <h2 className="text-xl font-bold text-primary mb-2">2. What are Titles?</h2>
            <p className="text-base text-foreground leading-relaxed">
              Titles are milestones displayed on your profile or on the Leaderboard.
              For instance, after earning a certain amount of XP, you might become an
              <em> “Adept”</em> or <em>“Expert.”</em> These provide a fun badge of honor.
            </p>
          </div>

          {/* Q3 */}
          <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
            <h2 className="text-xl font-bold text-primary mb-2">3. How is XP distributed?</h2>
            <p className="text-base text-foreground leading-relaxed">
              Each minted NFT includes a random XP between 1 and 100. Owning that NFT
              automatically adds its XP to your total. If you sell or transfer the NFT,
              that XP transfers to the new owner.
            </p>
          </div>

          {/* Q4 */}
          <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
            <h2 className="text-xl font-bold text-primary mb-2">4. What is the Dashboard for?</h2>
            <p className="text-base text-foreground leading-relaxed">
              The Dashboard is your personal control center: track your total XP, see how many
              NFTs you’ve minted or staked, and review your marketplace listings. It’s perfect
              for staying on top of all your AIPenGuild activity.
            </p>
          </div>
        </div>

        {/* Right Column FAQ List + Images */}
        <div className="flex flex-col gap-6">
          {/* Q5 */}
          <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
            <h2 className="text-xl font-bold text-primary mb-2">5. Admin Panel Purpose?</h2>
            <p className="text-base text-foreground leading-relaxed">
              The Admin Panel is for the contract owner to withdraw funds from the
              <em>PlatformRewardPool</em>. Regular users typically won’t have access,
              ensuring the platform’s treasury remains secure.
            </p>
          </div>

          {/* Q6 */}
          <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
            <h2 className="text-xl font-bold text-primary mb-2">6. Is NFT Staking supported?</h2>
            <p className="text-base text-foreground leading-relaxed">
              Yes. By staking your NFTs in the <em>NFTStakingPool</em>, you earn ongoing XP
              based on <code>xpPerSecond</code>. This encourages long-term engagement and
              participation.
            </p>
          </div>

          {/* Q7 */}
          <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
            <h2 className="text-xl font-bold text-primary mb-2">7. How do I use AIPenGuild effectively?</h2>
            <p className="text-base text-foreground leading-relaxed">
              Start by connecting your wallet, mint an AI NFT, stake it for XP or sell it
              on the marketplace, and keep track of your progress on the Dashboard or
              Leaderboard. For deeper integration or custom usage, see the Developer APIs.
            </p>
          </div>

          {/* Q8 */}
          <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
            <h2 className="text-xl font-bold text-primary mb-2">8. Developer APIs?</h2>
            <p className="text-base text-foreground leading-relaxed">
              Absolutely. We provide user-friendly REST endpoints for fetching NFT attributes,
              user XP, stake statuses, sale information, and more. Check out the
              <strong> Developer APIs</strong> section to see sample requests and cURL commands.
            </p>
          </div>

          <div className="flex justify-center mt-4">
            <Image
              src={images[0]}
              alt="FAQ Illustration"
              width={300}
              height={200}
              className="rounded-md border border-border shadow-sm cursor-pointer"
              onClick={handleImageClick}
            />
          </div>
        </div>
      </div>

      <ImageLightbox
        images={images}
        open={open}
        onClose={() => setOpen(false)}
        startIndex={lightboxIndex}
      />
    </section>
  )
}