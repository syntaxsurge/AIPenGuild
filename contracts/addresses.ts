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
    NFTMintingPlatform: "0xc9c6537a053B5FBf649D016B7FfCf1d20AD2c6Cc",
    NFTMarketplaceHub: "0xAa771b0190b08e34e3D5906Cbd56e0862dd60B5D",
    PlatformRewardPool: "0x7E1677F5544d0C50D10247e8c009BfAa1f40643C",
    UserExperiencePoints: "0xa4835F5becfD842BF527Dae46E1Da9CeD6005E3D",
    NFTCreatorCollection: "0xfFC63C72920420D64caE7F6Bc16Da168E07182B0",
    NFTStakingPool: "0x593EBb96FEC6184fFF2CE19124CaCD82F03c27ba",
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