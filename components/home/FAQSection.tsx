"use client"

import { motion } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/Accordion"
import { XP_TITLES } from "@/lib/experience"

export default function FAQSection() {
  return (
    <section
      id='faq'
      className='relative px-4 py-12 sm:py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900'
    >
      <div className='mx-auto max-w-6xl space-y-6'>
        <h2 className='text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary text-center mb-8'>
          Frequently Asked Questions
        </h2>
        <p className='mx-auto max-w-3xl text-center text-muted-foreground mb-6'>
          Expand each question to learn more about how AIPenGuild works.
        </p>

        <div className='max-w-4xl mx-auto'>
          <motion.div
            className='bg-accent/10 rounded-lg p-4 md:p-6'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Accordion type='multiple' className='w-full space-y-2'>
              {/* Leaderboard */}
              <AccordionItem value='leaderboard'>
                <AccordionTrigger className='text-base md:text-lg font-semibold'>
                  1. What is the Leaderboard?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm md:text-base text-muted-foreground'>
                  The Leaderboard ranks users by their total Experience (XP). Every time
                  you mint a new NFT, random XP (between 1 and 100) is assigned to that
                  item. As you accumulate more NFTs, your total XP increases. The
                  Leaderboard showcases who has accrued the highest XP on AIPenGuild.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='titles'>
                <AccordionTrigger className='text-base md:text-lg font-semibold'>
                  2. What are Titles?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm md:text-base text-muted-foreground space-y-3'>
                  <p>
                    Titles are fun designations displayed on your profile
                    or in the Leaderboard once you pass certain XP milestones. For example,
                    if your XP surpasses a certain threshold, you might see
                    <em>&quot;Enthusiast&quot;</em> next to your name. Below is an example
                    table of the title tiers currently recognized on the platform:
                  </p>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-left text-sm md:text-base border border-border'>
                      <thead className='bg-secondary text-secondary-foreground'>
                        <tr>
                          <th className='px-4 py-2'>Title</th>
                          <th className='px-4 py-2'>XP Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {XP_TITLES.map((tier) => (
                          <tr key={tier.label} className='even:bg-accent/5'>
                            <td className='px-4 py-2'>{tier.label}</td>
                            <td className='px-4 py-2'>
                              {tier.max === Infinity
                                ? `${tier.min}+`
                                : `${tier.min} - ${tier.max}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p>Tiers may be updated in future versions but currently remain as above.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='xp-distribution'>
                <AccordionTrigger className='text-base md:text-lg font-semibold'>
                  3. How is XP distributed?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm md:text-base text-muted-foreground'>
                  The XP assigned for each newly minted NFT is random (ranging from
                  1 to 100). This random XP value is stored in the contract. When you own
                  the NFT, that random XP is credited to your address. The XP updates
                  automatically if you transfer or sell the NFT to someone else.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='dashboard'>
                <AccordionTrigger className='text-base md:text-lg font-semibold'>
                  4. What is the Dashboard used for?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm md:text-base text-muted-foreground'>
                  The &quot;Dashboard&quot; is your personalized view for tracking
                  all your stats on AIPenGuild: total XP, number of NFTs minted, NFTs listed
                  for sale, staked items, and more. It provides a quick snapshot
                  of your entire experience within the platform.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='admin'>
                <AccordionTrigger className='text-base md:text-lg font-semibold'>
                  5. What can I do in the Admin Panel?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm md:text-base text-muted-foreground'>
                  The Admin Panel is primarily for platform maintainers or the contract
                  owner. In the current implementation, the main admin action is to
                  withdraw or manage funds from the reward pool. If you’re not the owner
                  of the main contracts, you’ll be redirected.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='nft-staking'>
                <AccordionTrigger className='text-base md:text-lg font-semibold'>
                  6. Is NFT Staking included in AIPenGuild?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm md:text-base text-muted-foreground'>
                  Absolutely! AIPenGuild includes an NFT Staking feature, which allows
                  you to stake your NFTs to earn additional XP over time. Head over to
                  the &quot;Stake&quot; page to lock up your NFTs and accumulate staking rewards.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='staking-xp'>
                <AccordionTrigger className='text-base md:text-lg font-semibold'>
                  7. How many XP do I earn when I stake my NFT?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm md:text-base text-muted-foreground'>
                  The exact amount of XP you earn while staking depends on how long your NFT
                  remains staked and the current rate in the staking pool. You can claim your
                  accumulated XP anytime or upon unstaking your NFT, at which point
                  the XP is added to your total experience.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='usage-guide'>
                <AccordionTrigger className='text-base md:text-lg font-semibold'>
                  8. Step-by-step: How do I use AIPenGuild?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm md:text-base text-muted-foreground space-y-3'>
                  <ol className='list-decimal list-inside ml-4'>
                    <li>
                      <strong>Connect your Wallet</strong> to the supported chain (Moonbase Alpha or Westend).
                    </li>
                    <li>
                      <strong>Mint an AI NFT</strong> by providing a text prompt or uploading
                      your own file on the &quot;Mint&quot; page, then confirm the transaction.
                    </li>
                    <li>
                      <strong>List/Unlist NFTs</strong> on &quot;My NFTs.&quot;
                      Specify a sale price if you want to sell.
                    </li>
                    <li>
                      <strong>Buy NFTs</strong> via the &quot;Marketplace.&quot; Transaction confirmation
                      will handle all XP transfers automatically.
                    </li>
                    <li>
                      <strong>Track your XP &amp; Title</strong> in the &quot;Leaderboard&quot; or &quot;Dashboard.&quot;
                      Earn new titles at higher XP levels.
                    </li>
                    <li>
                      <strong>Admin Panel</strong> (owner-only) for reward pool fund management.
                    </li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='external-apis'>
                <AccordionTrigger className='text-base md:text-lg font-semibold'>
                  9. Does AIPenGuild provide external developer APIs?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm md:text-base text-muted-foreground'>
                  Yes! AIPenGuild exposes easy-to-use REST endpoints for retrieving NFT data,
                  user XP, and more. For example, you can query
                  <code className='bg-accent/10 mx-1 px-1 rounded-sm text-xs'>
                    /api/v1/gaming/nft/[tokenId]
                  </code>
                  to get NFT metadata, staking details, and XP. Similarly,
                  <code className='bg-accent/10 mx-1 px-1 rounded-sm text-xs'>
                    /api/v1/gaming/user/[address]/nfts
                  </code>
                  returns all NFTs owned or staked by a user. Integrate these JSON responses
                  directly into your game or dApp to power truly cross-chain, cross-dApp experiences.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  )
}