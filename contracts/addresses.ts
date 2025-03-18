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
    NFTMarketplaceHub: "0x081becC87fE71F1C7cE68745136e1749dBBfe112",
    PlatformRewardPool: "0xB2BAa8C1f697c040197F3B7C330D84FaFc7B6CCB",
    UserExperiencePoints: "0x2D73d115014A8F907Dacbe708aD9cE7f5DAC860A",
    NFTCreatorCollection: "0x7aaFB88358a608ccF437B8E31c1aD8fa4606e42C",
    NFTStakingPool: "0x67669d17BB8713c799f8608F1b68Cb4a12F44553",
    explorer: "https://moonbase.moonscan.io"
  }
}