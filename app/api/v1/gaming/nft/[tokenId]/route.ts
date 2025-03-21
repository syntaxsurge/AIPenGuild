import { getContractConfig, getPublicClientForChainId, parseChainIdParam } from '@/lib/chain-utils'
import { transformIpfsUriToHttp } from '@/lib/ipfs'
import { fetchNftMetadata } from '@/lib/nft-metadata'
import { NextResponse } from 'next/server'

/**
 * GET /api/v1/gaming/nft/[tokenId]?chainId=...
 * Returns detailed on-chain + metadata for a single NFT itemId.
 */
export async function GET(
  request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenId = BigInt(params.tokenId)
    const url = new URL(request.url)
    const chainId = parseChainIdParam(url.searchParams.get('chainId'))

    // Build public client for chain
    const publicClient = getPublicClientForChainId(chainId)

    // Prepare contract configs
    const nftMintingPlatform = getContractConfig(chainId, 'NFTMintingPlatform')
    const nftMarketplaceHub = getContractConfig(chainId, 'NFTMarketplaceHub')
    const nftStakingPool = getContractConfig(chainId, 'NFTStakingPool')

    // 1) Read NFT data from nftItems
    const itemData = await publicClient.readContract({
      address: nftMintingPlatform.address as `0x${string}`,
      abi: nftMintingPlatform.abi,
      functionName: 'nftItems',
      args: [tokenId]
    }) as [bigint, string, bigint, string]
    const [xpValue, resourceUrl, mintedAt, creator] = itemData

    // 2) Attempt to read the owner
    let owner = ''
    try {
      owner = (await publicClient.readContract({
        address: nftMintingPlatform.address as `0x${string}`,
        abi: nftMintingPlatform.abi,
        functionName: 'ownerOf',
        args: [tokenId]
      })) as `0x${string}`
    } catch {
      return NextResponse.json({
        success: false,
        error: `Token ID ${tokenId.toString()} not found or not minted on chainId ${chainId}.`
      }, { status: 404 })
    }

    // 3) marketplace data
    const marketData = await publicClient.readContract({
      address: nftMarketplaceHub.address as `0x${string}`,
      abi: nftMarketplaceHub.abi,
      functionName: 'marketItems',
      args: [tokenId]
    }) as [boolean, bigint]
    const [isOnSale, salePrice] = marketData

    // 4) staking data
    const stakeData = await publicClient.readContract({
      address: nftStakingPool.address as `0x${string}`,
      abi: nftStakingPool.abi,
      functionName: 'stakes',
      args: [tokenId]
    }) as [string, bigint, bigint, boolean]
    const [stakerAddr, startTimestamp, lastClaimed, staked] = stakeData

    // 5) IPFS metadata
    let metadata = null
    try {
      metadata = await fetchNftMetadata(resourceUrl)
    } catch {
      // ignore
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
          staked
        },
        metadata: metadata
          ? {
            imageUrl: transformIpfsUriToHttp(metadata.imageUrl),
            name: metadata.name,
            description: metadata.description,
            attributes: metadata.attributes
          }
          : null
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch NFT data.'
      },
      { status: 500 }
    )
  }
}