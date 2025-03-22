import Image from "next/image"

export const metadata = {
  title: "AIPenGuild Docs | User Guide"
}

export default function UserGuidePage() {
  return (
    <section className="space-y-8">
      <h1 className="text-4xl font-extrabold text-primary">User Guide</h1>
      <p className="text-lg text-foreground leading-relaxed">
        Follow these steps to get the most out of AIPenGuild. From connecting your wallet,
        to minting AI NFTs, to staking them for XP, we’ve got you covered.
      </p>

      {/* 1. Connect Wallet */}
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="md:w-1/2 space-y-3">
          <h2 className="text-2xl font-bold text-primary">1. Connect Your Wallet</h2>
          <p className="text-base text-foreground leading-relaxed">
            We support EVM-compatible wallets and Polkadot.js-based solutions. Switch your wallet
            to the correct test network (Moonbase Alpha or Westend). Ensure you have enough
            test tokens (DEV or WND) for gas.
          </p>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <Image
            src="/images/docs/user-guide-connect.png"
            alt="Connect Wallet Screenshot"
            width={400}
            height={250}
            className="rounded-md border border-border shadow-sm"
          />
        </div>
      </div>

      {/* 2. Mint Your AI NFT */}
      <div className="flex flex-col gap-6 md:flex-row-reverse">
        <div className="md:w-1/2 space-y-3">
          <h2 className="text-2xl font-bold text-primary">2. Mint Your AI NFT</h2>
          <p className="text-base text-foreground leading-relaxed">
            On the <strong>Mint</strong> page, enter your AI prompt, choose a category, and
            let the model generate your NFT image + attributes. Finalize by paying
            <code className="bg-accent/10 px-1 rounded">0.1 {`<NativeToken>`}</code> or <code>100 XP</code>.
          </p>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <Image
            src="/images/docs/user-guide-mint.png"
            alt="Mint AI NFT Screenshot"
            width={400}
            height={250}
            className="rounded-md border border-border shadow-sm"
          />
        </div>
      </div>

      {/* 3. Staking for XP */}
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="md:w-1/2 space-y-3">
          <h2 className="text-2xl font-bold text-primary">3. Stake Your NFT for XP</h2>
          <p className="text-base text-foreground leading-relaxed">
            Visit the <strong>Stake</strong> page to deposit your NFT into the
            <em> NFTStakingPool</em>. Over time, you earn XP at the <code>xpPerSecond</code> rate.
            Claim your rewards anytime or automatically upon unstaking.
          </p>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <Image
            src="/images/docs/user-guide-stake.png"
            alt="NFT Staking Screenshot"
            width={400}
            height={250}
            className="rounded-md border border-border shadow-sm"
          />
        </div>
      </div>

      {/* 4. List or Manage */}
      <div className="flex flex-col gap-6 md:flex-row-reverse">
        <div className="md:w-1/2 space-y-3">
          <h2 className="text-2xl font-bold text-primary">4. List or Manage Your NFTs</h2>
          <p className="text-base text-foreground leading-relaxed">
            Access <strong>My NFTs</strong> to list items for sale, update prices, or unlist them.
            The <strong>Marketplace</strong> tab allows you to browse and buy others’ NFTs.
            All XP ownership automatically updates on purchase or transfer.
          </p>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <Image
            src="/images/docs/user-guide-marketplace.png"
            alt="Marketplace Screenshot"
            width={400}
            height={250}
            className="rounded-md border border-border shadow-sm"
          />
        </div>
      </div>

      {/* 5. Track XP & Titles */}
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="md:w-1/2 space-y-3">
          <h2 className="text-2xl font-bold text-primary">5. Track Your XP & Titles</h2>
          <p className="text-base text-foreground leading-relaxed">
            Head to the <strong>Dashboard</strong> or <strong>Leaderboard</strong> to see how
            your XP compares with other users. Earn higher Titles by accumulating more XP—e.g.,
            <em>“Enthusiast”</em>, <em>“Master”</em>, or <em>“Celestial”</em> for advanced users.
          </p>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <Image
            src="/images/docs/user-guide-leaderboard.png"
            alt="Leaderboard Screenshot"
            width={400}
            height={250}
            className="rounded-md border border-border shadow-sm"
          />
        </div>
      </div>

      <div className="border border-border rounded-md p-4 shadow-sm bg-secondary text-secondary-foreground">
        <h3 className="text-xl font-bold text-primary mb-2">That’s It!</h3>
        <p className="text-base text-foreground leading-relaxed">
          You’re now ready to explore AIPenGuild fully. If you have any additional questions,
          check out our <strong>FAQ</strong> or head over to the <strong>Developer APIs</strong>
          section to see how to integrate NFT data directly into your own application.
        </p>
      </div>
    </section>
  )
}