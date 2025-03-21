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
    NFTMintingPlatform: "0x8070764F8D71e88aDB9D71dc99ad655AAe886DEA",
    NFTMarketplaceHub: "0x9aBe808781985E8E6e5F94403cd379e8e8076EE1",
    PlatformRewardPool: "0xaB609Cd7157510c2624c0bd6Edae30738d1a91b3",
    UserExperiencePoints: "0xA8282c74d1d704D8dd4Dc9AfD368bADC705428A9",
    NFTCreatorCollection: "0x41fE0f6e590d1FE2Bf47dBd55B2Bc4c478De613d",
    NFTStakingPool: "0xD4f754D5D0eA720513C5709c43b27B60D9ed55f0",
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