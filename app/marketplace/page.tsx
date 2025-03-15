'use client'

import Link from "next/link"
import Image from "next/image"
import React, { useState, useEffect, useRef } from "react"
import { X, Search, Grid2X2, LayoutList, Loader2 } from "lucide-react"
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { useContract } from "@/hooks/use-contract"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { DualRangeSlider } from "@/components/ui/dual-range-slider"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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
  const { toast } = useToast()
  const { address: wagmiAddress } = useAccount()

  // For the buy transaction (shared across all items, but we’ll track which item locally).
  const {
    data: buyWriteData,
    error: buyError,
    isPending: isBuyPending,
    isSuccess: isBuySuccess,
    writeContract: writeBuyContract,
  } = useWriteContract()

  const {
    data: buyTxReceipt,
    isLoading: isBuyTxLoading,
    isSuccess: isBuyTxSuccess,
    isError: isBuyTxError,
    error: buyTxReceiptError,
  } = useWaitForTransactionReceipt({
    hash: buyWriteData ?? undefined,
  })

  // Local state to track which item is being purchased.
  const [buyingItemId, setBuyingItemId] = useState<bigint | null>(null)

  // Watch buy transaction states for toast notifications and to reset local loading state.
  useEffect(() => {
    if (isBuyTxLoading) {
      toast({
        title: "Transaction Pending",
        description: "Your purchase transaction is being confirmed...",
      })
    }
    if (isBuyTxSuccess) {
      toast({
        title: "Transaction Successful!",
        description: "You have purchased the NFT successfully!",
      })
      // Once done, reset local state
      setBuyingItemId(null)
      // Possibly refetch items here
      fetchMarketplaceItems(true)
    }
    if (isBuyTxError) {
      toast({
        title: "Transaction Failed",
        description:
          buyTxReceiptError?.message ||
          buyError?.message ||
          "Something went wrong.",
        variant: "destructive",
      })
      // Reset local state on error
      setBuyingItemId(null)
    }
  }, [isBuyTxLoading, isBuyTxSuccess, isBuyTxError, buyTxReceiptError, buyError, toast])

  // IMPORTANT: Handle user rejection in MetaMask or immediate errors from `writeBuyContract`
  useEffect(() => {
    if (buyError) {
      // The user might have canceled the transaction or an error occurred
      setBuyingItemId(null)
      toast({
        title: "Transaction Rejected",
        description:
          buyError.message ||
          "User canceled transaction in wallet or an error occurred.",
        variant: "destructive",
      })
    }
  }, [buyError, toast])

  const publicClient = usePublicClient()
  const aiNftExchange = useContract("AINFTExchange")

  // Toggle between grid or list layout
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Sidebar open for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Real data from on-chain
  const [listedItems, setListedItems] = useState<MarketplaceItem[]>([])
  const fetchedRef = useRef(false)

  // Filter states that the user sees/edits immediately:
  const [tempSearch, setTempSearch] = useState("")
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 10])
  const [tempBuyNow, setTempBuyNow] = useState(false)
  const [tempOnAuction, setTempOnAuction] = useState(false)
  const [tempNew, setTempNew] = useState(false)
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>([])

  // Final filter states, which we only update when "Apply Filters" is clicked
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10])
  const [buyNow, setBuyNow] = useState(false)
  const [onAuction, setOnAuction] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Categories for demonstration
  const categories = ["Art", "Music", "Virtual Worlds", "Trading Cards", "Collectibles"]

  const toggleTempCategory = (category: string) => {
    setTempSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  // "Apply Filters" merges all temp states into final states
  function handleApplyFilters() {
    setSearchTerm(tempSearch)
    setPriceRange(tempPriceRange)
    setBuyNow(tempBuyNow)
    setOnAuction(tempOnAuction)
    setShowNew(tempNew)
    setSelectedCategories(tempSelectedCategories)
    // Close sidebar if on mobile
    setSidebarOpen(false)
  }

  // Fetch items from the exchange
  async function fetchMarketplaceItems(forceRefresh?: boolean) {
    if (!aiNftExchange?.address || !aiNftExchange?.abi || !publicClient) return
    // avoid repeated fetch, unless forced
    if (!forceRefresh && fetchedRef.current) return
    fetchedRef.current = true

    try {
      const totalItemId = await publicClient.readContract({
        address: aiNftExchange.address as `0x${string}`,
        abi: aiNftExchange.abi,
        functionName: "getLatestItemId",
        args: [],
      })
      if (typeof totalItemId !== "bigint") return

      const newListed: MarketplaceItem[] = []
      for (let i = BigInt(1); i <= totalItemId; i++) {
        try {
          // itemData => [itemId, creator, xpValue, isOnSale, salePrice, resourceUrl]
          const data = await publicClient.readContract({
            address: aiNftExchange.address as `0x${string}`,
            abi: aiNftExchange.abi,
            functionName: "itemData",
            args: [i],
          }) as [bigint, string, bigint, boolean, bigint, string]

          // fetch the owner
          const owner = await publicClient.readContract({
            address: aiNftExchange.address as `0x${string}`,
            abi: aiNftExchange.abi,
            functionName: "ownerOf",
            args: [i],
          }) as `0x${string}`

          // We only want items that exist. If it doesn't, readContract will fail => catch
          newListed.push({
            itemId: data[0],
            creator: data[1],
            xpValue: data[2],
            isOnSale: data[3],
            salePrice: data[4],
            resourceUrl: data[5],
            owner,
          })
        } catch (_err) {
          // skip invalid
        }
      }
      setListedItems(newListed)
    } catch (err) {
      console.error("Error fetching marketplace items:", err)
    }
  }

  useEffect(() => {
    fetchMarketplaceItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiNftExchange, publicClient])

  // Compute the final filtered array
  const filteredItems = React.useMemo(() => {
    return listedItems.filter((item) => {
      // Price range filter
      const numericPrice = Number(item.salePrice) / 1e18
      if (numericPrice < priceRange[0] || numericPrice > priceRange[1]) {
        return false
      }

      // "Buy Now" filter => isOnSale == true
      if (buyNow && !item.isOnSale) {
        return false
      }

      // "On Auction" is not truly implemented. If user checks "On Auction," we'll skip items not on sale
      if (onAuction) {
        if (!item.isOnSale) return false
      }

      // "New" filter => let's define new as top 5 item IDs
      if (showNew) {
        const maxItemId = listedItems.reduce((acc, cur) => (cur.itemId > acc ? cur.itemId : acc), BigInt(0))
        if (item.itemId < maxItemId - BigInt(5)) {
          return false
        }
      }

      // category filter is not actually stored in data. We'll do a fallback:
      // If categories are selected, require "Art" is in the categories to keep item
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes("Art")) {
          return false
        }
      }

      // search filter => check if itemId or resourceUrl
      const itemIdStr = String(item.itemId)
      const lowerSearch = searchTerm.toLowerCase()
      const lowerResource = item.resourceUrl.toLowerCase()
      if (searchTerm) {
        if (!itemIdStr.includes(searchTerm) && !lowerResource.includes(lowerSearch)) {
          return false
        }
      }

      return true
    })
  }, [listedItems, priceRange, buyNow, onAuction, showNew, selectedCategories, searchTerm])

  // Handle "Buy" button
  async function handleBuy(item: MarketplaceItem) {
    try {
      if (!wagmiAddress) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet before buying.",
          variant: "destructive",
        })
        return
      }
      if (!item.isOnSale) {
        toast({
          title: "Item not for sale",
          description: "That item is not currently for sale.",
          variant: "destructive",
        })
        return
      }
      if (!aiNftExchange) {
        toast({
          title: "No Contract Found",
          description: "AINFTExchange contract not found. Check your chain or config.",
          variant: "destructive",
        })
        return
      }
      // Check if user is the owner
      if (wagmiAddress.toLowerCase() === item.owner.toLowerCase()) {
        toast({
          title: "Already Owned",
          description: "You already own this NFT. You can't buy your own NFT.",
          variant: "destructive",
        })
        return
      }

      // Mark this item as being purchased, so only its button changes to "Processing..."
      setBuyingItemId(item.itemId)

      const purchaseNFT = {
        name: "purchaseAIItem",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "itemId", type: "uint256" }],
        outputs: [],
      }
      // send item.salePrice as value
      await writeBuyContract({
        address: aiNftExchange.address as `0x${string}`,
        abi: [purchaseNFT],
        functionName: "purchaseAIItem",
        args: [item.itemId],
        value: item.salePrice,
      })

      toast({
        title: "Purchase Transaction",
        description: "Transaction submitted... awaiting confirmation.",
      })
    } catch (err: any) {
      // Reset local state if the transaction call fails immediately
      setBuyingItemId(null)
      toast({
        title: "Purchase Failure",
        description: err.message || "Unable to buy NFT",
        variant: "destructive",
      })
    }
  }

  return (
    <main className="relative flex min-h-screen bg-white dark:bg-gray-900 text-foreground">
      {/* Sidebar (Filters) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0`}
      >
        <Card className="h-full border-r border-border rounded-none">
          <CardHeader className="p-4 border-b border-border bg-secondary text-secondary-foreground">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Filters</CardTitle>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-auto px-4 py-4 space-y-6">
            {/* Search */}
            <div className="rounded-md p-3 bg-accent/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search items"
                  value={tempSearch}
                  onChange={(e) => setTempSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Accordion Filters */}
            <Accordion type="multiple" className="w-full">
              {/* Status */}
              <AccordionItem value="status">
                <AccordionTrigger>Status</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={tempBuyNow}
                        onChange={(e) => setTempBuyNow(e.target.checked)}
                      />
                      <span>Buy Now</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={tempOnAuction}
                        onChange={(e) => setTempOnAuction(e.target.checked)}
                      />
                      <span>On Auction</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={tempNew}
                        onChange={(e) => setTempNew(e.target.checked)}
                      />
                      <span>New</span>
                    </label>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Price */}
              <AccordionItem value="price">
                <AccordionTrigger>Price Range</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mt-2">
                    <DualRangeSlider
                      min={0}
                      max={10}
                      step={0.1}
                      value={tempPriceRange}
                      onValueChange={(value) => setTempPriceRange([value[0], value[1]])}
                    />
                    <div className="flex justify-between gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        value={tempPriceRange[0]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          setTempPriceRange([val, tempPriceRange[1]])
                        }}
                        className="w-20"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        value={tempPriceRange[1]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          setTempPriceRange([tempPriceRange[0], val])
                        }}
                        className="w-20"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Categories */}
              <AccordionItem value="categories">
                <AccordionTrigger>Categories</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((category) => (
                      <Badge
                        key={category}
                        variant={tempSelectedCategories.includes(category) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTempCategory(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="pt-2">
              <Button variant="outline" className="w-full" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-4 py-6 sm:px-6 md:px-8">
        {/* Header / Links */}
        <header className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-3xl font-extrabold text-primary">AIPenGuild Marketplace</h1>
          <div className="flex items-center gap-2">
            <Link href="/my-nfts">
              <Button variant="outline" size="sm">
                My NFTs
              </Button>
            </Link>
            <Link href="/mint">
              <Button size="sm">Generate AI NFT</Button>
            </Link>
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              Filters
            </Button>
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

        {/* Items */}
        {filteredItems.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-16">
            No items found for the given filters.
          </p>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {filteredItems.map((item) => {
                  const isOwner = wagmiAddress?.toLowerCase() === item.owner.toLowerCase()
                  return (
                    <div
                      key={String(item.itemId)}
                      className="group overflow-hidden rounded-lg border border-border p-3 transition-shadow hover:shadow-lg"
                    >
                      <div className="relative h-60 w-full overflow-hidden rounded-md bg-secondary">
                        <MarketplaceImage resourceUrl={item.resourceUrl} />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">AIPenGuild NFT #{String(item.itemId)}</h2>
                        <span className="text-xs text-primary font-bold">
                          {(Number(item.salePrice) / 1e18).toFixed(4)} ETH
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Owner: {item.owner.slice(0, 6)}...{item.owner.slice(-4)}
                      </p>
                      {item.isOnSale && !isOwner && (
                        <Button
                          variant="default"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => handleBuy(item)}
                          disabled={buyingItemId === item.itemId}
                        >
                          {buyingItemId === item.itemId ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Buy"
                          )}
                        </Button>
                      )}
                      {item.isOnSale && isOwner && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          You own this NFT. You cannot buy it.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredItems.map((item) => {
                  const isOwner = wagmiAddress?.toLowerCase() === item.owner.toLowerCase()
                  return (
                    <div
                      key={String(item.itemId)}
                      className="flex flex-col items-start gap-4 rounded-lg border border-border p-4 transition-shadow hover:shadow-md sm:flex-row"
                    >
                      <div className="relative h-36 w-full flex-shrink-0 overflow-hidden rounded-md bg-secondary sm:w-36">
                        <MarketplaceImage resourceUrl={item.resourceUrl} />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <h3 className="text-base font-semibold">
                          AI NFT #{String(item.itemId)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Owner: {item.owner.slice(0, 6)}...{item.owner.slice(-4)}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className="text-sm font-bold text-primary">
                          {(Number(item.salePrice) / 1e18).toFixed(4)} ETH
                        </span>
                        {item.isOnSale && !isOwner && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleBuy(item)}
                            disabled={buyingItemId === item.itemId}
                          >
                            {buyingItemId === item.itemId ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Buy"
                            )}
                          </Button>
                        )}
                        {item.isOnSale && isOwner && (
                          <p className="text-xs text-muted-foreground">
                            You own this NFT. You cannot buy it.
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

/**
 * Helper to display the NFT image. If IPFS or HTTP, we do <Image> with remote patterns.
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