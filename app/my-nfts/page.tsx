'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
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
}

interface MetadataState {
  imageUrl?: string
  name?: string
  description?: string
}

export default function MyNFTsPage() {
  // Grab wallet address and public client
  const { address: wagmiAddress } = useAccount()
  const publicClient = usePublicClient()
  const { toast } = useToast()

  // Contracts
  const nftMarketplaceHub = useContract("NFTMarketplaceHub")
  const nftStakingPool = useContract("NFTStakingPool")

  // 1) Hooks for listing
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

  // 2) Hooks for unlisting
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

  // 3) Local states and Refs
  const [price, setPrice] = useState("")
  const [userNFTs, setUserNFTs] = useState<NFTDetails[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTDetails | null>(null)
  const [metadataMap, setMetadataMap] = useState<Record<string, MetadataState>>({})
  const [currentMaxId, setCurrentMaxId] = useState<bigint | null>(null)
  const fetchedRef = useRef(false)

  // Determine if listing or unlisting transactions are in progress
  const isListingTxBusy = isListPending || isListTxLoading
  const isUnlistingTxBusy = isUnlistPending || isUnlistTxLoading

  // 4) Watch listing transaction states
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
      // refresh the page data
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

  // 5) Watch unlisting transaction states
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
      // refresh the page data
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

  // 6) Load getLatestItemId from NFTMarketplaceHub
  useEffect(() => {
    async function loadLatestItemId() {
      if (!nftMarketplaceHub?.address || !nftMarketplaceHub?.abi || !publicClient) return
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
        console.error("Error reading getLatestItemId:", err)
      }
    }
    loadLatestItemId()
  }, [nftMarketplaceHub, publicClient])

  // 7) Fetch user's NFTs (both physically owned and staked) by scanning up to currentMaxId
  async function fetchUserNFTs(force?: boolean) {
    if (!wagmiAddress || !currentMaxId || !nftMarketplaceHub || !nftStakingPool || !publicClient) return
    if (!force && fetchedRef.current) return
    fetchedRef.current = true

    const total = Number(currentMaxId)
    const found: NFTDetails[] = []

    for (let i = 1; i <= total; i++) {
      const tokenId = BigInt(i)
      try {
        // 1) read owner
        const owner = await publicClient.readContract({
          address: nftMarketplaceHub.address as `0x${string}`,
          abi: nftMarketplaceHub.abi,
          functionName: "ownerOf",
          args: [tokenId]
        }) as `0x${string}`

        // 2) read stake info
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
          // 3) read the NFT's data
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
        // skip
      }
    }
    setUserNFTs(found)
  }

  useEffect(() => {
    fetchUserNFTs()
  }, [wagmiAddress, currentMaxId, nftMarketplaceHub, nftStakingPool, publicClient])

  // 8) Load metadata for each NFT in userNFTs
  useEffect(() => {
    async function loadMetadata() {
      if (userNFTs.length === 0) return
      const newMap: Record<string, MetadataState> = {}

      for (const nft of userNFTs) {
        let finalImageUrl = nft.resourceUrl
        let name = `NFT #${String(nft.itemId)}`
        let description = ""

        try {
          // If resource is IPFS or HTTP JSON, parse it
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
            const resp = await fetch(nft.resourceUrl)
            try {
              const maybeJson = await resp.json()
              if (maybeJson.image) finalImageUrl = maybeJson.image
              if (maybeJson.name) name = maybeJson.name
              if (maybeJson.description) description = maybeJson.description
            } catch {
              // not valid JSON or can't parse
            }
          }
        } catch (err) {
          // ignore parse errors
        }

        newMap[String(nft.itemId)] = {
          imageUrl: finalImageUrl,
          name,
          description
        }
      }
      setMetadataMap(newMap)
    }
    loadMetadata()
  }, [userNFTs])

  // Helper to get final image URL
  function getDisplayUrl(nft: NFTDetails): string {
    const meta = metadataMap[String(nft.itemId)]
    if (!meta?.imageUrl) {
      // fallback if needed
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

  // 9) Listing an NFT
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

  // 10) Unlisting an NFT
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

  // ---- Render ----
  return (
    <main className="w-full min-h-screen bg-white dark:bg-gray-900 text-foreground flex justify-center px-4 py-12 sm:px-6 md:px-8">
      <div className="max-w-5xl w-full">
        <h1 className="mb-4 text-center text-4xl font-extrabold text-primary">My NFTs</h1>
        {/* If no wallet connected, show message */}
        {!wagmiAddress && (
          <p className="text-center text-sm text-muted-foreground">
            Please connect your wallet to view your NFTs.
          </p>
        )}

        {/* If connected, show the rest of the content */}
        {wagmiAddress && (
          <>
            <Card className="mt-6 border border-border rounded-lg shadow-xl bg-background">
              <CardHeader className="p-4 bg-accent text-accent-foreground rounded-t-lg">
                <CardTitle className="text-lg font-semibold">Your NFTs</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {userNFTs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have no NFTs in your wallet or staked.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {userNFTs.map((nft) => {
                      const meta = metadataMap[String(nft.itemId)] || {}
                      const displayUrl = getDisplayUrl(nft)
                      const isStaked = nft.stakeInfo?.staked &&
                        nft.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase()
                      const isForSale = nft.isOnSale
                      return (
                        <div
                          key={String(nft.itemId)}
                          onClick={() => setSelectedNFT(nft)}
                          className={`cursor-pointer rounded-md border-2 p-2 transition-transform hover:scale-[1.02] ${selectedNFT?.itemId === nft.itemId ? "border-primary" : "border-border"
                            }`}
                        >
                          <div className="relative h-32 w-full overflow-hidden rounded-md bg-secondary sm:h-36">
                            <Image
                              src={displayUrl}
                              alt={`NFT #${nft.itemId}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="mt-2 text-xs font-semibold text-foreground line-clamp-1">
                            {meta.name || `NFT #${String(nft.itemId)}`}
                          </p>
                          {isStaked && (
                            <p className="mt-1 text-xs font-semibold text-green-700 dark:text-green-500">
                              Staked
                            </p>
                          )}
                          {isForSale && (
                            <p className="mt-1 text-xs font-semibold text-orange-600 dark:text-orange-500">
                              Listed for sale
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedNFT && (
              <Card className="mt-6 border border-border rounded-lg shadow-xl bg-background">
                <CardHeader className="p-4 bg-accent text-accent-foreground rounded-t-lg">
                  <CardTitle className="text-lg font-semibold">Set Sale Price</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleListNFT} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Sale Price (ETH)</label>
                      <Input
                        type="number"
                        step="0.001"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.1"
                        required
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!selectedNFT || !price || isListingTxBusy}
                      className="w-full"
                    >
                      {isListingTxBusy ? "Processing..." : "List for Sale"}
                    </Button>

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

                  {selectedNFT?.isOnSale && (
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

                  {metadataMap[String(selectedNFT.itemId)]?.description && (
                    <div className="mt-6">
                      <p className="text-sm font-semibold">Story / Description:</p>
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                        {metadataMap[String(selectedNFT.itemId)]?.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  )
}