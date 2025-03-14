import React from 'react'
import { ArrowRight } from 'lucide-react'

interface InteractiveHoverButtonProps {
  text?: string
  className?: string
}

export function InteractiveHoverButton({ text = 'Button', className }: InteractiveHoverButtonProps = {}) {
  return (
    <button
      className={`group relative flex h-10 w-64 items-center justify-center overflow-hidden rounded-md border border-foreground bg-white px-4 text-sm font-semibold text-foreground transition hover:bg-foreground hover:text-white dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 ${className}`}
    >
      <span className="mr-2 transition-transform group-hover:translate-x-1">
        {text}
      </span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </button>
  )
}