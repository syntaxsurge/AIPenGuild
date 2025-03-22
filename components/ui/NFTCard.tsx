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
  // If no metadata or image, fallback to the resourceUrl
  const imageUrl = metadata?.imageUrl || item.resourceUrl
  // Show #<id> plus the metadata name if available
  const nftName = metadata?.name ? `#${itemIdStr} - ${metadata.name}` : `#${itemIdStr}`

  // Check if staked
  // We only need to see if item.stakeInfo?.staked is true
  const isStaked = !!item.stakeInfo?.staked
  // Check if listed for sale
  const isListed = item.isOnSale

  // Prepare status labels
  const labels: { text: string; style: string }[] = []
  if (isStaked) {
    labels.push({
      text: 'STAKED',
      style:
        'bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 text-xs font-semibold rounded-md shadow-md',
    })
  }
  if (isListed) {
    labels.push({
      text: 'LISTED',
      style:
        'bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 text-xs font-semibold rounded-md shadow-md',
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
        {/* Display each status badge in top-left */}
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
