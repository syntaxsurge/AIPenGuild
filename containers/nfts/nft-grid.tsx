'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Grid2X2, LayoutList } from 'lucide-react'
import { NFTCard } from '@/components/nft-card'
import { NFTListItem } from '@/components/nft-list-item'
import Link from 'next/link'

const DEMO_NFTS = [
  {
    id: 1,
    title: 'Penlou1s',
    creator: 'Pixart Motion',
    image: '/nft_01.png',
    price: '0.001',
    type: 'fixed' as const
  },
  {
    id: 2,
    title: 'Saitapen',
    creator: 'Pixart Motion',
    image: '/nft_02.png',
    price: '0.005',
    type: 'open' as const
  },
  {
    id: 3,
    title: 'Poanlen',
    creator: 'Pixart Motion',
    image: '/nft_03.png',
    price: '0.002',
    type: 'fixed' as const
  },
  {
    id: 4,
    title: 'Penpiii',
    creator: 'Pixart Motion',
    image: '/nft_04.png',
    price: '0.001',
    type: 'fixed' as const
  },
  {
    id: 5,
    title: 'Payken',
    creator: 'Pixart Motion',
    image: '/nft_05.png',
    price: '0.001',
    type: 'fixed' as const
  }
]

export function NFTGrid() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className='flex-1 p-4 md:p-6'>
      <div className='mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <h1 className='text-2xl font-bold md:text-3xl'>Cryptographics</h1>
        <Link href='/list-nft'>
          <Button variant='outline'>List NFT for Sale</Button>
        </Link>
      </div>

      <div className='mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div className='flex gap-4'>
          <Select defaultValue='recent'>
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='recent'>Recent</SelectItem>
              <SelectItem value='low-to-high'>Low to high</SelectItem>
              <SelectItem value='high-to-low'>High to low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex gap-2'>
          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size='icon' onClick={() => setViewMode('grid')}>
            <Grid2X2 className='h-4 w-4' />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size='icon' onClick={() => setViewMode('list')}>
            <LayoutList className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4'>
          {DEMO_NFTS.map((nft) => (
            <NFTCard key={nft.id} {...nft} />
          ))}
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          {DEMO_NFTS.map((nft) => (
            <NFTListItem key={nft.id} {...nft} />
          ))}
        </div>
      )}

      <div className='mt-6 flex flex-col items-center justify-between gap-4 md:flex-row'>
        <p className='text-sm text-muted-foreground'>Results 1 - 20 out of 90</p>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm'>
            Previous
          </Button>
          <Button variant='outline' size='sm'>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}