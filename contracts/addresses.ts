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
    NFTMarketplace: "0xdd665d880F44DAa5B3d18b8a8085def1aa3A9180",
    AIRewardPool: "0xaA085D3505C097c0A5e0CD97AB0F52114cCa9967",
    AIExperience: "0x7b35F0D7322dfcd53204187679Ca6355d384dfec",
    CreatorCollection: "0x8dACe4BE3d1D4c12523E68e2C7f1e0FD5C27d244",
    explorer: "https://moonbase.moonscan.io"
  }
}