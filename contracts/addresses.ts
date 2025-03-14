export const SUPPORTED_CHAINS = {
  MOONBASE: 1287,
  SEPOLIA: 11155111
} as const

type ChainAddresses = {
  AINFTExchange: string
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
    AINFTExchange: "0xb6f67aFa93caBBDe10C5Dec13e68D67AF0C82442",
    AIRewardPool: "0x5CD8b1671b522a6c60Ab84Cf5C9b0acbaFaC14ae",
    AIExperience: "0x9D187d4F0819825a45c8b8d69AbCEF3e2a781494",
    CreatorCollection: "0xFe99ec9B1D298a95DB49e7C90BF24849E7678785",
    explorer: "https://moonbase.moonscan.io"
  }
}