export const metadata = {
  title: "AIPenGuild Docs | Developer APIs"
}

export default function DeveloperApisPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">Developer APIs</h1>
      <p className="text-sm text-muted-foreground">
        AIPenGuild exposes REST endpoints for easy retrieval of NFT data, user
        XP, staking info, etc. Integrate these into your dApp or game to power
        real-time experiences with on-chain data.
      </p>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Available Endpoints</h2>
        <p className="text-sm text-muted-foreground">
          All endpoints are served under <code>/api/v1</code> in this Next.js
          project. Typically, you&apos;ll specify <em>chainId</em> for
          queries that rely on a particular chain (e.g., 1287 for Moonbase).
        </p>
        <ul className="ml-4 list-disc text-sm text-muted-foreground space-y-2">
          <li>
            <code>/api/v1/ai-nft</code> – Basic AI NFT generation (image, attributes).
          </li>
          <li>
            <code>/api/v1/ai-nft/metadata</code> – LLM-based attribute
            generation, then AI image creation.
            <br />
            <em>POST</em> body:
            <pre className="bg-secondary p-2 rounded text-xs mt-1">
{`{
  "prompt": "Surreal cityscape with neon vibes",
  "category": "GameItem"
}`}
            </pre>
            Returns the refined attributes and the replicate-based image URL.
          </li>
          <li>
            <code>/api/v1/gaming/nft/[tokenId]</code> – Get metadata, XP, stake info,
            sale status, etc.
            <br />
            Example usage:
            <pre className="bg-secondary p-2 rounded text-xs mt-1">
{`GET /api/v1/gaming/nft/12?chainId=1287`}
            </pre>
          </li>
          <li>
            <code>/api/v1/gaming/user/[address]/nfts</code> – All NFTs owned or
            staked by user.
            <br />
            Example usage:
            <pre className="bg-secondary p-2 rounded text-xs mt-1">
{`GET /api/v1/gaming/user/0x1234.../nfts?chainId=1287`}
            </pre>
          </li>
          <li>
            <code>/api/v1/gaming/user/[address]/xp</code> – Returns numeric XP
            for a user.
          </li>
          <li>
            <code>/api/v1/gaming/titles</code> – Returns the XP-based Titles
            array (e.g., min, max, label).
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Example Workflow</h2>
        <ol className="ml-4 list-decimal text-sm text-muted-foreground space-y-1">
          <li>
            <strong>Generate NFT Data &amp; Image</strong>:
            <code>POST /api/v1/ai-nft/metadata</code> to get JSON with final
            attributes and image.
          </li>
          <li>
            <strong>Upload to IPFS (optional, if needed for custom flows)</strong>:
            if you want to store more data in IPFS yourself, you can do so.
          </li>
          <li>
            <strong>Mint NFT on-chain</strong> using your wallet or
            <code>mintFromCollection</code> in <em>NFTCreatorCollection</em>.
          </li>
          <li>
            <strong>Fetch details</strong> from
            <code>/api/v1/gaming/nft/[tokenId]</code> to confirm on-chain status,
            XP, stake info, etc.
          </li>
        </ol>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Error Handling</h2>
        <p className="text-sm text-muted-foreground">
          All endpoints return <code>success: boolean</code> and <code>error</code>
          messages on failure. Use these to handle fallback or user notifications in
          your application.
        </p>
      </div>
    </section>
  )
}