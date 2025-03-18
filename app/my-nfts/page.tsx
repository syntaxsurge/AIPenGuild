'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useRef, useState } from "react"
import { parseAbiItem, parseEther } from "viem"
import {
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi"

/**
 * Describes the data for each staked NFT (if the user staked it).
 */
interface StakeInfo {
  staker: `0x${string}`
  startTimestamp: bigint
  lastClaimed: bigint
  staked: boolean
}

/**
 * Main NFT details from the NFTMarketplaceHub
 */
interface NFTDetails {
  itemId: bigint
  creator: string
  xpValue: bigint
  isOnSale: boolean
  salePrice: bigint
  resourceUrl: string
  stakeInfo?: StakeInfo
  mintedTime?: number  // block timestamp if found from logs
}

/**
 * For storing metadata (like image, name, description) if resourceUrl points to JSON
 */
interface MetadataState {
  imageUrl?: string
  name?: string
  description?: string
}

export default function MyNFTsPage() {
  const { address: wagmiAddress } = useAccount()
  const publicClient = usePublicClient()
  const { toast } = useToast()

  // Contracts
  const nftMarketplaceHub = useContract("NFTMarketplaceHub")
  const nftStakingPool = useContract("NFTStakingPool")

  // List/Unlist contract calls
  const {
    data: listWriteData,
    error: listError,
    isPending: isListPending,
    isSuccess: isListSuccess,
    writeContract: writeListContract,
  } = useWriteContract()

  const {
    data: listTxReceipt,
    isLoading: isListTxLoading,
    isSuccess: isListTxSuccess,
    isError: isListTxError,
    error: listTxReceiptError
  } = useWaitForTransactionReceipt({ hash: listWriteData ?? undefined })

  const {
    data: unlistWriteData,
    error: unlistError,
    isPending: isUnlistPending,
    writeContract: writeUnlistContract
  } = useWriteContract()

  const {
    data: unlistTxReceipt,
    isLoading: isUnlistTxLoading,
    isSuccess: isUnlistTxSuccess,
    isError: isUnlistTxError,
    error: unlistTxReceiptError
  } = useWaitForTransactionReceipt({ hash: unlistWriteData ?? undefined })

  // States
  const [price, setPrice] = useState("")
  const [userNFTs, setUserNFTs] = useState<NFTDetails[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTDetails | null>(null)
  const [metadataMap, setMetadataMap] = useState<Record<string, MetadataState>>({})
  const [currentMaxId, setCurrentMaxId] = useState<bigint | null>(null)
  const [loadingNFTs, setLoadingNFTs] = useState(false)

  // Track minted times for each item
  const mintedTimeMapRef = useRef<Map<bigint, number>>(new Map())

  // Only fetch once
  const fetchedRef = useRef(false)

  // Are we busy listing or unlisting
  const isListingTxBusy = isListPending || isListTxLoading
  const isUnlistingTxBusy = isUnlistPending || isUnlistTxLoading

  // Watch listing transaction states
  useEffect(() => {
    if (isListTxLoading) {
      toast({
        title: "Transaction Pending",
        description: "Your list transaction is being confirmed..."
      })
    }
    if (isListTxSuccess) {
      toast({
        title: "Transaction Successful!",
        description: "Your NFT has been listed for sale."
      })
      fetchUserNFTs(true)
    }
    if (isListTxError) {
      toast({
        title: "Transaction Failed",
        description: listTxReceiptError?.message || listError?.message || "Something went wrong.",
        variant: "destructive"
      })
    }
  }, [
    isListTxLoading,
    isListTxSuccess,
    isListTxError,
    listTxReceiptError,
    listError,
    toast
  ])

  // Watch unlisting transaction states
  useEffect(() => {
    if (isUnlistTxLoading) {
      toast({
        title: "Transaction Pending",
        description: "Your unlist transaction is being confirmed..."
      })
    }
    if (isUnlistTxSuccess) {
      toast({
        title: "Transaction Successful!",
        description: "Your NFT has been unlisted."
      })
      fetchUserNFTs(true)
    }
    if (isUnlistTxError) {
      toast({
        title: "Transaction Failed",
        description: unlistTxReceiptError?.message || unlistError?.message || "Something went wrong.",
        variant: "destructive"
      })
    }
  }, [
    isUnlistTxLoading,
    isUnlistTxSuccess,
    isUnlistTxError,
    unlistTxReceiptError,
    unlistError,
    toast
  ])

  // 1) Load the "latest itemId" from NFTMarketplaceHub
  useEffect(() => {
    async function loadLatestItemId() {
      if (!publicClient || !nftMarketplaceHub?.address || !nftMarketplaceHub?.abi) return
      try {
        const val = await publicClient.readContract({
          address: nftMarketplaceHub.address as `0x${string}`,
          abi: nftMarketplaceHub.abi,
          functionName: "getLatestItemId",
          args: []
        })
        if (typeof val === "bigint") {
          setCurrentMaxId(val)
        }
      } catch (err) {
        console.error("[MyNFTs] Error reading getLatestItemId:", err)
      }
    }
    loadLatestItemId()
  }, [nftMarketplaceHub, publicClient])

  // 2) Once we have currentMaxId, fetch the user's NFTs
  async function fetchUserNFTs(force?: boolean) {
    if (!wagmiAddress || !currentMaxId) return
    if (!nftMarketplaceHub?.address || !nftMarketplaceHub?.abi) return
    if (!nftStakingPool?.address || !nftStakingPool?.abi) return
    if (!publicClient) return

    if (!force && fetchedRef.current) return
    fetchedRef.current = true

    setLoadingNFTs(true)

    const total = Number(currentMaxId)
    const found: NFTDetails[] = []

    for (let i = 1; i <= total; i++) {
      const tokenId = BigInt(i)
      try {
        // read owner
        const owner = await publicClient.readContract({
          address: nftMarketplaceHub.address as `0x${string}`,
          abi: nftMarketplaceHub.abi,
          functionName: "ownerOf",
          args: [tokenId]
        }) as `0x${string}`

        // read stake info
        const [staker, startTimestamp, lastClaimed, staked] = await publicClient.readContract({
          address: nftStakingPool.address as `0x${string}`,
          abi: nftStakingPool.abi,
          functionName: "stakes",
          args: [tokenId]
        }) as [`0x${string}`, bigint, bigint, boolean]

        // Check if user is "owner" or staker
        const userIsOwner = owner.toLowerCase() === wagmiAddress.toLowerCase()
        const userIsStaker = staked && staker.toLowerCase() === wagmiAddress.toLowerCase()

        if (userIsOwner || userIsStaker) {
          // read nftData
          const data = await publicClient.readContract({
            address: nftMarketplaceHub.address as `0x${string}`,
            abi: nftMarketplaceHub.abi,
            functionName: "nftData",
            args: [tokenId]
          }) as [bigint, string, bigint, boolean, bigint, string]

          const item: NFTDetails = {
            itemId: data[0],
            creator: data[1],
            xpValue: data[2],
            isOnSale: data[3],
            salePrice: data[4],
            resourceUrl: data[5],
            stakeInfo: {
              staker,
              startTimestamp,
              lastClaimed,
              staked
            }
          }

          found.push(item)
        }
      } catch {
        // skip errors
      }
    }

    // load minted times in parallel
    await fetchMintedTimes(found)

    setUserNFTs(found)
    setLoadingNFTs(false)
  }

  /**
   * Fetch minted times for each item by parsing the `NFTItemGenerated` event logs
   */
  async function fetchMintedTimes(items: NFTDetails[]) {
    if (!nftMarketplaceHub?.address || !nftMarketplaceHub?.abi || !publicClient) return
    const itemIds = items.map((it) => it.itemId)
    const mintedTimeMap = mintedTimeMapRef.current

    // Filter out items we already have minted time for
    const missingItemIds = itemIds.filter((id) => !mintedTimeMap.has(id))
    if (missingItemIds.length === 0) return

    try {
      // The event signature for NFTItemGenerated(uint256 indexed itemId, address indexed collectionContract, uint256 xpGained, string imageURL)
      // itemId is indexed => topic[1]
      const nftItemGeneratedTopic = "0x93e40e7a55dc8edc8fe7fd5ab8a88111370574307399761a78d0f6a011dd3cdf"
      // We'll fetch logs from block 0 to "latest". You might want to limit from a known deployment block if you have it.
      const event = parseAbiItem("event NFTItemGenerated(uint256 indexed itemId, address indexed collectionContract, uint256 xpGained, string imageURL)")
      const logs = await publicClient.getLogs({
        address: nftMarketplaceHub.address as `0x\${string}`,
        fromBlock: 0n,
        toBlock: "latest",
        event
      })

      // For each log, parse the itemId from topics[1] and read block timestamp
      for (const lg of logs) {
        if (!lg.blockNumber) continue

        const itemIdHex = lg.topics[1]
        if (!itemIdHex) continue

        // itemIdHex is a 32-byte hex. We parse as BigInt
        const logItemId = BigInt(itemIdHex)
        // If we don't care about that itemId, skip
        if (!missingItemIds.includes(logItemId)) continue

        // fetch block
        const block = await publicClient.getBlock({ blockNumber: lg.blockNumber })
        if (!block?.timestamp) continue

        mintedTimeMap.set(logItemId, Number(block.timestamp))
      }
    } catch (err) {
      console.error("[fetchMintedTimes] error:", err)
    }
  }

  // 3) Once all is loaded, we also load resourceUrl if it's JSON-based
  useEffect(() => {
    if (userNFTs.length === 0) return

    async function loadMetadata() {
      const newMap: Record<string, MetadataState> = { ...metadataMap }
      for (const nft of userNFTs) {
        const idStr = String(nft.itemId)
        // if already loaded, skip
        if (newMap[idStr]?.imageUrl !== undefined) continue

        let finalImageUrl = nft.resourceUrl
        let name = `NFT #${idStr}`
        let description = ""

        // Attempt parse if it's ipfs://some.json or https://some.json
        try {
          // if resourceUrl is ipfs://, fetch from ipfs gateway
          if (nft.resourceUrl.startsWith("ipfs://")) {
            const ipfsHttp = nft.resourceUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
            const resp = await fetch(ipfsHttp)
            const maybeJson = await resp.json()
            if (maybeJson.image) finalImageUrl = maybeJson.image
            if (maybeJson.name) name = maybeJson.name
            if (maybeJson.description) description = maybeJson.description
          } else if (
            nft.resourceUrl.startsWith("https://") ||
            nft.resourceUrl.startsWith("http://")
          ) {
            // attempt fetch, parse JSON
            const resp = await fetch(nft.resourceUrl)
            const maybeJson = await resp.json()
            if (maybeJson.image) finalImageUrl = maybeJson.image
            if (maybeJson.name) name = maybeJson.name
            if (maybeJson.description) description = maybeJson.description
          }
        } catch {
          // not valid JSON
        }

        newMap[idStr] = {
          imageUrl: finalImageUrl,
          name,
          description
        }
      }
      setMetadataMap(newMap)
    }

    loadMetadata()
    // we want to run this only once after userNFTs changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userNFTs])

  // 4) onMount or on changes, fetchUserNFTs
  useEffect(() => {
    fetchUserNFTs()
  }, [wagmiAddress, currentMaxId])

  // 5) handle listing
  const handleListNFT = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNFT || !price) {
      toast({
        title: "Error",
        description: "Select an NFT and enter a price",
        variant: "destructive"
      })
      return
    }
    try {
      // We only need a small ABI snippet
      const abiListNFT = {
        name: "listNFTItem",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "itemId", type: "uint256" },
          { name: "price", type: "uint256" }
        ],
        outputs: []
      }
      await writeListContract({
        address: nftMarketplaceHub?.address as `0x${string}`,
        abi: [abiListNFT],
        functionName: "listNFTItem",
        args: [selectedNFT.itemId, parseEther(price)]
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An error occurred while listing the NFT",
        variant: "destructive"
      })
    }
  }

  // 6) handle unlisting
  const handleUnlistNFT = async () => {
    if (!selectedNFT || !selectedNFT.isOnSale) {
      toast({
        title: "Error",
        description: "No NFT selected or it is not listed.",
        variant: "destructive"
      })
      return
    }
    try {
      const abiUnlistNFT = {
        name: "unlistNFTItem",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "itemId", type: "uint256" }],
        outputs: []
      }
      await writeUnlistContract({
        address: nftMarketplaceHub?.address as `0x${string}`,
        abi: [abiUnlistNFT],
        functionName: "unlistNFTItem",
        args: [selectedNFT.itemId]
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An error occurred while unlisting the NFT",
        variant: "destructive"
      })
    }
  }

  /**
   * Generate a final display URL from the resourceUrl or the parsed metadata imageUrl
   */
  function getDisplayUrl(nft: NFTDetails): string {
    const meta = metadataMap[String(nft.itemId)]
    if (!meta?.imageUrl) {
      // fallback
      if (nft.resourceUrl.startsWith("ipfs://")) {
        return nft.resourceUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
      }
      return nft.resourceUrl
    }
    if (meta.imageUrl.startsWith("ipfs://")) {
      return meta.imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
    }
    return meta.imageUrl
  }

  function formatTimestamp(ts: number): string {
    const d = new Date(ts * 1000)
    return d.toLocaleString()
  }

  // If wallet not connected
  if (!wagmiAddress) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4 py-12">
        <h1 className="mb-2 text-4xl font-extrabold text-primary">My NFTs</h1>
        <p className="text-sm text-muted-foreground">Please connect your wallet to view your NFTs.</p>
      </main>
    )
  }

  return (
    <main className="w-full min-h-screen bg-background text-foreground px-4 py-12 sm:px-6 md:px-8">
      <h1 className="mb-6 text-center text-4xl font-extrabold text-primary">My NFTs</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left Column - card with user's NFTs in a grid */}
        <Card className="border border-border rounded-lg shadow-xl">
          <CardHeader className="p-4 bg-accent text-accent-foreground rounded-t-lg">
            <CardTitle className="text-lg font-semibold">Your NFTs</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingNFTs ? (
              <div className="flex items-center justify-center gap-2">
                {/* You can import Loader2 from lucide-react if not already */}
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading NFTs...</span>
              </div>
            ) : userNFTs.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have no NFTs in your wallet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {userNFTs.map((nft) => {
                  const displayUrl = getDisplayUrl(nft)
                  const isStaked = nft.stakeInfo?.staked && nft.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase()
                  const isForSale = nft.isOnSale
                  const selected = selectedNFT?.itemId === nft.itemId

                  // Labels
                  let label = ""
                  if (isStaked) label = "(STAKED)"
                  else if (isForSale) label = "(LISTED)"

                  return (
                    <div
                      key={String(nft.itemId)}
                      onClick={() => setSelectedNFT(nft)}
                      className={`cursor-pointer rounded-md border-2 p-2 transition-transform hover:scale-[1.02] ${selected ? "border-primary" : "border-border"
                        }`}
                    >
                      <div className="relative h-36 w-full overflow-hidden rounded-md bg-secondary">
                        <Image
                          src={displayUrl}
                          alt={`NFT #${String(nft.itemId)}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-foreground line-clamp-1">
                        NFT #{String(nft.itemId)} {label}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - card with details of the selected NFT */}
        <Card className="border border-border rounded-lg shadow-xl">
          <CardHeader className="p-4 bg-accent text-accent-foreground rounded-t-lg">
            <CardTitle className="text-lg font-semibold">
              {selectedNFT ? `Details for NFT #${String(selectedNFT.itemId)}` : "Select an NFT"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!selectedNFT ? (
              <p className="text-sm text-muted-foreground">
                Click on one of your NFTs on the left to view details.
              </p>
            ) : (
              <>
                {/* Image Preview */}
                <div className="relative mb-4 h-64 w-full overflow-hidden rounded-md bg-secondary">
                  <Image
                    src={getDisplayUrl(selectedNFT)}
                    alt={`NFT #${String(selectedNFT.itemId)}`}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Show minted time if found */}
                {selectedNFT.mintedTime && (
                  <p className="text-sm mb-1">
                    <strong>Minted Time:</strong>{" "}
                    {formatTimestamp(selectedNFT.mintedTime)}
                  </p>
                )}

                {/* Show sale info */}
                <p className="text-sm mb-1">
                  <strong>Is On Sale:</strong>{" "}
                  {selectedNFT.isOnSale ? "Yes" : "No"}
                </p>
                {selectedNFT.isOnSale && (
                  <p className="text-sm mb-1">
                    <strong>Price:</strong>{" "}
                    {(Number(selectedNFT.salePrice) / 1e18).toFixed(4)} ETH
                  </p>
                )}

                {/* Show staked info if user staked */}
                {selectedNFT.stakeInfo?.staked &&
                  selectedNFT.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase() && (
                    <p className="text-sm mb-1 text-green-600">
                      <strong>Staked:</strong> This NFT is currently staked.
                    </p>
                  )}

                {/* Listing Form */}
                {(() => {
                  const isStaked =
                    selectedNFT.stakeInfo?.staked &&
                    selectedNFT.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase();

                  return (
                    <form onSubmit={handleListNFT} className="mt-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium">Sale Price (ETH)</label>
                        <Input
                          type="number"
                          step="0.001"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.1"
                          className="mt-1"
                          disabled={isStaked}
                        />
                      </div>
                      {isStaked ? (
                        <p className="text-sm text-orange-600 font-semibold">
                          This NFT is currently staked. Please unstake it first before listing.
                        </p>
                      ) : (
                        <Button
                          type="submit"
                          disabled={!selectedNFT || !price || isListingTxBusy}
                          className="w-full"
                        >
                          {isListingTxBusy ? "Processing..." : "List for Sale"}
                        </Button>
                      )}

                      {(isListTxLoading || isListTxSuccess || isListTxError) && (
                        <div className="rounded-md border border-border p-4 mt-2 text-sm">
                          <p className="font-medium">Transaction Status:</p>
                          {isListTxLoading && <p className="text-muted-foreground">Pending confirmation...</p>}
                          {isListTxSuccess && (
                            <p className="text-green-600">
                              Transaction Confirmed! Your NFT is now listed.
                            </p>
                          )}
                          {isListTxError && (
                            <p className="font-bold text-orange-600 dark:text-orange-500">
                              Transaction Failed: {listTxReceiptError?.message || listError?.message}
                            </p>
                          )}
                        </div>
                      )}
                    </form>
                  );
                })()}

                {/* If item is on sale, unlist button */}
                {selectedNFT.isOnSale && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleUnlistNFT}
                      disabled={isUnlistingTxBusy}
                      className="mt-4 w-full"
                    >
                      {isUnlistingTxBusy ? "Processing..." : "Unlist NFT"}
                    </Button>

                    {(isUnlistTxLoading || isUnlistTxSuccess || isUnlistTxError) && (
                      <div className="rounded-md border border-border p-4 mt-2 text-sm">
                        <p className="font-medium">Transaction Status:</p>
                        {isUnlistTxLoading && (
                          <p className="text-muted-foreground">Pending confirmation...</p>
                        )}
                        {isUnlistTxSuccess && (
                          <p className="text-green-600">
                            Transaction Confirmed! Your NFT has been unlisted.
                          </p>
                        )}
                        {isUnlistTxError && (
                          <p className="font-bold text-orange-600 dark:text-orange-500">
                            Transaction Failed: {unlistTxReceiptError?.message || unlistError?.message}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Show any extended description */}
                {metadataMap[String(selectedNFT.itemId)]?.description && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold">Description / Story:</p>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {metadataMap[String(selectedNFT.itemId)]?.description}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}