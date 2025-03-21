'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TransactionStatus } from "@/components/ui/transaction-status"
import { useNativeCurrencySymbol } from "@/hooks/use-native-currency-symbol"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { fetchAllNFTs, NFTItem } from "@/lib/nft-data"
import { fetchNftMetadata, ParsedNftMetadata } from "@/lib/nft-metadata"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useRef, useState } from "react"
import { parseEther } from "viem"
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi"

export default function MyNFTsPage() {
  const { address: wagmiAddress } = useAccount()
  const currencySymbol = useNativeCurrencySymbol()
  const publicClient = usePublicClient()
  const chainId = useChainId() || 1287
  const { toast } = useToast()

  const nftMarketplaceHub = useContract("NFTMarketplaceHub")
  const nftStakingPool = useContract("NFTStakingPool")
  const nftMintingPlatform = useContract("NFTMintingPlatform")

  // For list/unlist writes:
  const {
    data: listWriteData,
    error: listError,
    isPending: isListPending,
    isSuccess: isListSuccess,
    writeContract: writeListContract
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

  const [price, setPrice] = useState("")
  const [userNFTs, setUserNFTs] = useState<NFTItem[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)
  const [loadingNFTs, setLoadingNFTs] = useState(false)
  const [metadataMap, setMetadataMap] = useState<Record<string, ParsedNftMetadata>>({})

  const fetchedRef = useRef(false)

  // Watchers for listing transaction
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
          // parse error ignored
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
  }, [isListTxLoading, isListTxSuccess, isListTxError, listTxReceiptError, listError, toast, selectedNFT, price])

  // Watchers for unlisting transaction
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
  }, [isUnlistTxLoading, isUnlistTxSuccess, isUnlistTxError, unlistTxReceiptError, unlistError, toast, selectedNFT])

  // Main loader for user's NFTs
  async function loadMyNFTs() {
    if (!wagmiAddress) return
    if (!nftMarketplaceHub || !nftMarketplaceHub.address) return
    if (!nftMintingPlatform || !nftMintingPlatform.address) return
    if (!nftStakingPool || !nftStakingPool.address) return
    if (!publicClient) return
    if (fetchedRef.current) return

    fetchedRef.current = true
    setLoadingNFTs(true)

    try {
      // fetch all minted items
      const allItems = await fetchAllNFTs(publicClient, nftMintingPlatform, nftMarketplaceHub, nftStakingPool)
      // filter for items that belong to or are staked by user
      const myItems = allItems.filter((item) => {
        const staked = item.stakeInfo?.staked && item.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase()
        const owned = item.owner.toLowerCase() === wagmiAddress.toLowerCase()
        return staked || owned
      })

      // fetch metadata for each item
      const newMap: Record<string, ParsedNftMetadata> = {}
      for (const item of myItems) {
        try {
          const parsed = await fetchNftMetadata(item.resourceUrl)
          newMap[String(item.itemId)] = parsed
        } catch {
          // fallback
          newMap[String(item.itemId)] = {
            imageUrl: item.resourceUrl,
            name: "",
            description: "",
            attributes: {}
          }
        }
      }

      setMetadataMap(newMap)
      setUserNFTs(myItems)
    } catch (err) {
      console.error("Error in loadMyNFTs:", err)
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
      fetchedRef.current = false
      return
    }
    loadMyNFTs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wagmiAddress, nftMarketplaceHub, nftMintingPlatform, nftStakingPool, publicClient])

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
      if (!nftMarketplaceHub?.address) {
        throw new Error("NFTMarketplaceHub contract not found.")
      }
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
        address: nftMarketplaceHub.address as `0x${string}`,
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
      if (!nftMarketplaceHub?.address) {
        throw new Error("NFTMarketplaceHub contract not found.")
      }
      const abiUnlistNFT = {
        name: "unlistNFTItem",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "itemId", type: "uint256" }],
        outputs: []
      }
      await writeUnlistContract({
        address: nftMarketplaceHub.address as `0x${string}`,
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
        {/* Left Card: NFT Grid */}
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
                  const itemIdStr = String(nft.itemId)
                  const meta = metadataMap[itemIdStr] || {
                    imageUrl: nft.resourceUrl,
                    name: "",
                    description: "",
                    attributes: {}
                  }
                  const isStaked =
                    nft.stakeInfo?.staked &&
                    nft.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase()
                  const label = isStaked
                    ? "(STAKED)"
                    : nft.isOnSale
                      ? "(LISTED)"
                      : ""
                  const selected = selectedNFT?.itemId === nft.itemId

                  return (
                    <div
                      key={itemIdStr}
                      onClick={() => setSelectedNFT(nft)}
                      className={`cursor-pointer rounded-md border-2 p-2 transition-transform hover:scale-[1.02] ${selected ? "border-primary" : "border-border"
                        }`}
                    >
                      <div className="relative h-36 w-full overflow-hidden rounded-md bg-secondary">
                        {meta.imageUrl && (
                          <Image
                            src={meta.imageUrl}
                            alt={`NFT #${String(nft.itemId)}`}
                            fill
                            sizes="(max-width: 768px) 100vw,
                                   (max-width: 1200px) 50vw,
                                   33vw"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-foreground line-clamp-1">
                        NFT #{itemIdStr} {label}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Card: Details */}
        <Card className="border border-border rounded-lg shadow-xl">
          <CardHeader className="p-4 bg-accent text-accent-foreground rounded-t-lg">
            <CardTitle className="text-lg font-semibold">
              {selectedNFT ? `Details for NFT #${String(selectedNFT.itemId)}` : "Select an NFT"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!selectedNFT ? (
              <p className="text-sm text-muted-foreground">
                Click one of your NFTs on the left to view details.
              </p>
            ) : (
              <>
                {/* Image */}
                <div className="relative mb-4 h-64 w-full overflow-hidden rounded-md border border-border bg-secondary">
                  {(() => {
                    const itemIdStr = String(selectedNFT.itemId)
                    const meta = metadataMap[itemIdStr] || {
                      imageUrl: selectedNFT.resourceUrl,
                      name: "",
                      description: "",
                      attributes: {}
                    }
                    if (!meta.imageUrl) return null

                    return (
                      <Image
                        src={meta.imageUrl}
                        alt={`NFT #${String(selectedNFT.itemId)}`}
                        fill
                        sizes="(max-width: 768px) 100vw,
                               (max-width: 1200px) 50vw,
                               33vw"
                        className="object-contain"
                      />
                    )
                  })()}
                </div>

                {/* Display name/desc/attributes from metadata */}
                {(() => {
                  const itemIdStr = String(selectedNFT.itemId)
                  const meta = metadataMap[itemIdStr] || {
                    imageUrl: selectedNFT.resourceUrl,
                    name: "",
                    description: "",
                    attributes: {}
                  }
                  return (
                    <>
                      <div className="flex flex-col gap-1 text-sm">
                        <strong>Name:</strong>
                        <span>{meta.name || `NFT #${String(selectedNFT.itemId)}`}</span>
                      </div>
                      <div className="mt-2 flex flex-col gap-1 text-sm">
                        <strong>Description:</strong>
                        <span className="text-muted-foreground whitespace-pre-wrap">
                          {meta.description || "No description"}
                        </span>
                      </div>
                      {Object.keys(meta.attributes).length > 0 && (
                        <div className="mt-2">
                          <strong className="text-sm">Attributes:</strong>
                          <div className="mt-1 text-sm rounded-md border border-border bg-secondary p-3">
                            <pre className="whitespace-pre-wrap break-all text-muted-foreground">
                              {JSON.stringify(meta.attributes, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                <hr className="my-4 border-border" />
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
                    <strong>Price:</strong> {(Number(selectedNFT.salePrice) / 1e18).toFixed(4)} {currencySymbol}
                  </p>
                )}
                {selectedNFT.stakeInfo?.staked &&
                  selectedNFT.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase() && (
                    <p className="text-sm mb-1 text-green-600">
                      <strong>Staked:</strong> This NFT is currently staked.
                    </p>
                  )}

                {/* List Form */}
                <form onSubmit={handleListNFT} className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium">Sale Price ({currencySymbol})</label>
                    <Input
                      type="number"
                      step="0.001"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.1"
                      className="mt-1"
                      disabled={
                        selectedNFT.stakeInfo?.staked &&
                        selectedNFT.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase()
                      }
                    />
                  </div>
                  {selectedNFT.stakeInfo?.staked &&
                    selectedNFT.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase() ? (
                    <p className="text-sm text-orange-600 font-semibold">
                      This NFT is currently staked. Unstake before listing.
                    </p>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!price || isListPending || isListTxLoading}
                      className="w-full"
                    >
                      {isListPending || isListTxLoading ? "Processing..." : "List for Sale"}
                    </Button>
                  )}
                  <TransactionStatus
                    isLoading={isListTxLoading}
                    isSuccess={isListTxSuccess}
                    errorMessage={
                      isListTxError ? (listTxReceiptError?.message || listError?.message) : null
                    }
                    txHash={listWriteData ?? null}
                    chainId={chainId}
                  />
                </form>

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

                    <TransactionStatus
                      isLoading={isUnlistTxLoading}
                      isSuccess={isUnlistTxSuccess}
                      errorMessage={
                        isUnlistTxError
                          ? (unlistTxReceiptError?.message || unlistError?.message)
                          : null
                      }
                      txHash={unlistWriteData ?? null}
                      chainId={chainId}
                      className="mt-2"
                    />
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}