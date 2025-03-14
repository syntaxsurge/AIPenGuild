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
    AINFTExchange: "0xCd05cc6Df6cc83A67a0Bbc7b3dc2e5Fbc1E142f5",
    AIRewardPool: "0xbA7870A2c4cB9DC239bD0eEe5cA06dFb7f6EDa45",
    AIExperience: "0xf2A58676cE4CC98538E27D97B7E2F052b50d75Ae",
    CreatorCollection: "0xaEba794062bc1f22e526cb002B747bACA8149a0D",
    explorer: "https://moonbase.moonscan.io"
  }
}