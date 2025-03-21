'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DualRangeSlider } from "@/components/ui/dual-range-slider"
import { Input } from "@/components/ui/input"
import { useNativeCurrencySymbol } from "@/hooks/use-native-currency-symbol"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { fetchNftMetadata, ParsedNftMetadata } from "@/lib/nft-metadata"
import { transformIpfsUriToHttp } from "@/lib/ipfs"
import { Grid2X2, LayoutList, Loader2, Search, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useRef, useState } from "react"
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi"

interface MarketplaceItem {
  itemId: bigint
  creator: string
  xpValue: bigint
  resourceUrl: string
  mintedAt: bigint
  isOnSale: boolean
  salePrice: bigint
  owner: string
}

export default function MarketplacePage() {
  const { toast } = useToast()
  const currencySymbol = useNativeCurrencySymbol()
  const { address: wagmiAddress } = useAccount()

  // For the buy transaction (shared across items)
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

  // Contract references
  const publicClient = usePublicClient()
  const nftMarketplaceHub = useContract("NFTMarketplaceHub")
  const nftMintingPlatform = useContract("NFTMintingPlatform")

  // On-page states
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [listedItems, setListedItems] = useState<MarketplaceItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fetchedRef = useRef(false)

  // For local filter states
  const [tempSearch, setTempSearch] = useState("")
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 10])
  // Applied filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10])

  // Which item is being purchased
  const [buyingItemId, setBuyingItemId] = useState<bigint | null>(null)

  // For storing metadata from JSON
  const [metadataMap, setMetadataMap] = useState<Record<string, ParsedNftMetadata>>({})

  // Transaction watchers
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
      setBuyingItemId(null)
      // Reload marketplace after successful purchase
      fetchMarketplaceItems(true)
    }
    if (isBuyTxError) {
      toast({
        title: "Transaction Failed",
        description: buyTxReceiptError?.message || buyError?.message || "Something went wrong.",
        variant: "destructive",
      })
      setBuyingItemId(null)
    }
  }, [
    isBuyTxLoading,
    isBuyTxSuccess,
    isBuyTxError,
    buyTxReceiptError,
    buyError,
    toast,
  ])

  // Filter application
  function handleApplyFilters() {
    setSearchTerm(tempSearch)
    setPriceRange(tempPriceRange)
    setSidebarOpen(false)
  }

  // Fetch items
  async function fetchMarketplaceItems(forceRefresh?: boolean) {
    if (!nftMarketplaceHub?.address || !nftMarketplaceHub?.abi) return
    if (!nftMintingPlatform?.address || !nftMintingPlatform?.abi) return
    if (!publicClient) return

    if (!forceRefresh && fetchedRef.current) return
    fetchedRef.current = true

    setIsLoading(true)
    try {
      // 1) read total minted from NFTMintingPlatform
      const totalItemId = await publicClient.readContract({
        address: nftMintingPlatform.address as `0x${string}`,
        abi: nftMintingPlatform.abi,
        functionName: "getLatestMintedId",
        args: [],
      })
      if (typeof totalItemId !== "bigint") {
        setIsLoading(false)
        return
      }

      const newListed: MarketplaceItem[] = []
      for (let i = 1n; i <= totalItemId; i++) {
        try {
          // read MarketItem from marketplace
          const marketData = await publicClient.readContract({
            address: nftMarketplaceHub.address as `0x${string}`,
            abi: nftMarketplaceHub.abi,
            functionName: "marketItems",
            args: [i],
          }) as [boolean, bigint]

          const isOnSale = marketData[0]
          const salePrice = marketData[1]

          // read the NFT's core data from NFTMintingPlatform
          const nftItem = await publicClient.readContract({
            address: nftMintingPlatform.address as `0x${string}`,
            abi: nftMintingPlatform.abi,
            functionName: "nftItems",
            args: [i],
          }) as [bigint, string, bigint, string]

          const xpValue = nftItem[0]
          const resourceUrl = nftItem[1]
          const mintedAt = nftItem[2]
          const creator = nftItem[3]

          // read current owner
          const owner = await publicClient.readContract({
            address: nftMintingPlatform.address as `0x${string}`,
            abi: nftMintingPlatform.abi,
            functionName: "ownerOf",
            args: [i],
          }) as `0x${string}`

          newListed.push({
            itemId: i,
            creator,
            xpValue,
            resourceUrl,
            mintedAt,
            isOnSale,
            salePrice,
            owner,
          })
        } catch {
          // skip invalid
        }
      }
      setListedItems(newListed)
    } catch (err) {
      console.error("Error fetching marketplace items:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load metadata for newly fetched items
  async function loadMarketplaceMetadata(items: MarketplaceItem[]) {
    const newMap: Record<string, ParsedNftMetadata> = { ...metadataMap }

    for (const item of items) {
      const itemIdStr = String(item.itemId)
      if (!newMap[itemIdStr]) {
        try {
          const parsed = await fetchNftMetadata(item.resourceUrl)
          newMap[itemIdStr] = parsed
        } catch {
          // ignore fetch errors
          newMap[itemIdStr] = {
            imageUrl: transformIpfsUriToHttp(item.resourceUrl),
            name: "",
            description: "",
            attributes: {}
          }
        }
      }
    }
    setMetadataMap(newMap)
  }

  // Re-run metadata loading whenever listedItems changes
  useEffect(() => {
    if (listedItems.length) {
      loadMarketplaceMetadata(listedItems)
    }
  }, [listedItems]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMarketplaceItems()
  }, [nftMarketplaceHub, nftMintingPlatform, publicClient])

  // Final filtered array
  const filteredItems = React.useMemo(() => {
    return listedItems
      .filter((item) => item.isOnSale)
      .filter((item) => {
        const numericPrice = Number(item.salePrice) / 1e18
        if (numericPrice < priceRange[0] || numericPrice > priceRange[1]) {
          return false
        }
        // Search
        if (searchTerm) {
          const itemIdStr = String(item.itemId)
          const lowerSearch = searchTerm.toLowerCase()
          const lowerResource = item.resourceUrl.toLowerCase()
          if (!itemIdStr.includes(searchTerm) && !lowerResource.includes(lowerSearch)) {
            return false
          }
        }
        return true
      })
  }, [listedItems, priceRange, searchTerm])

  // Handle "Buy"
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
      if (!nftMarketplaceHub?.address) {
        toast({
          title: "No Contract Found",
          description: "NFTMarketplaceHub contract not found. Check your chain or config.",
          variant: "destructive",
        })
        return
      }
      // check if user is owner
      if (item.owner.toLowerCase() === wagmiAddress.toLowerCase()) {
        toast({
          title: "Already Owned",
          description: "You already own this NFT. You can't buy your own NFT.",
          variant: "destructive",
        })
        return
      }

      setBuyingItemId(item.itemId)

      const purchaseABI = {
        name: "purchaseNFTItem",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "itemId", type: "uint256" }],
        outputs: [],
      }

      await writeBuyContract({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: [purchaseABI],
        functionName: "purchaseNFTItem",
        args: [item.itemId],
        value: item.salePrice,
      })

      toast({
        title: "Purchase Transaction",
        description: "Transaction submitted... awaiting confirmation.",
      })
    } catch (err: any) {
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
        className={`fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:relative md:translate-x-0`}
      >
        <Card className="h-full border-r border-border rounded-none">
          <CardHeader className="p-4 border-b border-border bg-secondary text-secondary-foreground">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Filters</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(false)}
              >
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
            {/* Price Range */}
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="price">
                <AccordionTrigger>Price Range</AccordionTrigger>
                <AccordionContent>
                  <div className="mt-2 space-y-4">
                    <DualRangeSlider
                      min={0}
                      max={10}
                      step={0.1}
                      value={tempPriceRange}
                      onValueChange={(val) => setTempPriceRange([val[0], val[1]])}
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>{tempPriceRange[0]} {currencySymbol}</span>
                      <span>{tempPriceRange[1]} {currencySymbol}</span>
                    </div>
                    <div className="flex justify-between gap-2 text-sm">
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
        {/* Header */}
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
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              Filters
            </Button>
          </div>
        </header>

        {/* View Mode Toggle */}
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

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Loading marketplace items...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            No items found for the given filters.
          </p>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {filteredItems.map((item) => {
                  const isOwner = wagmiAddress?.toLowerCase() === item.owner.toLowerCase()
                  const itemIdStr = String(item.itemId)
                  const meta = metadataMap[itemIdStr] || { imageUrl: transformIpfsUriToHttp(item.resourceUrl), name: "", description: "", attributes: {} }

                  return (
                    <div
                      key={itemIdStr}
                      className="group overflow-hidden rounded-lg border border-border p-3 transition-shadow hover:shadow-lg"
                    >
                      <div className="relative h-60 w-full overflow-hidden rounded-md bg-secondary">
                        <Image
                          src={meta.imageUrl}
                          alt="NFT"
                          fill
                          sizes="(max-width: 768px) 100vw,
                                 (max-width: 1200px) 50vw,
                                 33vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">
                          {meta.name ? meta.name : `AIPenGuild NFT #${itemIdStr}`}
                        </h2>
                        <span className="text-xs font-bold text-primary">
                          {(Number(item.salePrice) / 1e18).toFixed(4)} {currencySymbol}
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
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Buy"
                          )}
                        </Button>
                      )}
                      {item.isOnSale && isOwner && (
                        <Button variant="secondary" size="sm" className="mt-2 w-full" disabled>
                          You own this NFT. You cannot buy it.
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredItems.map((item) => {
                  const isOwner = wagmiAddress?.toLowerCase() === item.owner.toLowerCase()
                  const itemIdStr = String(item.itemId)
                  const meta = metadataMap[itemIdStr] || { imageUrl: transformIpfsUriToHttp(item.resourceUrl), name: "", description: "", attributes: {} }

                  return (
                    <div
                      key={itemIdStr}
                      className="flex flex-col items-start gap-4 rounded-lg border border-border p-4 transition-shadow hover:shadow-md sm:flex-row"
                    >
                      <div className="relative h-36 w-full flex-shrink-0 overflow-hidden rounded-md bg-secondary sm:w-36">
                        <Image
                          src={meta.imageUrl}
                          alt="NFT"
                          fill
                          sizes="(max-width: 768px) 100vw,
                                 (max-width: 1200px) 50vw,
                                 33vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <h3 className="text-base font-semibold">
                          {meta.name ? meta.name : `AI NFT #${itemIdStr}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Owner: {item.owner.slice(0, 6)}...{item.owner.slice(-4)}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className="text-sm font-bold text-primary">
                          {(Number(item.salePrice) / 1e18).toFixed(4)} {currencySymbol}
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
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Buy"
                            )}
                          </Button>
                        )}
                        {item.isOnSale && isOwner && (
                          <Button variant="secondary" size="sm" disabled>
                            You own this NFT. You cannot buy it.
                          </Button>
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