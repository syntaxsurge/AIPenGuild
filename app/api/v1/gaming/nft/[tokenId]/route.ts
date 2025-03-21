import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { moonbaseAlpha } from 'wagmi/chains'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { ABIS } from '@/contracts/abis'
import { fetchNftMetadata } from '@/lib/nft-metadata'
import { transformIpfsUriToHttp } from '@/lib/ipfs'

/**
 * GET /api/v1/gaming/nft/[tokenId]
 *
 * Returns JSON with the NFT's on-chain info, including:
 * - xpValue
 * - resourceUrl
 * - mintedAt
 * - creator
 * - ownerOf
 * - marketplace data (isOnSale, salePrice)
 * - staking data (staker, staked, lastClaimed, etc.)
 * - IPFS metadata (image, attributes)
 */
export async function GET(
  _request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenIdStr = params.tokenId
    const tokenId = BigInt(tokenIdStr)

    // Setup a public client to read from MoonbaseAlpha by default.
    const publicClient = createPublicClient({
      chain: moonbaseAlpha,
      transport: http()
    })

    const chainId = moonbaseAlpha.id
    const addresses = CONTRACT_ADDRESSES[chainId]
    if (
      !addresses.NFTMintingPlatform ||
      !addresses.NFTMarketplaceHub ||
      !addresses.NFTStakingPool
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contracts not configured for this chain.'
        },
        { status: 500 }
      )
    }

    // We'll do single calls to read the data from each contract
    const nftMintingPlatform = {
      address: addresses.NFTMintingPlatform as `0x${string}`,
      abi: ABIS.NFTMintingPlatform
    }
    const nftMarketplaceHub = {
      address: addresses.NFTMarketplaceHub as `0x${string}`,
      abi: ABIS.NFTMarketplaceHub
    }
    const nftStakingPool = {
      address: addresses.NFTStakingPool as `0x${string}`,
      abi: ABIS.NFTStakingPool
    }

    // 1) Grab info from NFTMintingPlatform.nftItems(tokenId)
    //    returns [xpValue, resourceUrl, mintedAt, creator]
    const itemData = await publicClient.readContract({
      address: nftMintingPlatform.address,
      abi: nftMintingPlatform.abi,
      functionName: 'nftItems',
      args: [tokenId]
    }) as [bigint, string, bigint, string]

    const [xpValue, resourceUrl, mintedAt, creator] = itemData

    // 2) ownerOf(tokenId)
    let owner = ''
    try {
      owner = (await publicClient.readContract({
        address: nftMintingPlatform.address,
        abi: nftMintingPlatform.abi,
        functionName: 'ownerOf',
        args: [tokenId]
      })) as `0x${string}`
    } catch {
      // If we fail, possibly token not minted yet
      return NextResponse.json({
        success: false,
        error: `Token ID ${tokenIdStr} not found or not minted.`
      }, { status: 404 })
    }

    // 3) marketplace data: marketItems(tokenId) => [isOnSale, salePrice]
    const marketData = await publicClient.readContract({
      address: nftMarketplaceHub.address,
      abi: nftMarketplaceHub.abi,
      functionName: 'marketItems',
      args: [tokenId]
    }) as [boolean, bigint]

    // 4) staking data: stakes(tokenId) => [staker, startTimestamp, lastClaimed, staked]
    const stakeData = await publicClient.readContract({
      address: nftStakingPool.address,
      abi: nftStakingPool.abi,
      functionName: 'stakes',
      args: [tokenId]
    }) as [string, bigint, bigint, boolean]

    // Build the final response
    const isOnSale = marketData[0]
    const salePrice = marketData[1]

    const stakerAddr = stakeData[0]
    const startTimestamp = stakeData[1]
    const lastClaimed = stakeData[2]
    const staked = stakeData[3]

    // 5) fetch IPFS metadata
    let metadata = null
    try {
      metadata = await fetchNftMetadata(resourceUrl)
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
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