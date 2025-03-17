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
    NFTMarketplaceHub: "0xc0397D24924ce99d2DE40e1224c7891c4f7aEB46",
    PlatformRewardPool: "0x983a031A6f9C749cF4579c1c6D0D24b6b2aF992a",
    UserExperiencePoints: "0x601499D51B3D136A0C1cF82522b88Da1B34a4426",
    NFTCreatorCollection: "0x503438fDed04426beA9DD048A796a0973f1DaAD9",
    NFTStakingPool: "0xf1d510fc12098E7b20C321e756864644E353c7DA",
    explorer: "https://moonbase.moonscan.io"
  }
}