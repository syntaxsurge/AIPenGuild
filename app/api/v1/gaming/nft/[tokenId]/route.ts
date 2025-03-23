import { NextResponse } from 'next/server'

import { getContractConfig, getPublicClientForChainId, parseChainIdParam } from '@/lib/chain-utils'
import { transformIpfsUriToHttp } from '@/lib/ipfs'
import { fetchNftMetadata } from '@/lib/nft-metadata'

/**
 * GET /api/v1/gaming/nft/[tokenId]?chainId=...
 * We manually parse the tokenId from the URL path (the last segment).
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // 1) Parse tokenId from path segments
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const tokenIdStr = segments[segments.length - 1]
    if (!tokenIdStr) {
      return NextResponse.json(
        { success: false, error: 'No tokenId found in path' },
        { status: 400 },
      )
    }

    const tokenId = BigInt(tokenIdStr)

    // 2) parse chainId from query param
    const chainId = parseChainIdParam(url.searchParams.get('chainId'))

    // 3) Build public client
    const publicClient = getPublicClientForChainId(chainId)

    // 4) Contract configs
    const nftMintingPlatform = getContractConfig(chainId, 'NFTMintingPlatform')
    const nftMarketplaceHub = getContractConfig(chainId, 'NFTMarketplaceHub')
    const nftStakingPool = getContractConfig(chainId, 'NFTStakingPool')

    // 5) read NFT data
    const itemData = (await publicClient.readContract({
      address: nftMintingPlatform.address as `0x${string}`,
      abi: nftMintingPlatform.abi,
      functionName: 'nftItems',
      args: [tokenId],
    })) as [bigint, string, bigint, string]
    const [xpValue, resourceUrl, mintedAt, creator] = itemData

    // 6) read ownerOf (may throw if not found)
    let owner = ''
    try {
      owner = (await publicClient.readContract({
        address: nftMintingPlatform.address as `0x${string}`,
        abi: nftMintingPlatform.abi,
        functionName: 'ownerOf',
        args: [tokenId],
      })) as `0x${string}`
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: `Token ID ${tokenId.toString()} not found or not minted on chainId ${chainId}.`,
        },
        { status: 404 },
      )
    }

    // 7) marketplace data
    const marketData = (await publicClient.readContract({
      address: nftMarketplaceHub.address as `0x${string}`,
      abi: nftMarketplaceHub.abi,
      functionName: 'marketItems',
      args: [tokenId],
    })) as [boolean, bigint]
    const [isOnSale, salePrice] = marketData

    // 8) staking data
    const stakeData = (await publicClient.readContract({
      address: nftStakingPool.address as `0x${string}`,
      abi: nftStakingPool.abi,
      functionName: 'stakes',
      args: [tokenId],
    })) as [string, bigint, bigint, boolean]
    const [stakerAddr, startTimestamp, lastClaimed, staked] = stakeData

    // 9) optional IPFS metadata
    let metadata = null
    try {
      metadata = await fetchNftMetadata(resourceUrl)
    } catch {
      // ignore errors
    }

    return NextResponse.json({
      success: true,
      chainId,
      nft: {
        tokenId: tokenId.toString(),
        xpValue: xpValue.toString(),
        resourceUrl,
        mintedAt: mintedAt.toString(),
        creator,
        owner,
        isOnSale,
        salePrice: salePrice.toString(),
        stakeInfo: {
          staker: stakerAddr,
          startTimestamp: startTimestamp.toString(),
          lastClaimed: lastClaimed.toString(),
          staked,
        },
        metadata: metadata
          ? {
              imageUrl: transformIpfsUriToHttp(metadata.imageUrl),
              name: metadata.name,
              description: metadata.description,
              attributes: metadata.attributes,
            }
          : null,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch NFT data.' },
      { status: 500 },
    )
  }
}
