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
  xpValue: bigint
  resourceUrl: string
  mintedAt: bigint
  creator: string
  owner: string

  isOnSale: boolean
  salePrice: bigint

  stakeInfo?: StakeInfo
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
  const nftMintingPlatform = useContract("NFTMintingPlatform")

  // List/unlist contract calls
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

  const fetchedUserNFTsRef = useRef(false)
  const latestItemIdFetchedRef = useRef(false)

  // watchers for listing transaction
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

  // watchers for unlisting
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

  // (1) load the highest minted itemId from NFTMintingPlatform
  useEffect(() => {
    if (!wagmiAddress) {
      setCurrentMaxId(null)
      latestItemIdFetchedRef.current = false
      return
    }
    if (!publicClient || !nftMintingPlatform?.address || !nftMintingPlatform?.abi) return
    if (latestItemIdFetchedRef.current) return
    latestItemIdFetchedRef.current = true

    async function loadLatestItemId() {
      try {
        const val = await publicClient?.readContract({
          address: nftMintingPlatform?.address as `0x${string}`,
          abi: nftMintingPlatform?.abi,
          functionName: "getLatestMintedId",
          args: []
        })
        if (typeof val === "bigint") {
          setCurrentMaxId(val)
        }
      } catch (err) {
        console.error("[MyNFTs] Error reading getLatestMintedId:", err)
      }
    }
    loadLatestItemId()
  }, [wagmiAddress, nftMintingPlatform, publicClient])

  // (2) once we have currentMaxId, fetch all user NFTs
  async function fetchUserNFTs() {
    if (!wagmiAddress || !currentMaxId) return
    if (!nftMarketplaceHub?.address || !nftMarketplaceHub?.abi) return
    if (!nftMintingPlatform?.address || !nftMintingPlatform?.abi) return
    if (!nftStakingPool?.address || !nftStakingPool?.abi) return
    if (!publicClient) return
    if (fetchedUserNFTsRef.current) return
    fetchedUserNFTsRef.current = true

    setLoadingNFTs(true)
    try {
      const total = Number(currentMaxId)
      const results: NFTDetails[] = []

      for (let i = 1; i <= total; i++) {
        const tokenId = BigInt(i)
        try {
          // 1) read ownerOf(tokenId) from NFTMintingPlatform
          const owner = await publicClient.readContract({
            address: nftMintingPlatform.address as `0x${string}`,
            abi: nftMintingPlatform.abi,
            functionName: "ownerOf",
            args: [tokenId],
          }) as `0x${string}`

          // 2) read NFT metadata => nftItems(tokenId)
          const itemData = await publicClient.readContract({
            address: nftMintingPlatform.address as `0x${string}`,
            abi: nftMintingPlatform.abi,
            functionName: "nftItems",
            args: [tokenId],
          }) as [bigint, string, bigint, string] // xp, resource, mintedAt, creator

          const xpValue = itemData[0]
          const resourceUrl = itemData[1]
          const mintedAt = itemData[2]
          const creator = itemData[3]

          // 3) read marketItems(tokenId) => [isOnSale, salePrice]
          const marketItem = await publicClient.readContract({
            address: nftMarketplaceHub.address as `0x${string}`,
            abi: nftMarketplaceHub.abi,
            functionName: "marketItems",
            args: [tokenId],
          }) as [boolean, bigint]

          const isOnSale = marketItem[0]
          const salePrice = marketItem[1]

          // 4) read stake info => stakes(tokenId) => [staker, startTimestamp, lastClaimed, staked]
          const stakeData = await publicClient.readContract({
            address: nftStakingPool.address as `0x${string}`,
            abi: nftStakingPool.abi,
            functionName: "stakes",
            args: [tokenId]
          }) as [string, bigint, bigint, boolean]

          const stakerAddr = stakeData[0]
          const staked = stakeData[3]

          const userIsOwner = owner.toLowerCase() === wagmiAddress.toLowerCase()
          const userIsStaker = staked && stakerAddr.toLowerCase() === wagmiAddress.toLowerCase()

          if (userIsOwner || userIsStaker) {
            results.push({
              itemId: tokenId,
              xpValue,
              resourceUrl,
              mintedAt,
              creator,
              owner,
              isOnSale,
              salePrice,
              stakeInfo: {
                staker: stakerAddr as `0x${string}`,
                startTimestamp: stakeData[1],
                lastClaimed: stakeData[2],
                staked
              }
            })
          }
        } catch {
          // skip
        }
      }

      setUserNFTs(results)
    } catch (err) {
      console.error("[MyNFTs] Error in fetchUserNFTs:", err)
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

  // (3) load metadata if needed (optional - if your NFT uses direct resource links, might skip)
  useEffect(() => {
    if (!userNFTs.length) return

    async function loadMetadata() {
      const newMap = { ...metadataMap }
      let updated = false

      for (const nft of userNFTs) {
        const idStr = String(nft.itemId)
        if (newMap[idStr]?.imageUrl !== undefined) {
          continue
        }

        let finalImageUrl = nft.resourceUrl
        let name = `NFT #${idStr}`
        let description = ""

        // If resourceUrl is an IPFS link or JSON endpoint, attempt to fetch JSON
        if (
          nft.resourceUrl.startsWith("ipfs://") ||
          nft.resourceUrl.startsWith("http://") ||
          nft.resourceUrl.startsWith("https://")
        ) {
          try {
            let replacedUrl = nft.resourceUrl
            if (replacedUrl.startsWith("ipfs://")) {
              replacedUrl = replacedUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
            }
            const resp = await fetch(replacedUrl)
            const maybeJson = await resp.json()
            if (maybeJson.image) finalImageUrl = maybeJson.image
            if (maybeJson.name) name = maybeJson.name
            if (maybeJson.description) description = maybeJson.description
          } catch {
            // possibly direct link or error
          }
        }

        newMap[idStr] = {
          imageUrl: finalImageUrl,
          name,
          description
        }
        updated = true
      }

      if (updated) {
        setMetadataMap(newMap)
      }
    }

    loadMetadata()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userNFTs])

  // handle listing
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

  // handle unlisting
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

  function formatTimestamp(ts: bigint): string {
    const d = new Date(Number(ts) * 1000)
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
                  const isStaked = nft.stakeInfo?.staked && nft.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase()
                  let label = ""
                  if (isStaked) label = "(STAKED)"
                  else if (nft.isOnSale) label = "(LISTED)"
                  const selected = selectedNFT?.itemId === nft.itemId

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
                          sizes="(max-width: 768px) 100vw,
                                 (max-width: 1200px) 50vw,
                                 33vw"
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
                <div className="relative mb-4 h-64 w-full overflow-hidden rounded-md bg-secondary">
                  <Image
                    src={getDisplayUrl(selectedNFT)}
                    alt={`NFT #${String(selectedNFT.itemId)}`}
                    fill
                    sizes="(max-width: 768px) 100vw,
                           (max-width: 1200px) 50vw,
                           33vw"
                    className="object-contain"
                  />
                </div>
                <p className="text-sm mb-1">
                  <strong>Minted Time:</strong> {formatTimestamp(selectedNFT.mintedAt)}
                </p>
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
                    <strong>Price:</strong> {(Number(selectedNFT.salePrice) / 1e18).toFixed(4)} ETH
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
                  const isStaked = selectedNFT.stakeInfo?.staked &&
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
                          disabled={!selectedNFT || !price || isListPending || isListTxLoading}
                          className="w-full"
                        >
                          {isListPending || isListTxLoading ? "Processing..." : "List for Sale"}
                        </Button>
                      )}

                      {(isListTxLoading || isListTxSuccess || isListTxError) && (
                        <div className="rounded-md border border-border p-4 mt-2 text-sm">
                          <p className="font-bold">Transaction Status:</p>
                          {isListTxLoading && <p className="font-bold text-muted-foreground">Pending confirmation...</p>}
                          {isListTxSuccess && (
                            <p className="font-bold text-green-600">
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
                      disabled={isUnlistPending || isUnlistTxLoading}
                      className="mt-4 w-full"
                    >
                      {isUnlistPending || isUnlistTxLoading ? "Processing..." : "Unlist NFT"}
                    </Button>

                    {(isUnlistTxLoading || isUnlistTxSuccess || isUnlistTxError) && (
                      <div className="rounded-md border border-border p-4 mt-2 text-sm">
                        <p className="font-bold">Transaction Status:</p>
                        {isUnlistTxLoading && (
                          <p className="font-bold text-muted-foreground">Pending confirmation...</p>
                        )}
                        {isUnlistTxSuccess && (
                          <p className="font-bold text-green-600">
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