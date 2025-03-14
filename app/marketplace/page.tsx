"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DualRangeSlider } from "@/components/ui/dual-range-slider"
import { Badge } from "@/components/ui/badge"
import { Grid2X2, LayoutList } from "lucide-react"

interface NFTItem {
  id: number
  title: string
  creator: string
  price: string
  image: string
}

const mockNFTs: NFTItem[] = [
  {
    id: 1,
    title: "Alapaap ng Maynila",
    creator: "Sining Pinoy",
    price: "0.07",
    image: "/marketplace/nft_1.png"
  },
  {
    id: 2,
    title: "Bahaghari Night",
    creator: "Makisig Studio",
    price: "0.12",
    image: "/marketplace/nft_2.png"
  },
  {
    id: 3,
    title: "Harana Scene",
    creator: "Luwalhati Labs",
    price: "0.04",
    image: "/marketplace/nft_3.png"
  }
]

export default function MarketplacePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 10])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const categories = ["Art", "Music", "Virtual Worlds", "Trading Cards", "Collectibles"]

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  return (
    <main className="relative flex min-h-screen bg-white dark:bg-gray-900 text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-80 transform border-r border-border bg-background transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:border-none`}
      >
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Filters</h2>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform text-muted-foreground" />
            <Input placeholder="Search items" className="pl-10" />
          </div>

          {/* Accordion Filters */}
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="status">
              <AccordionTrigger>Status</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span>Buy Now</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span>On Auction</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span>New</span>
                  </label>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="price">
              <AccordionTrigger>Price Range</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <DualRangeSlider
                    min={0}
                    max={10}
                    step={0.1}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mt-6"
                  />
                  <div className="flex justify-between">
                    <Input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseFloat(e.target.value), priceRange[1]])}
                      className="w-20"
                    />
                    <Input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value)])}
                      className="w-20"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="categories">
              <AccordionTrigger>Categories</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategories.includes(category) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button variant="outline" className="w-full">
            Apply Filters
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col px-4 py-6 sm:px-6 md:px-8">
        {/* Top bar */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-primary">AIPenGuild Marketplace</h1>
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="outline" size="sm" onClick={() => setSidebarOpen(true)}>
              Filters
            </Button>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/list-nft">
              <Button variant="outline" size="sm">My NFTs</Button>
            </Link>
            <Link href="/mint">
              <Button size="sm">Generate AI NFT</Button>
            </Link>
          </div>
        </header>

        {/* View Mode toggle */}
        <div className="mb-6 flex items-center justify-end gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>

        {/* NFT display */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {mockNFTs.map((nft) => (
              <div key={nft.id} className="group overflow-hidden rounded-lg border border-border p-3 transition-shadow hover:shadow-lg">
                <div className="relative h-60 w-full overflow-hidden rounded-md">
                  <Image
                    src={nft.image}
                    alt={nft.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{nft.title}</h2>
                  <span className="text-xs text-primary font-bold">{nft.price} ETH</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">by {nft.creator}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {mockNFTs.map((nft) => (
              <div
                key={nft.id}
                className="flex flex-col items-start gap-4 rounded-lg border border-border p-4 transition-shadow hover:shadow-md sm:flex-row"
              >
                <div className="relative h-36 w-full flex-shrink-0 overflow-hidden rounded-md sm:w-36">
                  <Image
                    src={nft.image}
                    alt={nft.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <h3 className="text-base font-semibold">{nft.title}</h3>
                  <p className="text-sm text-muted-foreground">by {nft.creator}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="text-sm font-bold text-primary">{nft.price} ETH</span>
                  <Button variant="default" size="sm">Buy</Button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}