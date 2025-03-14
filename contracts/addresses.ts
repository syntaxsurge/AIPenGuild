export const SUPPORTED_CHAINS = {
  MOONBASE: 1287,
  SEPOLIA: 11155111
} as const

type ChainAddresses = {
  NFTMarketplace: string
  AIRewardPool: string
  AIExperience: string
  CreatorCollection: string
  explorer: string
}

type ContractAddresses = {
  [chainId: number]: ChainAddresses
}

export const CONTRACT_ADDRESSES: ContractAddresses = {
  [SUPPORTED_CHAINS.MOONBASE]: {
    NFTMarketplace: "0xC58aD84Be77d581E6d6e99836d23C06A354f1E58",
    AIRewardPool: "0x704405Bfe6a673859A8605e045Cc5a746FFF2f13",
    AIExperience: "0x48e265591746d51a66740035884b2067B53323c3",
    CreatorCollection: "0xD50507b2a82eF548A3E4996BB91D66fDeDEACf09",
    explorer: "https://moonbase.moonscan.io"
  }
}