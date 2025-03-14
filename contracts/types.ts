export type CoreContractName = 'AINFTExchange' | 'AIRewardPool' | 'AIExperience' | 'CreatorCollection'
export type ContractName = CoreContractName | 'explorer'

export type ChainAddresses = {
  [key in ContractName]: string
}

export type ContractABIs = {
  [key in CoreContractName]: any
}

export interface ContractAddresses {
  [chainId: number]: ChainAddresses
}

export interface ContractConfig {
  address: string
  abi: any
  explorer: string
}