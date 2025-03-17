import { ABIS } from '@/contracts/abis'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { ContractConfig, CoreContractName } from '@/contracts/types'
import { useChainId } from 'wagmi'

/**
 * Provides the contract config object (address, ABI, explorer)
 * for the given contract name. If no chain is connected,
 * fallback to MoonbaseAlpha's chain ID (1287).
 */
export function useContract(contractName: CoreContractName): ContractConfig | null {
  let chainId = useChainId()
  // Fallback to MoonbaseAlpha if not connected
  if (!chainId) {
    chainId = 1287
  }

  if (!CONTRACT_ADDRESSES[chainId]) {
    return null
  }

  const address = CONTRACT_ADDRESSES[chainId][contractName]
  const abi = ABIS[contractName]
  const explorer = CONTRACT_ADDRESSES[chainId].explorer

  if (!address || !abi) {
    return null
  }

  return {
    address,
    abi,
    explorer
  }
}