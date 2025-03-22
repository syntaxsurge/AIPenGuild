export const metadata = {
  title: "AIPenGuild Docs | User Guide"
}

export default function UserGuidePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">User Guide</h1>
      <p className="text-sm text-muted-foreground">
        This section walks you through connecting your wallet, minting AI NFTs,
        staking them for XP, and more. Let&apos;s jump in!
      </p>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">1. Connecting Your Wallet</h2>
        <p className="text-sm text-muted-foreground">
          We support EVM-compatible wallets (like MetaMask) when on
          <strong> Moonbase Alpha</strong> or <strong>Westend</strong>.
          Additionally, you can use Polkadot.js-based solutions. Follow these steps:
        </p>
        <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
          <li>Install <em>MetaMask</em> or Polkadot.js extension if you haven&apos;t already.</li>
          <li>Select the desired network (Moonbase Alpha or Westend).
              For Moonbase, you might add the test network manually or use an RPC URL.</li>
          <li>Once connected, your account address and chain info will appear in the site header.</li>
          <li>Ensure you have enough test tokens (DEV or WND) for gas fees.</li>
        </ol>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">2. Minting Your First AI NFT</h2>
        <p className="text-sm text-muted-foreground">
          On the <strong>Mint</strong> page:
        </p>
        <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
          <li>Choose a category (<em>Character</em>, <em>GameItem</em>, or <em>Powerup</em>).</li>
          <li>Enter a creative text prompt for AI generation.</li>
          <li>Optional: pay with <strong>100 XP</strong> or <strong>0.1 DEV/WND</strong> (depending on chain), then confirm the transaction in your wallet.</li>
          <li>Wait for confirmation – your minted NFT is stored on-chain, with IPFS-hosted metadata.</li>
        </ol>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">3. Staking NFTs to Earn XP</h2>
        <p className="text-sm text-muted-foreground">
          Head to the <strong>Stake</strong> page to deposit your NFT into
          the <em>NFTStakingPool</em>. You earn a continuous XP flow at
          <code>xpPerSecond</code> for each staked NFT. You can claim accrued XP
          any time, or automatically upon unstaking.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">4. XP Titles</h2>
        <p className="text-sm text-muted-foreground">
          Each user has a total XP shown on the <strong>Dashboard</strong>
          or <strong>Leaderboard</strong>. As your XP grows, you earn a new Title.
          Below is the table of XP tiers:
        </p>
        <div className="overflow-x-auto border border-border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-2 py-1">Title</th>
                <th className="px-2 py-1">Min XP</th>
                <th className="px-2 py-1">Max XP</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Newcomer</td>
                <td className="px-2 py-1">0</td>
                <td className="px-2 py-1">99</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Apprentice</td>
                <td className="px-2 py-1">100</td>
                <td className="px-2 py-1">999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Adept</td>
                <td className="px-2 py-1">1000</td>
                <td className="px-2 py-1">4999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Enthusiast</td>
                <td className="px-2 py-1">5000</td>
                <td className="px-2 py-1">9999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Connoisseur</td>
                <td className="px-2 py-1">10000</td>
                <td className="px-2 py-1">24999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Expert</td>
                <td className="px-2 py-1">25000</td>
                <td className="px-2 py-1">49999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Master</td>
                <td className="px-2 py-1">50000</td>
                <td className="px-2 py-1">99999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Grandmaster</td>
                <td className="px-2 py-1">100000</td>
                <td className="px-2 py-1">249999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Legend</td>
                <td className="px-2 py-1">250000</td>
                <td className="px-2 py-1">499999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Mythical</td>
                <td className="px-2 py-1">500000</td>
                <td className="px-2 py-1">999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Immortal</td>
                <td className="px-2 py-1">1000000</td>
                <td className="px-2 py-1">4999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Transcendent</td>
                <td className="px-2 py-1">5000000</td>
                <td className="px-2 py-1">9999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Ascendant</td>
                <td className="px-2 py-1">10000000</td>
                <td className="px-2 py-1">24999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Celestial</td>
                <td className="px-2 py-1">25000000</td>
                <td className="px-2 py-1">49999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Eternal</td>
                <td className="px-2 py-1">50000000</td>
                <td className="px-2 py-1">99999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Godlike</td>
                <td className="px-2 py-1">100000000</td>
                <td className="px-2 py-1">499999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Omnipotent</td>
                <td className="px-2 py-1">500000000</td>
                <td className="px-2 py-1">999999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Infinite</td>
                <td className="px-2 py-1">1000000000</td>
                <td className="px-2 py-1">4999999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Multiversal</td>
                <td className="px-2 py-1">5000000000</td>
                <td className="px-2 py-1">99999999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Omniversal</td>
                <td className="px-2 py-1">100000000000</td>
                <td className="px-2 py-1">999999999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Beyond Reality</td>
                <td className="px-2 py-1">1000000000000</td>
                <td className="px-2 py-1">9999999999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Singularity</td>
                <td className="px-2 py-1">10000000000000</td>
                <td className="px-2 py-1">99999999999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Ultimate</td>
                <td className="px-2 py-1">100000000000000</td>
                <td className="px-2 py-1">999999999999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Absolute</td>
                <td className="px-2 py-1">1000000000000000</td>
                <td className="px-2 py-1">9999999999999999</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1">Infinite Singularity</td>
                <td className="px-2 py-1">10000000000000000</td>
                <td className="px-2 py-1">99999999999999999</td>
              </tr>
              <tr>
                <td className="px-2 py-1">Transdimensional</td>
                <td className="px-2 py-1">100000000000000000</td>
                <td className="px-2 py-1">Infinity</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">5. Next Steps</h2>
        <p className="text-sm text-muted-foreground">
          Now that you know how to connect, mint, and stake, you&apos;re all set
          to explore AIPenGuild. Check out the
          <strong>Developer APIs</strong> next if you&apos;re interested in
          integrating these features into your own dApp or game. Otherwise, start
          minting AI NFTs and see how far your XP can take you!
        </p>
      </div>
    </section>
  )
}