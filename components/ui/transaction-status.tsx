import { getTxUrl } from '@/lib/explorer'

interface TransactionStatusProps {
  isLoading: boolean
  isSuccess: boolean
  errorMessage?: string | null
  txHash?: `0x${string}` | null
  chainId?: number
  className?: string
}

/**
 * A reusable component to display transaction status:
 * - isLoading: If true, shows 'Pending confirmation...'
 * - isSuccess: If true, shows 'Transaction Confirmed!'
 * - errorMessage: If not empty, shows the error in a styled message
 * - txHash + chainId: If available, shows a link to the explorer
 *
 * Simply import and render <TransactionStatus> in your page with the correct props.
 */
export function TransactionStatus({
  isLoading,
  isSuccess,
  errorMessage,
  txHash,
  chainId,
  className
}: TransactionStatusProps) {
  // If there's no relevant transaction state, don't render anything
  const showStatus = isLoading || isSuccess || !!errorMessage

  if (!showStatus) return null

  return (
    <div
      className={`rounded-md border border-border p-4 mt-2 text-sm ${className || ''}`}
    >
      <p className="font-bold">Transaction Status:</p>
      {isLoading && (
        <p className="font-bold text-muted-foreground">Pending confirmation...</p>
      )}
      {isSuccess && (
        <p className="font-bold text-green-600">Transaction Confirmed!</p>
      )}
      {errorMessage && (
        <p className="font-bold text-orange-600 dark:text-orange-500 whitespace-pre-wrap break-words">
          Transaction Failed: {errorMessage}
        </p>
      )}
      {txHash && chainId && (
        <div className="mt-2">
          <p className="font-bold">Transaction Hash:</p>
          <a
            href={getTxUrl(chainId, txHash)}
            target="_blank"
            rel="noreferrer"
            className="underline text-primary break-all"
          >
            {txHash}
          </a>
        </div>
      )}
    </div>
  )
}