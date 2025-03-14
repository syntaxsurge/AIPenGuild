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
    NFTMarketplace: "0x713838410E21064F7640bef32A34449A27Cf5dC9",
    AIRewardPool: "0x33eB2c50Fbd1fFA5378711870a59860520B48b36",
    AIExperience: "0xE2529987b1F00a76A1978A2484c6232E301Fe81C",
    CreatorCollection: "0x2d7699713BF2B1857Bb67982e4B38d98723EB2cF",
    explorer: "https://moonbase.moonscan.io"
  }
}