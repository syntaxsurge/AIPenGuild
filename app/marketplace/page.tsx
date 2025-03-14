"use client"
import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { X, Search, Grid2X2, LayoutList } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DualRangeSlider } from "@/components/ui/dual-range-slider"
import { Badge } from "@/components/ui/badge"
import { useContract } from "@/hooks/useContract"
import { usePublicClient } from "wagmi"

interface MarketplaceItem {
  itemId: bigint
  creator: string
  xpValue: bigint
  isOnSale: boolean
  salePrice: bigint
  resourceUrl: string
  owner: string
}

export default function MarketplacePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 10])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [listedItems, setListedItems] = useState<MarketplaceItem[]>([])

  const categories = ["Art", "Music", "Virtual Worlds", "Trading Cards", "Collectibles"]
  const aiNftExchange = useContract("AINFTExchange")
  const publicClient = usePublicClient()
  const fetchedRef = useRef(false)

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  // Fetch all minted items from the contract and filter for isOnSale
  useEffect(() => {
    async function fetchItems() {
      if (!aiNftExchange?.address || !aiNftExchange?.abi || !publicClient) return
      if (fetchedRef.current) return
      fetchedRef.current = true
      try {
        const totalItemId = await publicClient.readContract({
          address: aiNftExchange.address as `0x${string}`,
          abi: aiNftExchange.abi,
          functionName: "getLatestItemId",
          args: [], // important for zero-argument function
        })
        if (typeof totalItemId !== "bigint") return

        const newListed: MarketplaceItem[] = []

        for (let i = 1; i <= Number(totalItemId); i++) {
          try {
            const data = await publicClient.readContract({
              address: aiNftExchange.address as `0x${string}`,
              abi: aiNftExchange.abi,
              functionName: "itemData",
              args: [BigInt(i)],
            }) as [bigint, string, bigint, boolean, bigint, string]

            const owner = await publicClient.readContract({
              address: aiNftExchange.address as `0x${string}`,
              abi: aiNftExchange.abi,
              functionName: "ownerOf",
              args: [BigInt(i)],
            }) as `0x${string}`

            if (data[3]) { // isOnSale == true
              newListed.push({
                itemId: data[0],
                creator: data[1],
                xpValue: data[2],
                isOnSale: data[3],
                salePrice: data[4],
                resourceUrl: data[5],
                owner
              })
            }
          } catch (_err) {
            // skip invalid
          }
        }
        setListedItems(newListed)
      } catch (err) {
        console.error("Error fetching marketplace items:", err)
      }
    }
    fetchItems()
  }, [aiNftExchange, publicClient])

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

      {/* Main content */}
      <div className="flex-1 flex flex-col px-4 py-6 sm:px-6 md:px-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-primary">AIPenGuild Marketplace</h1>
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="outline" size="sm" onClick={() => setSidebarOpen(true)}>
              Filters
            </Button>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/my-nfts">
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

        {listedItems.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-16">
            No items listed for sale at the moment.
          </p>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {listedItems.map((item) => (
                  <div
                    key={String(item.itemId)}
                    className="group overflow-hidden rounded-lg border border-border p-3 transition-shadow hover:shadow-lg"
                  >
                    <div className="relative h-60 w-full overflow-hidden rounded-md">
                      <MarketplaceImage resourceUrl={item.resourceUrl} />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <h2 className="text-sm font-semibold">AI NFT #{String(item.itemId)}</h2>
                      <span className="text-xs text-primary font-bold">
                        {(Number(item.salePrice) / 1e18).toFixed(4)} ETH
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Owner: {item.owner.slice(0,6)}...{item.owner.slice(-4)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {listedItems.map((item) => (
                  <div
                    key={String(item.itemId)}
                    className="flex flex-col items-start gap-4 rounded-lg border border-border p-4 transition-shadow hover:shadow-md sm:flex-row"
                  >
                    <div className="relative h-36 w-full flex-shrink-0 overflow-hidden rounded-md sm:w-36">
                      <MarketplaceImage resourceUrl={item.resourceUrl} />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <h3 className="text-base font-semibold">
                        AI NFT #{String(item.itemId)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Owner: {item.owner.slice(0,6)}...{item.owner.slice(-4)}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <span className="text-sm font-bold text-primary">
                        {(Number(item.salePrice) / 1e18).toFixed(4)} ETH
                      </span>
                      <Button variant="default" size="sm">
                        Buy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

/**
 * Helper to display the NFT image. If IPFS or HTTP, we do an <Image> with remote patterns.
 */
function MarketplaceImage({ resourceUrl }: { resourceUrl: string }) {
  let imageUrl = resourceUrl
  if (resourceUrl.startsWith("ipfs://")) {
    imageUrl = resourceUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
  }
  return (
    <Image
      src={imageUrl}
      alt="NFT"
      fill
      className="object-cover transition-transform group-hover:scale-105"
    />
  )
}