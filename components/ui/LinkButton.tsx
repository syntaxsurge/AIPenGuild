import Link from 'next/link'
import React from 'react'

import { VariantProps } from 'class-variance-authority'

import { buttonVariants } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface LinkButtonProps
  extends React.LinkHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  blankTarget?: boolean
}

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, variant, size, href, blankTarget, ...props }, ref) => {
    return (
      <Link
        target={blankTarget ? '_blank' : undefined}
        href={href || ''}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)

LinkButton.displayName = 'LinkButton'
