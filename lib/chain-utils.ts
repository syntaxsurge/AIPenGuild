import { ABIS } from '@/contracts/abis'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { ContractConfig, CoreContractName } from '@/contracts/types'
import { Chain, createPublicClient, defineChain, http } from 'viem'
import { moonbaseAlpha } from 'viem/chains'

/**
 * We define a Westend AssetHub chain object that satisfies viem's Chain type.
 * The main difference is including blockExplorers.default.apiUrl to avoid TS errors.
 */
export const westendAssetHubChain = defineChain({
  id: 420420421,
  name: 'Westend AssetHub',
  network: 'westend',
  nativeCurrency: {
    decimals: 18,
    name: 'Westend',
    symbol: 'WND'
  },
  rpcUrls: {
    default: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
      webSocket: ['wss://westend-asset-hub-eth-rpc.polkadot.io']
    },
    public: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
      webSocket: ['wss://westend-asset-hub-eth-rpc.polkadot.io']
    }
  },
  blockExplorers: {
    default: {
      name: 'Subscan Westend',
      url: 'https://assethub-westend.subscan.io',
      apiUrl: 'https://assethub-westend.subscan.io'
    }
  }
})

/**
 * We define a custom Moonbeam chain, focusing on matching the shape for viem.
 * In reality, you might rely on built-in 'moonbeam' from 'viem/chains',
 * but we demonstrate a custom approach here to avoid literal mismatch errors.
 */
export const customMoonbeamChain = defineChain({
  id: 1284,
  name: 'Moonbeam',
  network: 'moonbeam',
  nativeCurrency: {
    decimals: 18,
    name: 'GLMR',
    symbol: 'GLMR'
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.api.moonbeam.network'],
      webSocket: ['wss://rpc.api.moonbeam.network']
    },
    public: {
      http: ['https://rpc.api.moonbeam.network'],
      webSocket: ['wss://rpc.api.moonbeam.network']
    }
  },
  blockExplorers: {
    default: {
      name: 'Moonscan',
      url: 'https://moonbeam.moonscan.io',
      apiUrl: 'https://moonbeam.moonscan.io/api'
    }
  }
})

/**
 * Return a viem-compatible chain object for a given chainId.
 * Defaults to Moonbase Alpha if the chainId is unknown.
 */
export function getChainForChainId(chainIdParam?: number): Chain {
  const chainId = chainIdParam || 1287
  if (chainId === 420420421) {
    return westendAssetHubChain
  }
  if (chainId === 1284) {
    return customMoonbeamChain
  }
  // For 1287, we can directly use the official moonbaseAlpha from 'viem/chains':
  // If you need to customize it, define a new chain object. But typically, this is fine.
  return moonbaseAlpha
}

/**
 * Build a publicClient using viem's createPublicClient + the chain object above.
 */
export function getPublicClientForChainId(chainId: number) {
  const chain = getChainForChainId(chainId)
  return createPublicClient({
    chain,
    transport: http()
  })
}

/**
 * Return the full contract config, which includes address, abi, and explorer.
 * This ensures we have everything we need, satisfying the ContractConfig interface.
 */
export function getContractConfig(chainId: number, contractName: CoreContractName): ContractConfig {
  const chainAddresses = CONTRACT_ADDRESSES[chainId]
  if (!chainAddresses) {
    throw new Error(`Unsupported chainId: ${chainId}`)
  }

  const address = chainAddresses[contractName]
  if (!address) {
    throw new Error(`No contract address for ${contractName} on chain ${chainId}`)
  }

  const abi = ABIS[contractName]
  if (!abi) {
    throw new Error(`No ABI found for contractName: ${contractName}`)
  }

  const explorer = chainAddresses.explorer

  return {
    address,
    abi,
    explorer
  }
}

/**
 * Parse chainId from a query param string. If invalid, fallback to 1287.
 */
export function parseChainIdParam(chainIdStr: string | null): number {
  if (!chainIdStr) return 1287
  const num = parseInt(chainIdStr, 10)
  if (Number.isNaN(num)) return 1287
  return num
}