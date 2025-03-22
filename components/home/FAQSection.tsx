'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import XPTitlesModal from '../ui/XPTitlesModal'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion'

export default function FAQSection() {
  return (
    <section
      id='faq'
      className='relative bg-white px-4 py-12 dark:bg-gray-900 sm:py-16 md:py-20 lg:py-24'
    >
      <h2 className='mb-8 text-center text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl'>
        Frequently Asked Questions
      </h2>
      <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground'>
        Expand each question to learn more about how AIPenGuild works.
      </p>

      <div className='mx-auto max-w-4xl'>
        <div className='mx-auto max-w-4xl'>
          <motion.div
            className='rounded-lg bg-accent/10 p-4 md:p-6'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Accordion type='multiple' className='w-full space-y-2'>
              <AccordionItem value='leaderboard'>
                <AccordionTrigger className='text-base font-semibold md:text-lg'>
                  1. What is the Leaderboard?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm text-muted-foreground md:text-base'>
                  The Leaderboard ranks users by their total Experience (XP). Every time you mint a
                  new NFT, random XP (between 1 and 100) is assigned to that item. As you accumulate
                  more NFTs, your total XP increases. The Leaderboard showcases who has accrued the
                  highest XP on AIPenGuild.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='titles'>
                <AccordionTrigger className='text-base font-semibold md:text-lg'>
                  2. What are Titles?
                </AccordionTrigger>
                <AccordionContent className='mt-2 space-y-3 text-sm text-muted-foreground md:text-base'>
                  <p>
                    Titles are fun designations displayed on your profile or in the Leaderboard once
                    you pass certain XP milestones. For example, if your XP surpasses a certain
                    threshold, you might see
                    <em>&quot;Enthusiast&quot;</em> next to your name.
                  </p>
                  <p>Want to see the full XP Title table? Click below:</p>
                  <div>
                    <XPTitlesModal buttonLabel='View Full XP Title Table' />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='xp-distribution'>
                <AccordionTrigger className='text-base font-semibold md:text-lg'>
                  3. How is XP distributed?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm text-muted-foreground md:text-base'>
                  The XP assigned for each newly minted NFT is random (ranging from 1 to 100). This
                  random XP value is stored in the contract. When you own the NFT, that random XP is
                  credited to your address. The XP updates automatically if you transfer or sell the
                  NFT to someone else.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='dashboard'>
                <AccordionTrigger className='text-base font-semibold md:text-lg'>
                  4. What is the Dashboard used for?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm text-muted-foreground md:text-base'>
                  The &quot;Dashboard&quot; is your personalized view for tracking all your stats on
                  AIPenGuild: total XP, number of NFTs minted, NFTs listed for sale, staked items,
                  and more. It provides a quick snapshot of your entire experience within the
                  platform.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='admin'>
                <AccordionTrigger className='text-base font-semibold md:text-lg'>
                  5. What can I do in the Admin Panel?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm text-muted-foreground md:text-base'>
                  The Admin Panel is primarily for platform maintainers or the contract owner. In
                  the current implementation, the main admin action is to withdraw or manage funds
                  from the reward pool. If you’re not the owner of the main contracts, you’ll be
                  redirected.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='nft-staking'>
                <AccordionTrigger className='text-base font-semibold md:text-lg'>
                  6. Is NFT Staking included in AIPenGuild?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm text-muted-foreground md:text-base'>
                  Absolutely! AIPenGuild includes an NFT Staking feature, which allows you to stake
                  your NFTs to earn additional XP over time. Head over to the &quot;Stake&quot; page
                  to lock up your NFTs and accumulate staking rewards.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='staking-xp'>
                <AccordionTrigger className='text-base font-semibold md:text-lg'>
                  7. How many XP do I earn when I stake my NFT?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm text-muted-foreground md:text-base'>
                  The exact amount of XP you earn while staking depends on how long your NFT remains
                  staked and the current rate in the staking pool. You can claim your accumulated XP
                  anytime or automatically upon unstaking your NFT, at which point the XP is added
                  to your total experience.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='usage-guide'>
                <AccordionTrigger className='text-base font-semibold md:text-lg'>
                  8. Step-by-step: How do I use AIPenGuild?
                </AccordionTrigger>
                <AccordionContent className='mt-2 space-y-3 text-sm text-muted-foreground md:text-base'>
                  <ol className='ml-4 list-inside list-decimal'>
                    <li>
                      <strong>Connect your Wallet</strong> to the supported chain (Moonbase Alpha or
                      Westend).
                    </li>
                    <li>
                      <strong>Mint an AI NFT</strong> by providing a text prompt or uploading your
                      own file on the &quot;Mint&quot; page, then confirm the transaction.
                    </li>
                    <li>
                      <strong>List/Unlist NFTs</strong> on &quot;My NFTs.&quot; Specify a sale price
                      if you want to sell.
                    </li>
                    <li>
                      <strong>Buy NFTs</strong> via the &quot;Marketplace.&quot; Transaction
                      confirmation will handle all XP transfers automatically.
                    </li>
                    <li>
                      <strong>Track your XP &amp; Title</strong> in the &quot;Leaderboard&quot; or
                      &quot;Dashboard.&quot; Earn new titles at higher XP levels.
                    </li>
                    <li>
                      <strong>Admin Panel</strong> (owner-only) for reward pool fund management.
                    </li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='external-apis'>
                <AccordionTrigger className='text-base font-semibold md:text-lg'>
                  9. Does AIPenGuild provide external developer APIs?
                </AccordionTrigger>
                <AccordionContent className='mt-2 text-sm text-muted-foreground md:text-base'>
                  Yes! AIPenGuild exposes easy-to-use REST endpoints for retrieving NFT data, user
                  XP, and more. For example, you can query
                  <code className='mx-1 rounded-sm bg-accent/10 px-1 text-xs'>
                    /api/v1/gaming/nft/[tokenId]
                  </code>
                  to get NFT metadata, staking details, and XP. Similarly,
                  <code className='mx-1 rounded-sm bg-accent/10 px-1 text-xs'>
                    /api/v1/gaming/user/[address]/nfts
                  </code>
                  returns all NFTs owned or staked by a user. Integrate these JSON responses
                  directly into your game or dApp to power truly cross-chain, cross-dApp
                  experiences.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
          <div className='mt-4 text-center'>
            <Link
              href='/docs/faq'
              className='inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80'
            >
              View More Questions
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
