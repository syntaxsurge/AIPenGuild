export const SUPPORTED_CHAINS = {
  MOONBASE: 1287
} as const

type ChainAddresses = {
  NFTMarketplaceHub: string
  PlatformRewardPool: string
  UserExperiencePoints: string
  NFTCreatorCollection: string
  NFTStakingPool: string
  explorer: string
}

type ContractAddresses = {
  [chainId: number]: ChainAddresses
}

export const CONTRACT_ADDRESSES: ContractAddresses = {
  [SUPPORTED_CHAINS.MOONBASE]: {
    NFTMarketplaceHub: "0xB031aCC58b182e34262FC7903d05e62AD30a48C8",
    PlatformRewardPool: "0x07870EbBE687D98F5636b66c26e4005A854B8921",
    UserExperiencePoints: "0x4264b772667f3e4d3dd5AB15D9c19E50E01AD55e",
    NFTCreatorCollection: "0x8D875d4596f3BaA32552A5bf094f60446C864970",
    NFTStakingPool: "0xde9f1Aa5E0C19fb224449C275E4A6E8B406e4c58",
    explorer: "https://moonbase.moonscan.io"
  }
}