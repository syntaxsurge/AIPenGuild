export const metadata = {
  title: "AIPenGuild Docs | FAQ"
}

export default function FAQDocsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">FAQ</h1>
      <p className="text-sm text-muted-foreground">
        Below are common questions about using AIPenGuild. For advanced inquiries or
        developer-focused info, see the <strong>Developer APIs</strong> section.
      </p>

      <div className="space-y-4">
        {/* 1. Leaderboard */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            1. What is the Leaderboard?
          </h2>
          <p className="text-sm text-muted-foreground">
            The Leaderboard ranks users by their total Experience (XP). Every time
            you mint a new NFT, random XP is assigned to that item. When you own
            the NFT, you gain that XP. The Leaderboard updates in real-time, so
            keep minting or staking to climb the ranks.
          </p>
        </div>

        {/* 2. Titles */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            2. What are Titles?
          </h2>
          <p className="text-sm text-muted-foreground">
            Titles are fun designations displayed on your profile or
            in the Leaderboard once you pass certain XP milestones.
            For example, surpass 5000 XP to become &quot;Enthusiast&quot;.
            Refer to the <strong>User Guide</strong> for a full XP table.
          </p>
        </div>

        {/* 3. XP distribution */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            3. How is XP distributed?
          </h2>
          <p className="text-sm text-muted-foreground">
            Each newly minted NFT randomly receives 1–100 XP. This value is stored
            in the NFT. When you obtain the NFT, your total XP is incremented by
            that amount. If you sell or transfer the NFT, you lose that XP.
          </p>
        </div>

        {/* 4. Dashboard usage */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            4. What is the Dashboard used for?
          </h2>
          <p className="text-sm text-muted-foreground">
            The &quot;Dashboard&quot; is a personal overview showing total XP,
            minted NFT stats, staked items, and more. Check it regularly to monitor
            your XP progress and see how your minted or sold NFTs are performing.
          </p>
        </div>

        {/* 5. Admin panel */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            5. What can I do in the Admin Panel?
          </h2>
          <p className="text-sm text-muted-foreground">
            The Admin Panel is reserved for the platform owner, primarily to withdraw
            funds from the <em>PlatformRewardPool</em>. If you try to access it without
            ownership, you&apos;ll be redirected.
          </p>
        </div>

        {/* 6. NFT staking */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            6. Is NFT Staking included in AIPenGuild?
          </h2>
          <p className="text-sm text-muted-foreground">
            Yes. Our <em>NFTStakingPool</em> allows you to stake your NFTs to accumulate
            additional XP over time. This feature is accessible in the &quot;Stake&quot;
            section of the site.
          </p>
        </div>

        {/* 7. Earned XP in staking */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            7. How many XP do I earn when I stake my NFT?
          </h2>
          <p className="text-sm text-muted-foreground">
            The exact amount depends on <code>xpPerSecond</code> in the
            <em>NFTStakingPool</em>. Each second, you add that many XP. The
            longer it stays staked, the more XP you accumulate.
          </p>
        </div>

        {/* 8. Step-by-step usage */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            8. Step-by-step: How do I use AIPenGuild?
          </h2>
          <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
            <li>Connect your wallet to the supported chain (Moonbase Alpha or Westend).</li>
            <li>Mint a new AI NFT with the &quot;Mint&quot; page. Provide a text prompt, confirm the transaction, etc.</li>
            <li>Optional: Stake your NFT in the &quot;Stake&quot; page to accumulate XP or list it for sale in the &quot;Marketplace&quot;.</li>
            <li>Track your XP on the &quot;Dashboard&quot; or &quot;Leaderboard&quot; to see your ranking and Title.</li>
            <li>Visit the &quot;Admin&quot; panel (owner only) to manage the reward pool if needed.</li>
          </ol>
        </div>

        {/* 9. External dev APIs */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            9. Does AIPenGuild provide external developer APIs?
          </h2>
          <p className="text-sm text-muted-foreground">
            Absolutely. Check <strong>Developer APIs</strong> for detailed
            endpoints like
            <code className="bg-secondary/10 mx-1 px-1 rounded-sm text-xs">/api/v1/gaming/nft/[tokenId]</code>
            or
            <code className="bg-secondary/10 mx-1 px-1 rounded-sm text-xs">/api/v1/gaming/user/[address]/nfts</code>.
            These JSON endpoints let your dApp fetch NFT attributes, XP, stake info,
            or sale status in real time.
          </p>
        </div>
      </div>
    </section>
  )
}