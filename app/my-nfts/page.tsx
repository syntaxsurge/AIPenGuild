'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useRef, useState } from "react"
import { parseEther } from "viem"
import {
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi"

interface StakeInfo {
  staker: `0x${string}`
  startTimestamp: bigint
  lastClaimed: bigint
  staked: boolean
}

interface NFTDetails {
  itemId: bigint
  creator: string
  xpValue: bigint
  isOnSale: boolean
  salePrice: bigint
  resourceUrl: string
  stakeInfo?: StakeInfo
  mintedTime?: number
}

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

  // We'll prevent repeated full fetch calls
  const fetchedUserNFTsRef = useRef(false)
  const latestItemIdFetchedRef = useRef(false)

  // Are we busy listing or unlisting
  const isListingTxBusy = isListPending || isListTxLoading
  const isUnlistingTxBusy = isUnlistPending || isUnlistTxLoading

  // Watchers for listing
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
      // Update local state
      if (selectedNFT) {
        try {
          const bigPrice = parseEther(price)
          setUserNFTs((prev) =>
            prev.map((n) =>
              n.itemId === selectedNFT.itemId
                ? { ...n, isOnSale: true, salePrice: bigPrice }
                : n
            )
          )
        } catch {
          // ignore parse error
        }
      }
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
    toast,
    selectedNFT,
    price
  ])

  // Watchers for unlisting
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
      // Update local state
      if (selectedNFT) {
        setUserNFTs((prev) =>
          prev.map((n) =>
            n.itemId === selectedNFT.itemId
              ? { ...n, isOnSale: false, salePrice: 0n }
              : n
          )
        )
      }
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
    toast,
    selectedNFT
  ])

  // 1) Only call getLatestItemId once if not already loaded, or if user changes
  useEffect(() => {
    // If user is disconnected or references are missing, skip
    if (!wagmiAddress) {
      // reset
      setCurrentMaxId(null)
      latestItemIdFetchedRef.current = false
      return
    }
    if (!publicClient || !nftMarketplaceHub?.address || !nftMarketplaceHub?.abi) return

    // If we already fetched for this session, skip
    if (latestItemIdFetchedRef.current) return
    latestItemIdFetchedRef.current = true

    async function loadLatestItemId() {
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
  }, [wagmiAddress, nftMarketplaceHub, publicClient])

  // 2) Once we have currentMaxId, fetch the user's NFTs
  async function fetchUserNFTs() {
    if (!wagmiAddress || !currentMaxId) return
    if (!nftMarketplaceHub?.address || !nftMarketplaceHub?.abi) return
    if (!nftStakingPool?.address || !nftStakingPool?.abi) return
    if (!publicClient) return

    // If already fetched for this session, skip
    if (fetchedUserNFTsRef.current) return
    fetchedUserNFTsRef.current = true

    setLoadingNFTs(true)
    const total = Number(currentMaxId)
    const calls = []
    for (let i = 1n; i <= BigInt(total); i++) {
      // nftData
      calls.push({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: nftMarketplaceHub.abi,
        functionName: "nftData",
        args: [i]
      })
      // ownerOf
      calls.push({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: nftMarketplaceHub.abi,
        functionName: "ownerOf",
        args: [i]
      })
      // stakes
      calls.push({
        address: nftStakingPool.address as `0x${string}`,
        abi: nftStakingPool.abi,
        functionName: "stakes",
        args: [i]
      })
      // mintedAt
      calls.push({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: nftMarketplaceHub.abi,
        functionName: "mintedAt",
        args: [i]
      })
    }

    try {
      const multicallRes = await publicClient.multicall({
        contracts: calls,
        allowFailure: true
      })
      const found: NFTDetails[] = []

      let idx = 0
      for (let i = 1; i <= total; i++) {
        const dataCall = multicallRes[idx]
        const ownerCall = multicallRes[idx + 1]
        const stakeCall = multicallRes[idx + 2]
        const mintedAtCall = multicallRes[idx + 3]
        idx += 4

        if (!dataCall.result || !ownerCall.result || !stakeCall.result || mintedAtCall.result === undefined) {
          continue
        }

        const [itemId, creator, xpValue, isOnSale, salePrice, resourceUrl] =
          dataCall.result as [bigint, string, bigint, boolean, bigint, string]
        const ownerAddr = ownerCall.result as `0x${string}`
        const [staker, startTimestamp, lastClaimed, staked] =
          stakeCall.result as [string, bigint, bigint, boolean]
        const mintedTimeValue = mintedAtCall.result as bigint

        // check if user is owner or staker
        const userIsOwner = ownerAddr.toLowerCase() === wagmiAddress.toLowerCase()
        const userIsStaker = staked && staker.toLowerCase() === wagmiAddress.toLowerCase()

        if (userIsOwner || userIsStaker) {
          found.push({
            itemId,
            creator,
            xpValue,
            isOnSale,
            salePrice,
            resourceUrl,
            stakeInfo: {
              staker: staker as `0x${string}`,
              startTimestamp,
              lastClaimed,
              staked
            },
            mintedTime: Number(mintedTimeValue)
          })
        }
      }

      setUserNFTs(found)
    } catch (err) {
      console.error("[MyNFTs] Error in multicall fetching user NFTs:", err)
      toast({
        title: "Error",
        description: "Unable to fetch your NFTs. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingNFTs(false)
    }
  }

  useEffect(() => {
    if (!wagmiAddress) {
      setUserNFTs([])
      fetchedUserNFTsRef.current = false
      return
    }
    if (currentMaxId && wagmiAddress) {
      fetchUserNFTs()
    }
  }, [wagmiAddress, currentMaxId])

  // 3) Load metadata only when userNFTs changes, ignoring metadataMap from dependencies
  useEffect(() => {
    if (!userNFTs.length) return

    async function loadMetadata() {
      // We'll build a copy of the current metadata map, filling only missing items
      const newMap = { ...metadataMap }
      let updated = false

      for (const nft of userNFTs) {
        const idStr = String(nft.itemId)
        // skip if we already have an imageUrl for this NFT
        if (newMap[idStr]?.imageUrl !== undefined) {
          continue
        }

        let finalImageUrl = nft.resourceUrl
        let name = `NFT #${idStr}`
        let description = ""

        try {
          if (nft.resourceUrl.startsWith("ipfs://")) {
            const ipfsHttp = nft.resourceUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
            const resp = await fetch(ipfsHttp)
            const maybeJson = await resp.json()
            if (maybeJson.image) finalImageUrl = maybeJson.image
            if (maybeJson.name) name = maybeJson.name
            if (maybeJson.description) description = maybeJson.description
          } else if (nft.resourceUrl.startsWith("https://") || nft.resourceUrl.startsWith("http://")) {
            // attempt to parse as JSON
            const resp = await fetch(nft.resourceUrl)
            const maybeJson = await resp.json()
            if (maybeJson.image) finalImageUrl = maybeJson.image
            if (maybeJson.name) name = maybeJson.name
            if (maybeJson.description) description = maybeJson.description
          }
        } catch {
          // possibly a direct image, or an error
        }

        newMap[idStr] = {
          imageUrl: finalImageUrl,
          name,
          description
        }
        updated = true
      }

      // only update state if there's a change
      if (updated) {
        setMetadataMap(newMap)
      }
    }

    loadMetadata()
    // we only depend on userNFTs. do not add metadataMap to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userNFTs])

  // Listing
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

  // Unlisting
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

  function getDisplayUrl(nft: NFTDetails): string {
    const meta = metadataMap[String(nft.itemId)]
    if (!meta?.imageUrl) {
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

  if (!wagmiAddress) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4 py-12">
        <h1 className="mb-2 text-4xl font-extrabold text-primary">My NFTs</h1>
        <p className="text-sm text-muted-foreground">Please connect your wallet to view your NFTs.</p>
      </main>
    )
  }

  return (
    <main className="w-full min-h-screen bg-background text-foreground px-4 py-12 sm:px-6 md:px=8">
      <h1 className="mb-6 text-center text-4xl font-extrabold text-primary">My NFTs</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left Column */}
        <Card className="border border-border rounded-lg shadow-xl">
          <CardHeader className="p-4 bg-accent text-accent-foreground rounded-t-lg">
            <CardTitle className="text-lg font-semibold">Your NFTs</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingNFTs ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading NFTs...</span>
              </div>
            ) : userNFTs.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have no NFTs in your wallet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {userNFTs.map((nft) => {
                  const displayUrl = getDisplayUrl(nft)
                  const isStaked =
                    nft.stakeInfo?.staked &&
                    nft.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase()
                  const isForSale = nft.isOnSale
                  const selected = selectedNFT?.itemId === nft.itemId

                  let label = ""
                  if (isStaked) label = "(STAKED)"
                  else if (isForSale) label = "(LISTED)"

                  return (
                    <div
                      key={String(nft.itemId)}
                      onClick={() => setSelectedNFT(nft)}
                      className={`cursor-pointer rounded-md border-2 p-2 transition-transform hover:scale-[1.02] ${
                        selected ? "border-primary" : "border-border"
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

        {/* Right Column */}
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
                {/* Image */}
                <div className="relative mb-4 h-64 w-full overflow-hidden rounded-md bg-secondary">
                  <Image
                    src={getDisplayUrl(selectedNFT)}
                    alt={`NFT #${String(selectedNFT.itemId)}`}
                    fill
                    className="object-contain"
                  />
                </div>
                {/* mintedTime */}
                {selectedNFT.mintedTime && (
                  <p className="text-sm mb-1">
                    <strong>Minted Time:</strong> {formatTimestamp(selectedNFT.mintedTime)}
                  </p>
                )}
                {/* Additional */}
                <p className="text-sm mb-1">
                  <strong>XP Value:</strong> {selectedNFT.xpValue.toString()}
                </p>
                <p className="text-sm mb-1">
                  <strong>Creator:</strong> {selectedNFT.creator.slice(0, 6)}...{selectedNFT.creator.slice(-4)}
                </p>
                <p className="text-sm mb-1 break-all">
                  <strong>Resource URL:</strong> {selectedNFT.resourceUrl}
                </p>
                <p className="text-sm mb-1">
                  <strong>Is On Sale:</strong> {selectedNFT.isOnSale ? "Yes" : "No"}
                </p>
                {selectedNFT.isOnSale && (
                  <p className="text-sm mb-1">
                    <strong>Price:</strong>{" "}
                    {(Number(selectedNFT.salePrice) / 1e18).toFixed(4)} ETH
                  </p>
                )}
                {selectedNFT.stakeInfo?.staked &&
                  selectedNFT.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase() && (
                    <p className="text-sm mb-1 text-green-600">
                      <strong>Staked:</strong> This NFT is currently staked.
                    </p>
                  )}

                {/* Listing form */}
                {(() => {
                  const isStaked =
                    selectedNFT.stakeInfo?.staked &&
                    selectedNFT.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase()

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
                  )
                })()}

                {/* Unlist */}
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

                {/* Extended Description */}
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