import { NextResponse } from 'next/server'

import { getContractConfig, getPublicClientForChainId, parseChainIdParam } from '@/lib/chain-utils'
import { transformIpfsUriToHttp } from '@/lib/ipfs'
import { fetchAllNFTs } from '@/lib/nft-data'
import { fetchNftMetadata } from '@/lib/nft-metadata'

/**
 * GET /api/v1/gaming/user/[address]/nfts?chainId=...
 * No second argument with { params }. We'll parse the "[address]" from path segments ourselves.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // 1) parse address from the path
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    // The last segment is "nfts" -> we want the second to last, "[address]"
    // e.g. /api/v1/gaming/user/0x1234abcd/nfts
    // segments might be ["", "api", "v1", "gaming", "user", "0x1234abcd", "nfts"]
    if (segments.length < 7) {
      return NextResponse.json(
        { success: false, error: 'No address found in path' },
        { status: 400 },
      )
    }
    const address = segments[segments.length - 2]
    const userAddress = address.toLowerCase()

    // 2) parse chainId from query param
    const chainId = parseChainIdParam(url.searchParams.get('chainId'))

    // 3) build a public client for that chain
    const publicClient = getPublicClientForChainId(chainId)

    // 4) get contract configs
    const nftMintingPlatform = getContractConfig(chainId, 'NFTMintingPlatform')
    const nftMarketplaceHub = getContractConfig(chainId, 'NFTMarketplaceHub')
    const nftStakingPool = getContractConfig(chainId, 'NFTStakingPool')

    // 5) fetch all minted items
    const allNfts = await fetchAllNFTs(
      publicClient,
      nftMintingPlatform,
      nftMarketplaceHub,
      nftStakingPool,
    )

    // 6) filter by user’s address
    const userItems = allNfts.filter((item) => {
      const stakedByUser =
        item.stakeInfo?.staked && item.stakeInfo.staker.toLowerCase() === userAddress
      const ownedByUser = item.owner.toLowerCase() === userAddress
      return stakedByUser || ownedByUser
    })

    // 7) fetch IPFS metadata for each
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
      { success: false, error: error.message || 'Failed to fetch user NFTs.' },
      { status: 500 },
    )
  }
}
