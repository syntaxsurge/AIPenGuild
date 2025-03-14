import { useState } from 'react'
import { X, Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { DualRangeSlider } from '@/components/ui/dual-range-slider'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [priceRange, setPriceRange] = useState([0, 10])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const categories = ['Art', 'Music', 'Virtual Worlds', 'Trading Cards', 'Collectibles']

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 w-80 transform overflow-y-auto border-r bg-background transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
    >
      <div className='space-y-6 p-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold'>Filters</h2>
          <Button variant='ghost' size='icon' className='md:hidden' onClick={onClose}>
            <X className='h-6 w-6' />
          </Button>
        </div>

        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 transform text-muted-foreground' />
          <Input placeholder='Search items' className='pl-10' />
        </div>

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='status'>
            <AccordionTrigger>Status</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-col gap-2'>
                <label className='flex cursor-pointer items-center gap-2'>
                  <input type='checkbox' className='rounded' />
                  <span>Buy Now</span>
                </label>
                <label className='flex cursor-pointer items-center gap-2'>
                  <input type='checkbox' className='rounded' />
                  <span>On Auction</span>
                </label>
                <label className='flex cursor-pointer items-center gap-2'>
                  <input type='checkbox' className='rounded' />
                  <span>New</span>
                </label>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='price'>
            <AccordionTrigger>Price Range</AccordionTrigger>
            <AccordionContent>
              <div className='space-y-4'>
                <DualRangeSlider
                  min={0}
                  max={10}
                  step={0.1}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className='mt-6'
                />
                <div className='flex justify-between'>
                  <Input
                    type='number'
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseFloat(e.target.value), priceRange[1]])}
                    className='w-20'
                  />
                  <Input
                    type='number'
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value)])}
                    className='w-20'
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='categories'>
            <AccordionTrigger>Categories</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-wrap gap-2'>
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                    className='cursor-pointer'
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='collections'>
            <AccordionTrigger>Collections</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-col gap-2'>
                {['Pixart Motion', 'Bored Ape Yacht Club', 'CryptoPunks'].map((collection) => (
                  <label key={collection} className='flex cursor-pointer items-center gap-2'>
                    <input type='checkbox' className='rounded' />
                    <span>{collection}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button className='w-full'>Apply Filters</Button>
      </div>
    </div>
  )
}
