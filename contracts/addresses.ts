export const SUPPORTED_CHAINS = {
  MOONBASE: 1287
} as const

type ChainAddresses = {
  NFTMarketplace: string
  RewardPool: string
  UserExperience: string
  NFTCreatorCollection: string
  explorer: string
}

type ContractAddresses = {
  [chainId: number]: ChainAddresses
}

export const CONTRACT_ADDRESSES: ContractAddresses = {
  [SUPPORTED_CHAINS.MOONBASE]: {
    NFTMarketplace: "0xb6f67aFa93caBBDe10C5Dec13e68D67AF0C82442",
    RewardPool: "0x5CD8b1671b522a6c60Ab84Cf5C9b0acbaFaC14ae",
    UserExperience: "0x9D187d4F0819825a45c8b8d69AbCEF3e2a781494",
    NFTCreatorCollection: "0xFe99ec9B1D298a95DB49e7C90BF24849E7678785",
    explorer: "https://moonbase.moonscan.io"
  }
}