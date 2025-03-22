import Image from "next/image"

export default function DocsOverviewPage() {
  return (
    <section className="space-y-8">
      <div className="flex flex-col-reverse items-center gap-8 md:flex-row">
        {/* Text Column */}
        <div className="md:w-1/2">
          <h1 className="text-4xl font-extrabold text-primary mb-4">Welcome to the AIPenGuild Documentation</h1>
          <p className="text-lg text-foreground leading-relaxed mb-4">
            Experience the power of AI-driven NFT creation and learn how to integrate these
            robust assets into your dApp or game. Whether you are a user trying to mint your
            first AI NFT or a developer exploring cross-chain potential, this is your launchpad.
          </p>
          <p className="text-lg text-foreground leading-relaxed mb-4">
            In this documentation, we’ll guide you through connecting your wallet, minting AI NFTs,
            staking them for XP, and exploring our dedicated marketplace. If you're a developer,
            you’ll discover the best practices for harnessing our REST APIs to fetch NFT data,
            user XP, and more—integrating it seamlessly into your own ecosystem.
          </p>
        </div>

        {/* Image Column */}
        <div className="md:w-1/2 flex justify-center">
          <Image
            src="/images/screenshots/homepage-overview.png"
            alt="Homepage Overview"
            width={500}
            height={350}
            className="rounded-md object-cover border border-border shadow-sm"
          />
        </div>
      </div>

      {/* Embedded Video Example */}
      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
        <div className="md:w-1/2 space-y-4">
          <h2 className="text-3xl font-bold text-primary">Intro Video</h2>
          <p className="text-lg text-foreground leading-relaxed">
            Check out this short overview of AIPenGuild in action. See how NFT creation,
            staking, and the marketplace come together to form a cohesive, AI-driven ecosystem.
          </p>
        </div>
        <div className="md:w-1/2 relative h-64 w-full mt-4 md:mt-0">
          <iframe
            className="absolute top-0 left-0 h-full w-full rounded-md border border-border"
            src="https://www.youtube.com/embed/MH4DsjtsO8c"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
        <h3 className="text-2xl font-bold mb-3">Highlights:</h3>
        <ul className="list-disc list-inside space-y-2 text-lg text-foreground">
          <li>AI-driven NFT generation with integrated IPFS metadata</li>
          <li>Gamified XP system allowing user progress across ecosystems</li>
          <li>Marketplace with auto XP transfer &amp; flexible listing</li>
          <li>NFT Staking Pool for continuous XP accrual</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-primary">Sections Covered</h2>
        <p className="text-lg text-foreground leading-relaxed">
          We recommend checking out the following docs pages in order:
        </p>
        <ul className="list-decimal list-inside ml-4 text-lg text-foreground space-y-1">
          <li>
            <strong>User Guide</strong> – Learn how to connect, mint, stake, and manage NFTs with an easy interface.
          </li>
          <li>
            <strong>Developer APIs</strong> – Integrate NFT data, staking stats, and XP queries into your own dApp.
          </li>
          <li>
            <strong>FAQ</strong> – Find answers to common questions about the XP system, listing, bridging, and more.
          </li>
        </ul>
      </div>
    </section>
  )
}