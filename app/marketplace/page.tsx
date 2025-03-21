'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DualRangeSlider } from "@/components/ui/dual-range-slider"
import { Input } from "@/components/ui/input"
import { TransactionStatus } from "@/components/ui/transaction-status"
import { useNativeCurrencySymbol } from "@/hooks/use-native-currency-symbol"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { transformIpfsUriToHttp } from "@/lib/ipfs"
import {
  NFT_CATEGORIES,
  NFT_RARITIES
} from "@/lib/metadata-constants"
import { fetchAllNFTs, NFTItem } from "@/lib/nft-data"
import { fetchNftMetadata, ParsedNftMetadata } from "@/lib/nft-metadata"
import { Grid2X2, LayoutList, Loader2, Search, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useRef, useState } from "react"
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi"

interface BuyTxState {
  loading: boolean
  success: boolean
  error: string | null
  txHash: `0x${string}` | null
}

/**
 * Additional typed fields to facilitate advanced attribute filters:
 * We'll store numeric range for the relevant attributes per category.
 */
interface AttributeFilterRanges {
  strength: [number, number]
  agility: [number, number]
  durability: [number, number]
  power: [number, number]
  duration: [number, number]
}

export default function MarketplacePage() {
  const { toast } = useToast()
  const currencySymbol = useNativeCurrencySymbol()
  const { address: wagmiAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId() || 1287
  const publicClient = usePublicClient()

  // Contracts
  const nftMarketplaceHub = useContract("NFTMarketplaceHub")
  const nftMintingPlatform = useContract("NFTMintingPlatform")
  const nftStakingPool = useContract("NFTStakingPool")

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [listedItems, setListedItems] = useState<NFTItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fetchedRef = useRef(false)

  // Basic Filters
  const [tempSearch, setTempSearch] = useState("")
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 10])
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10])

  // New Advanced Filters
  // Categories (multiple selection)
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Rarities (multiple selection)
  const [tempSelectedRarities, setTempSelectedRarities] = useState<string[]>([])
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])

  // Numeric attribute filter states:
  // We'll define default ranges that cover 0..150 for simplicity
  // Then store user input in "temp" states, and apply them upon "Apply Filters".
  const defaultAttribRanges: AttributeFilterRanges = {
    strength: [0, 150],
    agility: [0, 150],
    durability: [0, 150],
    power: [0, 150],
    duration: [0, 300]
  }
  const [tempAttribRanges, setTempAttribRanges] = useState<AttributeFilterRanges>(defaultAttribRanges)
  const [attribRanges, setAttribRanges] = useState<AttributeFilterRanges>(defaultAttribRanges)

  // We'll keep a metadata cache
  const [metadataMap, setMetadataMap] = useState<Record<string, ParsedNftMetadata>>({})

  // A local dictionary for each NFT's buy transaction state, keyed by itemId
  const [buyTxMap, setBuyTxMap] = useState<Record<string, BuyTxState>>({})

  function updateBuyTxMap(itemId: string, patch: Partial<BuyTxState>) {
    setBuyTxMap((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...patch
      }
    }))
  }

  async function handleBuy(item: NFTItem) {
    try {
      if (!wagmiAddress) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet before buying.",
          variant: "destructive"
        })
        return
      }
      if (!item.isOnSale) {
        toast({
          title: "Item not for sale",
          description: "That item is not currently for sale.",
          variant: "destructive"
        })
        return
      }
      if (!nftMarketplaceHub?.address || !nftMarketplaceHub?.abi) {
        toast({
          title: "No Contract Found",
          description: "NFTMarketplaceHub contract not found. Check your chain or config.",
          variant: "destructive"
        })
        return
      }
      if (item.owner.toLowerCase() === wagmiAddress.toLowerCase()) {
        toast({
          title: "Already Owned",
          description: "You already own this NFT. You can't buy your own NFT.",
          variant: "destructive"
        })
        return
      }
      if (!walletClient || !publicClient) {
        toast({
          title: "Missing Clients",
          description: "No wallet or public client found. Please check your connection.",
          variant: "destructive"
        })
        return
      }

      const itemIdStr = String(item.itemId)

      updateBuyTxMap(itemIdStr, {
        loading: true,
        success: false,
        error: null,
        txHash: null
      })

      const purchaseABI = {
        name: "purchaseNFTItem",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "itemId", type: "uint256" }],
        outputs: []
      }

      const hash = await walletClient.writeContract({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: [purchaseABI],
        functionName: "purchaseNFTItem",
        args: [item.itemId],
        value: item.salePrice
      })

      updateBuyTxMap(itemIdStr, { txHash: hash })

      toast({
        title: "Purchase Transaction",
        description: "Transaction submitted... awaiting confirmation."
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt?.status === "reverted") {
        updateBuyTxMap(itemIdStr, {
          loading: false,
          success: false,
          error: "Transaction reverted on-chain."
        })
        toast({
          title: "Transaction Failed",
          description: "Reverted on-chain.",
          variant: "destructive"
        })
        return
      }

      updateBuyTxMap(itemIdStr, {
        loading: false,
        success: true,
        error: null
      })

      toast({
        title: "Transaction Successful!",
        description: "You have purchased the NFT successfully!"
      })

      // Refresh the marketplace
      fetchMarketplaceItems(true)
    } catch (err: any) {
      const msg = err?.message || "Unable to buy NFT"
      updateBuyTxMap(String(item.itemId), {
        loading: false,
        success: false,
        error: msg
      })
      toast({
        title: "Purchase Failure",
        description: msg,
        variant: "destructive"
      })
    }
  }

  function handleApplyFilters() {
    setSearchTerm(tempSearch)
    setPriceRange(tempPriceRange)
    setSelectedCategories([...tempSelectedCategories])
    setSelectedRarities([...tempSelectedRarities])
    setAttribRanges({ ...tempAttribRanges })
    setSidebarOpen(false)
  }

  async function fetchMarketplaceItems(forceRefresh?: boolean) {
    if (
      !nftMarketplaceHub?.address ||
      !nftMarketplaceHub?.abi ||
      !nftMintingPlatform?.address ||
      !nftMintingPlatform?.abi ||
      !nftStakingPool?.address ||
      !nftStakingPool?.abi ||
      !publicClient
    ) {
      return
    }
    if (!forceRefresh && fetchedRef.current) return
    fetchedRef.current = true

    setIsLoading(true)
    try {
      const allNfts = await fetchAllNFTs(
        publicClient,
        nftMintingPlatform,
        nftMarketplaceHub,
        nftStakingPool
      )
      setListedItems(allNfts)

      const newMap: Record<string, ParsedNftMetadata> = {}
      for (const item of allNfts) {
        const idStr = String(item.itemId)
        if (!newMap[idStr]) {
          try {
            const parsed = await fetchNftMetadata(item.resourceUrl)
            newMap[idStr] = parsed
          } catch {
            newMap[idStr] = {
              imageUrl: transformIpfsUriToHttp(item.resourceUrl),
              name: "",
              description: "",
              attributes: {}
            }
          }
        }
      }
      setMetadataMap(newMap)
    } catch (err) {
      toast({
        title: "Error",
        description: "Unable to load marketplace items. Try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketplaceItems()
  }, [nftMarketplaceHub, nftMintingPlatform, nftStakingPool, publicClient])

  const filteredItems = React.useMemo(() => {
    return listedItems
      .filter((item) => item.isOnSale)
      .filter((item) => {
        // Price filter
        const numericPrice = Number(item.salePrice) / 1e18
        if (numericPrice < priceRange[0] || numericPrice > priceRange[1]) {
          return false
        }

        // searchTerm filter
        if (searchTerm) {
          const idStr = String(item.itemId)
          const lowerResource = item.resourceUrl.toLowerCase()
          const lowerSearch = searchTerm.toLowerCase()
          // We check if itemId includes searchTerm or resourceUrl includes it
          if (!idStr.includes(searchTerm) && !lowerResource.includes(lowerSearch)) {
            return false
          }
        }

        // advanced filters
        const meta = metadataMap[String(item.itemId)]
        if (!meta) {
          // If no metadata is found, skip if advanced filters are used
          if (selectedCategories.length > 0 || selectedRarities.length > 0) {
            return false
          }
          return true
        }

        const { attributes } = meta
        // Category filter
        if (selectedCategories.length > 0) {
          const nftCategory = (attributes.category as string) || ""
          if (!selectedCategories.includes(nftCategory)) {
            return false
          }
        }

        // Rarity filter
        if (selectedRarities.length > 0) {
          const nftRarity = (attributes.rarity as string) || ""
          if (!selectedRarities.includes(nftRarity)) {
            return false
          }
        }

        // Numeric attribute filtering
        // We'll do it only if attribute is present
        for (const [attrName, [minVal, maxVal]] of Object.entries(attribRanges)) {
          if (attributes.hasOwnProperty(attrName)) {
            const numericAttr = Number(attributes[attrName])
            if (isNaN(numericAttr)) {
              // If we can't parse it, treat as failing the filter
              return false
            }
            if (numericAttr < minVal || numericAttr > maxVal) {
              return false
            }
          }
        }

        return true
      })
  }, [
    listedItems,
    priceRange,
    searchTerm,
    selectedCategories,
    selectedRarities,
    attribRanges,
    metadataMap
  ])

  function toggleCategory(cat: string) {
    setTempSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat)
      } else {
        return [...prev, cat]
      }
    })
  }

  function toggleRarity(r: string) {
    setTempSelectedRarities((prev) => {
      if (prev.includes(r)) {
        return prev.filter((c) => c !== r)
      } else {
        return [...prev, r]
      }
    })
  }

  return (
    <main className="relative flex min-h-screen bg-white dark:bg-gray-900 text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:relative md:translate-x-0`}
      >
        <Card className="h-full border-r border-border rounded-none">
          <CardHeader className="p-4 border-b border-border bg-secondary text-secondary-foreground rounded-t-lg">
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

              <AccordionItem value="categories">
                <AccordionTrigger>Categories</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2 mt-2">
                    {NFT_CATEGORIES.map((cat) => (
                      <div key={cat} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={tempSelectedCategories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                        />
                        <label>{cat}</label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="rarities">
                <AccordionTrigger>Rarity</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2 mt-2">
                    {NFT_RARITIES.map((r) => (
                      <div key={r} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={tempSelectedRarities.includes(r)}
                          onChange={() => toggleRarity(r)}
                        />
                        <label>{r}</label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="attributes">
                <AccordionTrigger>Attributes</AccordionTrigger>
                <AccordionContent>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Specify numeric ranges for each attribute if you'd like to filter by them.
                    Only NFTs that have the attribute in their metadata will be filtered.
                  </p>
                  {/* Strength range */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium">Strength</label>
                    <DualRangeSlider
                      min={0}
                      max={150}
                      step={1}
                      value={tempAttribRanges.strength}
                      onValueChange={(val) =>
                        setTempAttribRanges((prev) => ({ ...prev, strength: [val[0], val[1]] }))
                      }
                    />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{tempAttribRanges.strength[0]}</span>
                      <span>{tempAttribRanges.strength[1]}</span>
                    </div>
                  </div>

                  {/* Agility range */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium">Agility</label>
                    <DualRangeSlider
                      min={0}
                      max={150}
                      step={1}
                      value={tempAttribRanges.agility}
                      onValueChange={(val) =>
                        setTempAttribRanges((prev) => ({ ...prev, agility: [val[0], val[1]] }))
                      }
                    />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{tempAttribRanges.agility[0]}</span>
                      <span>{tempAttribRanges.agility[1]}</span>
                    </div>
                  </div>

                  {/* Durability range */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium">Durability</label>
                    <DualRangeSlider
                      min={0}
                      max={150}
                      step={1}
                      value={tempAttribRanges.durability}
                      onValueChange={(val) =>
                        setTempAttribRanges((prev) => ({ ...prev, durability: [val[0], val[1]] }))
                      }
                    />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{tempAttribRanges.durability[0]}</span>
                      <span>{tempAttribRanges.durability[1]}</span>
                    </div>
                  </div>

                  {/* Power range */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium">Power</label>
                    <DualRangeSlider
                      min={0}
                      max={150}
                      step={1}
                      value={tempAttribRanges.power}
                      onValueChange={(val) =>
                        setTempAttribRanges((prev) => ({ ...prev, power: [val[0], val[1]] }))
                      }
                    />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{tempAttribRanges.power[0]}</span>
                      <span>{tempAttribRanges.power[1]}</span>
                    </div>
                  </div>

                  {/* Duration range */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium">Duration</label>
                    <DualRangeSlider
                      min={0}
                      max={300}
                      step={1}
                      value={tempAttribRanges.duration}
                      onValueChange={(val) =>
                        setTempAttribRanges((prev) => ({ ...prev, duration: [val[0], val[1]] }))
                      }
                    />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{tempAttribRanges.duration[0]}</span>
                      <span>{tempAttribRanges.duration[1]}</span>
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

      <div className="flex-1 flex flex-col px-4 py-6 sm:px-6 md:px-8">
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
                  const meta = metadataMap[itemIdStr] || {
                    imageUrl: transformIpfsUriToHttp(item.resourceUrl),
                    name: "",
                    description: "",
                    attributes: {}
                  }
                  const buyTx = buyTxMap[itemIdStr] || {
                    loading: false,
                    success: false,
                    error: null,
                    txHash: null
                  }

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
                          disabled={buyTx.loading}
                        >
                          {buyTx.loading ? (
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

                      <TransactionStatus
                        isLoading={buyTx.loading}
                        isSuccess={buyTx.success}
                        errorMessage={buyTx.error || undefined}
                        txHash={buyTx.txHash || undefined}
                        chainId={chainId}
                        className="mt-2"
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredItems.map((item) => {
                  const isOwner = wagmiAddress?.toLowerCase() === item.owner.toLowerCase()
                  const itemIdStr = String(item.itemId)
                  const meta = metadataMap[itemIdStr] || {
                    imageUrl: transformIpfsUriToHttp(item.resourceUrl),
                    name: "",
                    description: "",
                    attributes: {}
                  }
                  const buyTx = buyTxMap[itemIdStr] || {
                    loading: false,
                    success: false,
                    error: null,
                    txHash: null
                  }

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
                            disabled={buyTx.loading}
                          >
                            {buyTx.loading ? (
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

                        <TransactionStatus
                          isLoading={buyTx.loading}
                          isSuccess={buyTx.success}
                          errorMessage={buyTx.error || undefined}
                          txHash={buyTx.txHash || undefined}
                          chainId={chainId}
                          className="mt-2"
                        />
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