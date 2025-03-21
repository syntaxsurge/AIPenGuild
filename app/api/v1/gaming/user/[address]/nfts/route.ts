import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { moonbaseAlpha } from 'wagmi/chains'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { ABIS } from '@/contracts/abis'
import { fetchAllNFTs } from '@/lib/nft-data'
import { fetchNftMetadata } from '@/lib/nft-metadata'
import { transformIpfsUriToHttp } from '@/lib/ipfs'

/**
 * GET /api/v1/gaming/user/[address]/nfts
 *
 * Returns all NFTs that the user either owns or has staked, including:
 * - itemId
 * - xpValue
 * - resourceUrl
 * - mintedAt
 * - creator
 * - owner
 * - isOnSale
 * - salePrice
 * - stakeInfo
 * - metadata (parsed from IPFS, if valid)
 */
export async function GET(
  _request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const userAddress = params.address.toLowerCase()

    // Setup a public client to read from MoonbaseAlpha by default.
    const publicClient = createPublicClient({
      chain: moonbaseAlpha,
      transport: http(CONTRACT_ADDRESSES[moonbaseAlpha.id].NFTMintingPlatform ? {} : undefined)
    })

    // Build minimal contract configs from addresses & ABIs
    const chainId = moonbaseAlpha.id
    const addresses = CONTRACT_ADDRESSES[chainId]

    // If any of these addresses are empty or missing, we can't proceed reliably
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

    const allNfts = await fetchAllNFTs(publicClient, nftMintingPlatform, nftMarketplaceHub, nftStakingPool)
    // Filter by user ownership or staker
    const userItems = allNfts.filter((item) => {
      const stakedByUser = item.stakeInfo?.staked && item.stakeInfo.staker.toLowerCase() === userAddress
      const ownedByUser = item.owner.toLowerCase() === userAddress
      return stakedByUser || ownedByUser
    })

    // Optionally fetch IPFS metadata for each
    const results = []
    for (const nft of userItems) {
      let metadata = null
      try {
        metadata = await fetchNftMetadata(nft.resourceUrl)
      } catch {
        // ignore errors, fallback to null
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
              staked: nft.stakeInfo.staked
            }
          : null,
        metadata: metadata
          ? {
              imageUrl: transformIpfsUriToHttp(metadata.imageUrl),
              name: metadata.name,
              description: metadata.description,
              attributes: metadata.attributes
            }
          : null
      })
    }

    return NextResponse.json({
      success: true,
      nfts: results
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch user NFTs.'
      },
      { status: 500 }
    )
  }
}