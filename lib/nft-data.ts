import { UsePublicClientReturnType } from 'wagmi'
import { ContractConfig } from '@/contracts/types'

export interface NFTItem {
  itemId: bigint
  xpValue: bigint
  resourceUrl: string
  mintedAt: bigint
  creator: string
  owner: string
  isOnSale: boolean
  salePrice: bigint
  stakeInfo?: {
    staker: string
    startTimestamp: bigint
    lastClaimed: bigint
    staked: boolean
  }
}

/**
 * Fetch all minted NFTs from the NFTMintingPlatform, along with marketplace listings and staking info.
 * We use multicall for efficiency, returning an array of NFTItem for itemIds 1..totalMinted.
 *
 * @param publicClient - A Wagmi PublicClient
 * @param nftMintingPlatform - Use the result of useContract("NFTMintingPlatform")
 * @param nftMarketplaceHub - Use the result of useContract("NFTMarketplaceHub")
 * @param nftStakingPool - Use the result of useContract("NFTStakingPool")
 * @returns An array of NFTItem objects
 */
export async function fetchAllNFTs(
  publicClient: UsePublicClientReturnType,
  nftMintingPlatform: ContractConfig,
  nftMarketplaceHub: ContractConfig,
  nftStakingPool: ContractConfig,
): Promise<NFTItem[]> {
  // Sanity check
  if (
    !publicClient ||
    !nftMintingPlatform?.address ||
    !nftMintingPlatform?.abi ||
    !nftMarketplaceHub?.address ||
    !nftMarketplaceHub?.abi ||
    !nftStakingPool?.address ||
    !nftStakingPool?.abi
  ) {
    return []
  }

  // 1) Read total minted
  const totalMinted = (await publicClient.readContract({
    address: nftMintingPlatform.address as `0x${string}`,
    abi: nftMintingPlatform.abi,
    functionName: 'getLatestMintedId',
    args: [],
  })) as bigint

  if (!totalMinted || totalMinted < 1n) {
    return []
  }

  // We'll prepare multicall requests. For each tokenId, we want:
  //   - nftItems(tokenId) from NFTMintingPlatform
  //   - ownerOf(tokenId) from NFTMintingPlatform
  //   - marketItems(tokenId) from NFTMarketplaceHub
  //   - stakes(tokenId) from NFTStakingPool
  //
  // We'll do 4 calls per tokenId in a single multicall array.

  const calls = []
  for (let i = 1n; i <= totalMinted; i++) {
    // NFT item data
    calls.push({
      address: nftMintingPlatform.address as `0x${string}`,
      abi: nftMintingPlatform.abi,
      functionName: 'nftItems',
      args: [i],
    })
    // Owner
    calls.push({
      address: nftMintingPlatform.address as `0x${string}`,
      abi: nftMintingPlatform.abi,
      functionName: 'ownerOf',
      args: [i],
    })
    // Market listing
    calls.push({
      address: nftMarketplaceHub.address as `0x${string}`,
      abi: nftMarketplaceHub.abi,
      functionName: 'marketItems',
      args: [i],
    })
    // Stake info
    calls.push({
      address: nftStakingPool.address as `0x${string}`,
      abi: nftStakingPool.abi,
      functionName: 'stakes',
      args: [i],
    })
  }

  // 2) Perform multicall
  const multicallRes = await publicClient.multicall({
    contracts: calls,
    allowFailure: true,
  })

  // We'll parse them in chunks of 4
  const nfts: NFTItem[] = []
  let idx = 0
  for (let i = 1n; i <= totalMinted; i++) {
    const itemDataCall = multicallRes[idx]
    const ownerCall = multicallRes[idx + 1]
    const marketCall = multicallRes[idx + 2]
    const stakeCall = multicallRes[idx + 3]
    idx += 4

    // If any call is missing or failed, skip
    if (!itemDataCall?.result || !ownerCall?.result || !marketCall?.result || !stakeCall?.result) {
      continue
    }

    // nftItems: [xpValue, resourceUrl, mintedAt, creator]
    const itemData = itemDataCall.result as [bigint, string, bigint, string]
    const xpValue = itemData[0]
    const resourceUrl = itemData[1]
    const mintedAt = itemData[2]
    const creator = itemData[3]

    const owner = ownerCall.result as `0x${string}`

    // marketItems: [isOnSale, salePrice]
    const marketData = marketCall.result as [boolean, bigint]
    const isOnSale = marketData[0]
    const salePrice = marketData[1]

    // stakes: [staker, startTimestamp, lastClaimed, staked]
    const stakeData = stakeCall.result as [string, bigint, bigint, boolean]
    const stakerAddr = stakeData[0]
    const startTimestamp = stakeData[1]
    const lastClaimed = stakeData[2]
    const staked = stakeData[3]

    const stakeInfo = {
      staker: stakerAddr,
      startTimestamp,
      lastClaimed,
      staked,
    }

    nfts.push({
      itemId: i,
      xpValue,
      resourceUrl,
      mintedAt,
      creator,
      owner,
      isOnSale,
      salePrice,
      stakeInfo,
    })
  }

  return nfts
}
