import Image from 'next/image'

import { NFTItem } from '@/lib/nft-data'
import { ParsedNftMetadata } from '@/lib/nft-metadata'
import { cn } from '@/lib/utils'

/**
 * Props for the NFTCard component.
 * - item:        The NFT data (with itemId, isOnSale, stakeInfo, etc.).
 * - metadata:    Parsed metadata that includes imageUrl, name, attributes, etc.
 * - selected?:   Whether the card is currently selected (for highlighting).
 * - onClick?:    Optional callback for when the card is clicked.
 */
interface NFTCardProps {
  item: NFTItem
  metadata?: ParsedNftMetadata
  selected?: boolean
  onClick?: (item: NFTItem) => void
}

/**
 * NFTCard displays a single NFT, including its image, name/ID, and status badges like STAKED or LISTED.
 */
export function NFTCard({ item, metadata, selected, onClick }: NFTCardProps) {
  const itemIdStr = String(item.itemId)
  // Fallback if no metadata or image
  const imageUrl = metadata?.imageUrl || item.resourceUrl
  // Construct a display name
  const nftName = metadata?.name ? `#${itemIdStr} - ${metadata.name}` : `#${itemIdStr}`

  // Check if staked
  const isStaked = !!item.stakeInfo?.staked
  // Check if listed for sale
  const isListed = item.isOnSale

  // Prepare status labels
  const labels: { text: string; style: string }[] = []

  if (isStaked) {
    // STAKED: dark blue gradient
    labels.push({
      text: 'STAKED',
      style:
        'bg-gradient-to-r from-blue-800 to-blue-900 text-white px-2 py-1 text-xs font-semibold rounded-md shadow-md border border-white',
    })
  }

  if (isListed) {
    // LISTED: darker purple/pink gradient
    labels.push({
      text: 'LISTED',
      style:
        'bg-gradient-to-r from-purple-800 to-pink-900 text-white px-2 py-1 text-xs font-semibold rounded-md shadow-md border border-white',
    })
  }

  function handleClick() {
    if (onClick) {
      onClick(item)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group cursor-pointer rounded-md border-2 p-2 transition-transform hover:scale-[1.02]',
        selected ? 'border-primary' : 'border-border',
      )}
    >
      {/* NFT Image Block */}
      <div className='relative h-36 w-full overflow-hidden rounded-md bg-secondary'>
        {labels.length > 0 && (
          <div className='absolute left-2 top-2 z-10 flex flex-col gap-1'>
            {labels.map((label, idx) => (
              <div key={idx} className={label.style}>
                {label.text}
              </div>
            ))}
          </div>
        )}
        <Image
          src={imageUrl}
          alt={`NFT #${itemIdStr}`}
          fill
          sizes='(max-width: 768px) 100vw,
                 (max-width: 1200px) 50vw,
                 33vw'
          className='object-cover transition-transform group-hover:scale-105'
        />
      </div>

      {/* NFT Name + ID */}
      <p className='mt-2 line-clamp-1 text-xs font-semibold text-foreground'>{nftName}</p>
    </div>
  )
}
