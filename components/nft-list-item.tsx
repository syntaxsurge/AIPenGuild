import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

interface NFTListItemProps {
  title: string
  creator: string
  image: string
  price: string
  type: 'fixed' | 'open'
}

export function NFTListItem({ title, creator, image, price, type }: NFTListItemProps) {
  return (
    <div className='flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50'>
      <div className='relative h-16 w-16 overflow-hidden rounded-lg md:h-24 md:w-24'>
        <Image src={image} alt={title} fill className='object-cover' />
      </div>
      <div className='min-w-0 flex-1'>
        <h3 className='truncate text-base font-semibold md:text-lg'>{title}</h3>
        <p className='truncate text-sm text-highlight'>{creator}</p>
      </div>
      <div className='flex flex-col items-end gap-2'>
        <Badge variant='secondary'>{price} WND</Badge>
        <span className='text-xs text-muted-foreground md:text-sm'>
          {type === 'fixed' ? 'Fixed price' : 'Open bidding'}
        </span>
      </div>
    </div>
  )
}
