import { NextResponse } from 'next/server'

import { getContractConfig, getPublicClientForChainId, parseChainIdParam } from '@/lib/chain-utils'
import { transformIpfsUriToHttp } from '@/lib/ipfs'
import { fetchAllNFTs } from '@/lib/nft-data'
import { fetchNftMetadata } from '@/lib/nft-metadata'

/**
 * GET /api/v1/gaming/user/[address]/nfts?chainId=...
 *
 * - chainId param can be 1287 (Moonbase Alpha), 420420421 (Westend), or 1284 (Moonbeam).
 * - If missing or invalid, fallback to 1287 (Moonbase Alpha).
 * - Returns all NFTs that the user either owns or has staked.
 * - Also fetches each NFT's IPFS metadata to avoid duplication in code.
 */

export async function GET(request: Request, { params }: { params: { address: string } }) {
  try {
    const url = new URL(request.url)
    const chainId = parseChainIdParam(url.searchParams.get('chainId'))
    const userAddress = params.address.toLowerCase()

    // 1) Build a publicClient for the chain
    const publicClient = getPublicClientForChainId(chainId)

    // 2) Prepare needed contract configs
    const nftMintingPlatform = getContractConfig(chainId, 'NFTMintingPlatform')
    const nftMarketplaceHub = getContractConfig(chainId, 'NFTMarketplaceHub')
    const nftStakingPool = getContractConfig(chainId, 'NFTStakingPool')

    // 3) Fetch all minted items, then filter by user
    const allNfts = await fetchAllNFTs(
      publicClient,
      nftMintingPlatform,
      nftMarketplaceHub,
      nftStakingPool,
    )

    const userItems = allNfts.filter((item) => {
      const stakedByUser =
        item.stakeInfo?.staked && item.stakeInfo.staker.toLowerCase() === userAddress
      const ownedByUser = item.owner.toLowerCase() === userAddress
      return stakedByUser || ownedByUser
    })

    // 4) Fetch IPFS metadata for each item
    const results = []
    for (const nft of userItems) {
      let metadata = null
      try {
        metadata = await fetchNftMetadata(nft.resourceUrl)
      } catch {
        // ignore
      }

      results.push({
        itemId: nft.itemId.toString(),
        xpValue: nft.xpValue.toString(),
        resourceUrl: nft.resourceUrl,
        mintedAt: nft.mintedAt.toString(),
        creator: nft.creator,
        owner: nft.owner,
        isOnSale: nft.isOnSale,
        salePrice: nft.salePrice.toString(),
        stakeInfo: nft.stakeInfo
          ? {
              staker: nft.stakeInfo.staker,
              startTimestamp: nft.stakeInfo.startTimestamp.toString(),
              lastClaimed: nft.stakeInfo.lastClaimed.toString(),
              staked: nft.stakeInfo.staked,
            }
          : null,
        metadata: metadata
          ? {
              imageUrl: transformIpfsUriToHttp(metadata.imageUrl),
              name: metadata.name,
              description: metadata.description,
              attributes: metadata.attributes,
            }
          : null,
      })
    }

    return NextResponse.json({
      success: true,
      chainId,
      nfts: results,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch user NFTs.',
      },
      { status: 500 },
    )
  }
}
