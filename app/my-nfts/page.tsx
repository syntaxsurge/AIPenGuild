'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TransactionStatus } from "@/components/ui/transaction-status"
import { useNativeCurrencySymbol } from "@/hooks/use-native-currency-symbol"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
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
  metadata?: ParsedNftMetadata
}

export default function MyNFTsPage() {
  const { address: wagmiAddress } = useAccount()
  const currencySymbol = useNativeCurrencySymbol()
  const publicClient = usePublicClient()
  const chainId = useChainId() || 1287
  const { toast } = useToast()

  const nftMarketplaceHub = useContract("NFTMarketplaceHub")
  const nftStakingPool = useContract("NFTStakingPool")
  const nftMintingPlatform = useContract("NFTMintingPlatform")

  // For list/unlist writes
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

  const [price, setPrice] = useState("")
  const [userNFTs, setUserNFTs] = useState<NFTDetails[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTDetails | null>(null)
  const [currentMaxId, setCurrentMaxId] = useState<bigint | null>(null)
  const [loadingNFTs, setLoadingNFTs] = useState(false)

  const fetchedUserNFTsRef = useRef(false)
  const latestItemIdFetchedRef = useRef(false)

  // watchers for listing
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
  }, [isUnlistTxLoading, isUnlistTxSuccess, isUnlistTxError, unlistTxReceiptError, unlistError, toast, selectedNFT])

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
      const items: NFTDetails[] = []

      for (let i = 1; i <= total; i++) {
        const tokenId = BigInt(i)
        try {
          const owner = await publicClient.readContract({
            address: nftMintingPlatform.address as `0x${string}`,
            abi: nftMintingPlatform.abi,
            functionName: "ownerOf",
            args: [tokenId],
          }) as `0x${string}`

          const itemData = await publicClient.readContract({
            address: nftMintingPlatform.address as `0x${string}`,
            abi: nftMintingPlatform.abi,
            functionName: "nftItems",
            args: [tokenId],
          }) as [bigint, string, bigint, string]

          const xpValue = itemData[0]
          const resourceUrl = itemData[1]
          const mintedAt = itemData[2]
          const creator = itemData[3]

          const marketItem = await publicClient.readContract({
            address: nftMarketplaceHub.address as `0x${string}`,
            abi: nftMarketplaceHub.abi,
            functionName: "marketItems",
            args: [tokenId],
          }) as [boolean, bigint]

          const isOnSale = marketItem[0]
          const salePrice = marketItem[1]

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
            items.push({
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

      const metadataPromises = items.map((nft) => fetchNftMetadata(nft.resourceUrl))
      const allMetadata = await Promise.all(metadataPromises)
      for (let i = 0; i < items.length; i++) {
        items[i].metadata = allMetadata[i]
      }

      setUserNFTs(items)
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
  }, [wagmiAddress, currentMaxId]) // fetch user NFTs whenever we have a connected wallet & maxId

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
                  const isStaked =
                    nft.stakeInfo?.staked &&
                    nft.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase()
                  const label = isStaked
                    ? "(STAKED)"
                    : nft.isOnSale
                      ? "(LISTED)"
                      : ""
                  const selected = selectedNFT?.itemId === nft.itemId
                  const imageUrl = nft.metadata?.imageUrl || ""

                  return (
                    <div
                      key={String(nft.itemId)}
                      onClick={() => setSelectedNFT(nft)}
                      className={`cursor-pointer rounded-md border-2 p-2 transition-transform hover:scale-[1.02] ${selected ? "border-primary" : "border-border"
                        }`}
                    >
                      <div className="relative h-36 w-full overflow-hidden rounded-md bg-secondary">
                        {imageUrl && (
                          <Image
                            src={imageUrl}
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
                        NFT #{String(nft.itemId)} {label}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

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
                <div className="relative mb-4 h-64 w-full overflow-hidden rounded-md border border-border bg-secondary">
                  {selectedNFT.metadata?.imageUrl && (
                    <Image
                      src={selectedNFT.metadata.imageUrl}
                      alt={`NFT #${String(selectedNFT.itemId)}`}
                      fill
                      sizes="(max-width: 768px) 100vw,
                             (max-width: 1200px) 50vw,
                             33vw"
                      className="object-contain"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1 text-sm">
                  <strong>Name:</strong>
                  <span>{selectedNFT.metadata?.name || `NFT #${String(selectedNFT.itemId)}`}</span>
                </div>
                <div className="mt-2 flex flex-col gap-1 text-sm">
                  <strong>Description:</strong>
                  <span className="text-muted-foreground whitespace-pre-wrap">
                    {selectedNFT.metadata?.description || "No description"}
                  </span>
                </div>
                {selectedNFT.metadata?.attributes && (
                  <div className="mt-2">
                    <strong className="text-sm">Attributes:</strong>
                    <div className="mt-1 text-sm rounded-md border border-border bg-secondary p-3">
                      <pre className="whitespace-pre-wrap break-all text-muted-foreground">
                        {JSON.stringify(selectedNFT.metadata.attributes, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <hr className="my-4 border-border" />
                <p className="text-sm mb-1">
                  <strong>Minted Time:</strong> {new Date(Number(selectedNFT.mintedAt) * 1000).toLocaleString()}
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
                    <strong>Price:</strong> {(Number(selectedNFT.salePrice) / 1e18).toFixed(4)} {currencySymbol}
                  </p>
                )}
                {selectedNFT.stakeInfo?.staked &&
                  selectedNFT.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase() && (
                    <p className="text-sm mb-1 text-green-600">
                      <strong>Staked:</strong> This NFT is currently staked.
                    </p>
                  )}

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
                    errorMessage={isListTxError ? (listTxReceiptError?.message || listError?.message) : null}
                    txHash={listWriteData ?? null}
                    chainId={chainId}
                  />
                </form>

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
                      errorMessage={isUnlistTxError ? (unlistTxReceiptError?.message || unlistError?.message) : null}
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