import * as React from 'react'

import { Loader2 } from 'lucide-react'

import { Button, ButtonProps } from './Button'

interface TransactionButtonProps extends ButtonProps {
  /** Whether the transaction is currently loading/processing */
  isLoading: boolean
  /** Text displayed while loading; defaults to 'Processing...' */
  loadingText?: string
  /** Button label or child elements */
  children: React.ReactNode
}

/**
 * A reusable button that automatically shows a spinner and a custom "loadingText" while isLoading is true.
 * Useful for any on-chain transaction or long-running process.
 */
export function TransactionButton({
  isLoading,
  loadingText = 'Processing...',
  children,
  disabled,
  ...buttonProps
}: TransactionButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...buttonProps}>
      {isLoading ? (
        <>
          <Loader2 className='mr-1 h-4 w-4 animate-spin' />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
