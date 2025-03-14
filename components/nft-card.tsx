import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface NFTCardProps {
  title: string
  creator: string
  image: string
  price: string
  type: 'fixed' | 'open'
}

export function NFTCard({ title, creator, image, price, type }: NFTCardProps) {
  return (
    <Card className='overflow-hidden'>
      <CardHeader className='p-0'>
        <div className='relative aspect-square overflow-hidden'>
          <Image src={image} alt={title} fill className='object-cover transition-transform hover:scale-105' />
        </div>
      </CardHeader>
      <CardContent className='p-4'>
        <h3 className='truncate text-base font-semibold md:text-lg'>{title}</h3>
        <p className='truncate text-sm text-highlight'>{creator}</p>
      </CardContent>
      <CardFooter className='flex items-center justify-between p-4 pt-0'>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground md:text-sm'>
            {type === 'fixed' ? 'Fixed price' : 'Open bidding'}
          </span>
        </div>
        <Badge variant='secondary'>{price} WND</Badge>
      </CardFooter>
    </Card>
  )
}
