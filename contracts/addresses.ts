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
    AINFTExchange: "0x30F75b2308bffd9F74b84DD8C6B2938bf59e4D17",
    AIRewardPool: "0x1Cc8aA2b212d479F99a296E105E8040EB5Fccc10",
    AIExperience: "0x5E03b2f7F16A2bC32E00374e4FfB954d5e29Db55",
    CreatorCollection: "0x320a5ef19efAa9b4522d6c325E62063040Ec144A",
    explorer: "https://moonbase.moonscan.io"
  }
}