export const SUPPORTED_CHAINS = {
  MOONBASE: 1287,
  WESTEND: 420420421
} as const

type ChainAddresses = {
  NFTMintingPlatform: string
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
    NFTMintingPlatform: "0x1A825672E1De3C5E3f4c297bB626B8b12f6e80cD",
    NFTMarketplaceHub: "0xCf28651a79bDF1541d8614532408FcF0B5242Dd0",
    PlatformRewardPool: "0xA099937F48BEecd170EDdF20F66eb738F54d9b63",
    UserExperiencePoints: "0x79Dc4fbF279862ef631c01d6937A6fC31dfa6e2f",
    NFTCreatorCollection: "0x04D01Ca2cE168694b5e2CEf22921f002e9955D6e",
    NFTStakingPool: "0xaA8a0Ca67418885ACa3FF81637fCaBC55c7519ED",
    explorer: "https://moonbase.moonscan.io"
  },
  [SUPPORTED_CHAINS.WESTEND]: {
    NFTMintingPlatform: "",
    NFTMarketplaceHub: "",
    PlatformRewardPool: "",
    UserExperiencePoints: "",
    NFTCreatorCollection: "",
    NFTStakingPool: "",
    explorer: "https://westend.subscan.io"
  }
}