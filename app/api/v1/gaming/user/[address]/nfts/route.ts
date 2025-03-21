import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { moonbaseAlpha, moonbeam } from 'wagmi/chains'
import { westendAssetHub } from '@/providers/rainbowkit-wallet-provider'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { ABIS } from '@/contracts/abis'
import { fetchAllNFTs } from '@/lib/nft-data'
import { fetchNftMetadata } from '@/lib/nft-metadata'
import { transformIpfsUriToHttp } from '@/lib/ipfs'

/**
 * GET /api/v1/gaming/user/[address]/nfts?chainId=...
 *
 * chainId can be 1287 (Moonbase Alpha), 420420421 (Westend AssetHub), or 1284/1285 for Moonbeam, etc.
 * If missing or not recognized, default to 1287 (MoonbaseAlpha).
 */
export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    // 1) Parse chainId from query param
    const { searchParams } = new URL(request.url)
    let chainIdParam = searchParams.get('chainId')
    let chainId = chainIdParam ? parseInt(chainIdParam, 10) : 1287
    if (!chainId || !CONTRACT_ADDRESSES[chainId]) {
      chainId = 1287 // fallback
    }

    // 2) Determine which chain object to use for the public client
    let chainObj = moonbaseAlpha // default
    if (chainId === 420420421) {
      chainObj = westendAssetHub
    } else if (chainId === 1284 || chainId === 1285) {
      // If you want to handle actual Moonbeam or Moonriver, adjust as needed
      chainObj = moonbeam
    } else if (chainId !== 1287) {
      // fallback
      chainObj = moonbaseAlpha
    }

    // 3) Initialize public client
    const publicClient = createPublicClient({
      chain: chainObj,
      transport: http()
    })

    // 4) Retrieve addresses for the chainId
    const addresses = CONTRACT_ADDRESSES[chainId]
    const userAddress = params.address.toLowerCase()

    // If any addresses are missing for this chain, can't proceed
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

    // 5) Build minimal contract configs from addresses & ABIs
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

    // 6) Fetch all minted NFTs, then filter by user ownership/staker
    const allNfts = await fetchAllNFTs(publicClient, nftMintingPlatform, nftMarketplaceHub, nftStakingPool)
    const userItems = allNfts.filter((item) => {
      const stakedByUser =
        item.stakeInfo?.staked &&
        item.stakeInfo.staker.toLowerCase() === userAddress
      const ownedByUser = item.owner.toLowerCase() === userAddress
      return stakedByUser || ownedByUser
    })

    // 7) Optionally fetch IPFS metadata
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
      chainId,
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