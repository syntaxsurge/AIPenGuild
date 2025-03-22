import { useChainId } from 'wagmi'

/**
 * Returns the native currency symbol based on the connected chain.
 * - 1287 (Moonbase Alpha) => "DEV"
 * - 420420421 (Westend AssetHub) => "WND"
 * Defaults to "ETH" otherwise.
 */
export function useNativeCurrencySymbol(): string {
  const chainId = useChainId()

  switch (chainId) {
    case 1287:
      return 'DEV' // Moonbase Alpha
    case 420420421:
      return 'WND' // Westend AssetHub
    default:
      return 'ETH'
  }
}
