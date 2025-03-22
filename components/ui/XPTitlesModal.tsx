'use client'

import { useState } from 'react'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { XP_TITLES } from '@/lib/experience'

import { Button } from './Button'

/**
 * XPTitlesModal - A reusable component that renders a button to open
 * a modal displaying the entire XP_TITLES table.
 *
 * Props:
 * - buttonLabel?: string - Custom label for the trigger button.
 */
interface XPTitlesModalProps {
  buttonLabel?: string
}

export default function XPTitlesModal({ buttonLabel = 'View XP Title Table' }: XPTitlesModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant='outline' size='sm'>
          {buttonLabel}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out' />
        <Dialog.Content className='fixed left-1/2 top-1/2 z-[9999] w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-background p-4 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out'>
          <div className='mb-4 flex items-center justify-between'>
            <Dialog.Title className='text-lg font-bold'>XP Title Table</Dialog.Title>
            <Dialog.Close asChild>
              <button
                className='rounded-md p-2 text-muted-foreground hover:bg-secondary'
                aria-label='Close'
              >
                <X className='h-4 w-4' />
              </button>
            </Dialog.Close>
          </div>
          <div className='max-h-[60vh] overflow-y-auto text-sm'>
            <table className='w-full border border-border text-left'>
              <thead className='bg-secondary text-secondary-foreground'>
                <tr>
                  <th className='px-4 py-2'>Title</th>
                  <th className='px-4 py-2'>Min XP</th>
                  <th className='px-4 py-2'>Max XP</th>
                </tr>
              </thead>
              <tbody>
                {XP_TITLES.map((tier) => (
                  <tr key={tier.label} className='border-b border-border last:border-none'>
                    <td className='px-4 py-2'>{tier.label}</td>
                    <td className='px-4 py-2'>{tier.min}</td>
                    <td className='px-4 py-2'>
                      {tier.max === Infinity ? `${tier.min}+` : tier.max}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
