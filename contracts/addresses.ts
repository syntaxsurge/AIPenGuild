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
    NFTMintingPlatform: '0x1e42AB9ccfa2120c937F7A5665219dbEf0bEeb7a',
    NFTMarketplaceHub: '0xE414093BBA04221C967b65B7a407A0b191b733fA',
    PlatformRewardPool: '0x6d48e92efc3B307Ef74478cBA28Fa29ce07492cb',
    UserExperiencePoints: '0xCfC194D67101ac4EAE4B5818f979e0E3109d44D9',
    NFTCreatorCollection: '0xbF5B5EC750A9152e84727E7Da0Bfed445938C0d3',
    NFTStakingPool: '0x584facee140ba8755046b1B79B711ec3F8f53F53',
    explorer: 'https://moonbase.moonscan.io'
  },
  [SUPPORTED_CHAINS.WESTEND]: {
    NFTMintingPlatform: '',
    NFTMarketplaceHub: '',
    PlatformRewardPool: '',
    UserExperiencePoints: '',
    NFTCreatorCollection: '',
    NFTStakingPool: '',
    explorer: 'https://westend.subscan.io'
  }
}
