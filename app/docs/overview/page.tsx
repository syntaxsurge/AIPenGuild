export const metadata = {
  title: "AIPenGuild Docs | Overview"
}

export default function DocsOverviewPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">Overview</h1>
      <p className="text-sm text-muted-foreground">
        Welcome to the official AIPenGuild Documentation! Here, you&apos;ll find
        everything you need to explore, integrate, and build on top of
        our AI-driven NFT platform. Whether you&apos;re a gamer looking to
        stake NFTs or a developer integrating AIPenGuild APIs into your own
        dApp, we&apos;ve got you covered.
      </p>

      <div className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">What is AIPenGuild?</h2>
        <p className="text-sm text-muted-foreground">
          AIPenGuild is a comprehensive AI-based NFT ecosystem offering:
        </p>
        <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground space-y-1">
          <li>AI-powered NFT generation (via LLM-based attributes and image creation).</li>
          <li>NFT Staking for XP rewards.</li>
          <li>Marketplace with 10% fee to the <em>PlatformRewardPool</em>.</li>
          <li>Gamified XP mechanics for user progression.</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">Why Build on AIPenGuild?</h2>
        <p className="text-sm text-muted-foreground">
          By leveraging AIPenGuild&apos;s robust smart contracts and easily
          accessible APIs, you can:
        </p>
        <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground space-y-1">
          <li>Integrate unique NFTs with on-chain stats into your own game or dApp.</li>
          <li>Offer users advanced staking mechanics and XP-based progression with minimal setup.</li>
          <li>Take advantage of cross-chain capabilities on Polkadot-based chains (Moonbase Alpha, Westend, etc.).</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">Documentation Structure</h2>
        <p className="text-sm text-muted-foreground">
          Use the sidebar to navigate. Key sections include:
        </p>
        <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground space-y-1">
          <li><strong>User Guide</strong> – Learn how to connect your wallet, mint AI NFTs, stake for XP, and more.</li>
          <li><strong>Developer APIs</strong> – Discover REST endpoints to fetch NFT data, user XP, staking info, and more.</li>
          <li><strong>FAQ</strong> – Frequently asked questions about AIPenGuild usage.</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">Media & Resources</h2>
        <p className="text-sm text-muted-foreground">
          <strong>Pitch Deck:</strong> &nbsp;
          <a
            href="https://www.canva.com/design/DAGhvgXMfyQ/4wb7P2oUgSfPZp8zXUN8xA/edit"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary"
          >
            Canva Pitch Deck
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Video Demo:</strong> &nbsp;
          <a
            href="https://www.youtube.com/watch?v=MH4DsjtsO8c"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary"
          >
            YouTube Demo
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>GitHub Repo:</strong> &nbsp;
          <a
            href="https://github.com/syntaxsurge/AIPenGuild"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary"
          >
            syntaxsurge/AIPenGuild
          </a>
        </p>
      </div>
    </section>
  )
}