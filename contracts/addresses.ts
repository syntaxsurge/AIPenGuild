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
    NFTMarketplace: "0xee946764766Fa09e54794F2a0aA3CB3A133e163E",
    AIRewardPool: "0x4AD722AEFf2D98ABB879aA4f7E907659263C3641",
    AIExperience: "0x8b1B9DCa3dAc6A2fb0AE3518D1e33DC277fc7B25",
    CreatorCollection: "0x0d490Eb74Ed9d3Eca8a0A4c3fEBd42006F373A1D",
    explorer: "https://moonbase.moonscan.io"
  }
}