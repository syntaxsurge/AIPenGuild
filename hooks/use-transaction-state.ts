import { useState } from 'react'

/**
 * A minimal interface describing the transaction state.
 */
export interface TransactionState {
  isProcessing: boolean
  isSuccess: boolean
  error: string | null
  txHash: `0x${string}` | null
}

/**
 * This hook centralizes the typical transaction states for reading/writing
 * on-chain: loading (processing), success, error, and optional txHash.
 */
export function useTransactionState() {
  const [state, setState] = useState<TransactionState>({
    isProcessing: false,
    isSuccess: false,
    error: null,
    txHash: null,
  })

  /**
   * Call this when beginning the transaction. Optionally provide a txHash if known up front.
   */
  function start(txHash?: `0x${string}`) {
    setState({
      isProcessing: true,
      isSuccess: false,
      error: null,
      txHash: txHash || null,
    })
  }

  /**
   * Call this when the transaction has completed successfully.
   * Optionally update the txHash if you get it later than 'start'.
   */
  function success(txHash?: `0x${string}`) {
    setState((prev) => ({
      ...prev,
      isProcessing: false,
      isSuccess: true,
      error: null,
      txHash: txHash ?? prev.txHash,
    }))
  }

  /**
   * Call this if the transaction fails for any reason.
   */
  function fail(errorMessage: string) {
    setState((prev) => ({
      ...prev,
      isProcessing: false,
      isSuccess: false,
      error: errorMessage,
    }))
  }

  /**
   * Reset the transaction state to initial.
   */
  function reset() {
    setState({
      isProcessing: false,
      isSuccess: false,
      error: null,
      txHash: null,
    })
  }

  return {
    ...state,
    start,
    success,
    fail,
    reset,
  }
}
