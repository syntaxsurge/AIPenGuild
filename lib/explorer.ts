import { CONTRACT_ADDRESSES } from '@/contracts/addresses'

/**
 * Get the base explorer URL for a specific chain ID from the addresses config.
 * Fallback to a default explorer if no matching chain config is found.
 */
export function getChainExplorerUrl(chainId: number): string {
  const chainConfig = CONTRACT_ADDRESSES[chainId]
  if (chainConfig && chainConfig.explorer) {
    return chainConfig.explorer
  }
  // Fallback if chain is not recognized
  return 'https://etherscan.io'
}

/**
 * Return a transaction details page URL for the given chainId and txHash
 */
export function getTxUrl(chainId: number, txHash: string): string {
  const explorerBase = getChainExplorerUrl(chainId)
  // A typical pattern is explorerBase + '/tx/' + txHash
  return `${explorerBase}/tx/${txHash}`
}
