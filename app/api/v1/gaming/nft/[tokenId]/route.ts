import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { moonbaseAlpha, moonbeam } from 'wagmi/chains'
import { westendAssetHub } from '@/providers/rainbowkit-wallet-provider'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { ABIS } from '@/contracts/abis'
import { fetchNftMetadata } from '@/lib/nft-metadata'
import { transformIpfsUriToHttp } from '@/lib/ipfs'

/**
 * GET /api/v1/gaming/nft/[tokenId]?chainId=...
 *
 * Returns JSON with the NFT's on-chain info, including:
 * - xpValue
 * - resourceUrl
 * - mintedAt
 * - creator
 * - owner
 * - marketplace data (isOnSale, salePrice)
 * - staking data (staker, staked, lastClaimed, etc.)
 * - IPFS metadata (image, attributes)
 */
export async function GET(
  request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenIdStr = params.tokenId
    const tokenId = BigInt(tokenIdStr)

    // 1) Parse chainId from query param
    const { searchParams } = new URL(request.url)
    let chainIdParam = searchParams.get('chainId')
    let chainId = chainIdParam ? parseInt(chainIdParam, 10) : 1287
    if (!chainId || !CONTRACT_ADDRESSES[chainId]) {
      chainId = 1287
    }

    // 2) Determine chain object
    let chainObj = moonbaseAlpha
    if (chainId === 420420421) {
      chainObj = westendAssetHub
    } else if (chainId === 1284 || chainId === 1285) {
      chainObj = moonbeam
    } else if (chainId !== 1287) {
      chainObj = moonbaseAlpha
    }

    // 3) public client
    const publicClient = createPublicClient({
      chain: chainObj,
      transport: http()
    })

    // 4) Contract addresses
    const addresses = CONTRACT_ADDRESSES[chainId]
    if (
      !addresses.NFTMintingPlatform ||
      !addresses.NFTMarketplaceHub ||
      !addresses.NFTStakingPool
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Contracts not fully configured for chainId ${chainId}.`
        },
        { status: 500 }
      )
    }

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

    // 5) nftItems(tokenId)
    const itemData = await publicClient.readContract({
      address: nftMintingPlatform.address,
      abi: nftMintingPlatform.abi,
      functionName: 'nftItems',
      args: [tokenId]
    }) as [bigint, string, bigint, string]

    const [xpValue, resourceUrl, mintedAt, creator] = itemData

    // 6) ownerOf(tokenId)
    let owner = ''
    try {
      owner = (await publicClient.readContract({
        address: nftMintingPlatform.address,
        abi: nftMintingPlatform.abi,
        functionName: 'ownerOf',
        args: [tokenId]
      })) as `0x${string}`
    } catch {
      return NextResponse.json({
        success: false,
        error: `Token ID ${tokenIdStr} not found or not minted on chainId ${chainId}.`
      }, { status: 404 })
    }

    // 7) marketplace data
    const marketData = await publicClient.readContract({
      address: nftMarketplaceHub.address,
      abi: nftMarketplaceHub.abi,
      functionName: 'marketItems',
      args: [tokenId]
    }) as [boolean, bigint]
    const [isOnSale, salePrice] = marketData

    // 8) staking data
    const stakeData = await publicClient.readContract({
      address: nftStakingPool.address,
      abi: nftStakingPool.abi,
      functionName: 'stakes',
      args: [tokenId]
    }) as [string, bigint, bigint, boolean]
    const [stakerAddr, startTimestamp, lastClaimed, staked] = stakeData

    // 9) fetch IPFS metadata
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