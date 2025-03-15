"use client"
import React, { useState, useEffect, useRef } from "react"
import { useAccount, usePublicClient } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useContract } from "@/hooks/useContract"
import { useWriteContract } from "wagmi"
import Image from "next/image"
import { parseEther } from "viem"

interface NFTDetails {
  itemId: bigint
  creator: string
  xpValue: bigint
  isOnSale: boolean
  salePrice: bigint
  resourceUrl: string
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
  const aiNftExchange = useContract("AINFTExchange")
  const { data: writeHash, error, isPending, writeContract } = useWriteContract()

  const [price, setPrice] = useState("")
  const [ownedNFTs, setOwnedNFTs] = useState<NFTDetails[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTDetails | null>(null)
  const [metadataMap, setMetadataMap] = useState<Record<string, MetadataState>>({})

  const [currentTokenId, setCurrentTokenId] = useState<bigint | null>(null)
  const fetchedOwnedNFTsRef = useRef(false)

  // 1) Fetch getLatestItemId from the contract
  useEffect(() => {
    async function fetchTokenCount() {
      try {
        if (!aiNftExchange?.address || !aiNftExchange?.abi || !publicClient) return
        const val = await publicClient.readContract({
          address: aiNftExchange.address as `0x${string}`,
          abi: aiNftExchange.abi,
          functionName: "getLatestItemId",
          args: []
        })
        if (typeof val === "bigint") {
          setCurrentTokenId(val)
        }
      } catch (err) {
        console.error("Error reading getLatestItemId:", err)
      }
    }
    if (wagmiAddress && aiNftExchange?.address) {
      fetchTokenCount()
    }
  }, [wagmiAddress, aiNftExchange, publicClient])

  // 2) Fetch the user’s owned tokens
  useEffect(() => {
    async function fetchOwnedNFTs() {
      if (!wagmiAddress || !currentTokenId || !aiNftExchange?.address || !aiNftExchange?.abi || !publicClient) {
        return
      }
      try {
        if (fetchedOwnedNFTsRef.current) return
        fetchedOwnedNFTsRef.current = true

        const totalMinted = Number(currentTokenId)
        const ownedTokens: NFTDetails[] = []

        for (let i = 1; i <= totalMinted; i++) {
          try {
            const owner = await publicClient.readContract({
              address: aiNftExchange.address as `0x${string}`,
              abi: aiNftExchange.abi,
              functionName: "ownerOf",
              args: [BigInt(i)]
            }) as `0x${string}`

            if (owner.toLowerCase() === wagmiAddress.toLowerCase()) {
              const details = await publicClient.readContract({
                address: aiNftExchange.address as `0x${string}`,
                abi: aiNftExchange.abi,
                functionName: "itemData",
                args: [BigInt(i)]
              }) as [bigint, string, bigint, boolean, bigint, string]

              const item: NFTDetails = {
                itemId: details[0],
                creator: details[1],
                xpValue: details[2],
                isOnSale: details[3],
                salePrice: details[4],
                resourceUrl: details[5]
              }
              ownedTokens.push(item)
            }
          } catch (err) {
            // skip missing tokens
          }
        }
        setOwnedNFTs(ownedTokens)
      } catch (err) {
        console.error("[fetchOwnedNFTs]:", err)
      }
    }
    fetchOwnedNFTs()
  }, [wagmiAddress, currentTokenId, aiNftExchange, publicClient])

  // 3) Load metadata
  useEffect(() => {
    async function loadMetadata() {
      if (ownedNFTs.length === 0) return
      const newMap: Record<string, MetadataState> = {}

      for (const nft of ownedNFTs) {
        let finalImageUrl = nft.resourceUrl
        let name = `AI NFT #${String(nft.itemId)}`
        let description = ""

        try {
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
            const maybeJson = await resp.json()
            if (maybeJson.image) finalImageUrl = maybeJson.image
            if (maybeJson.name) name = maybeJson.name
            if (maybeJson.description) description = maybeJson.description
          }
        } catch (err) {
          // ignore
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
  }, [ownedNFTs])

  // 4) Listing NFT for sale
  const handleListNFT = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wagmiAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet before listing an NFT.",
        variant: "destructive"
      })
      return
    }
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
        name: "listAIItem",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "itemId", type: "uint256" },
          { name: "price", type: "uint256" }
        ],
        outputs: []
      }
      await writeContract({
        address: aiNftExchange?.address as `0x\${string}`,
        abi: [abiListNFT],
        functionName: "listAIItem",
        args: [selectedNFT.itemId, parseEther(price)]
      })

      toast({
        title: "Success",
        description: "Your NFT has been listed on the marketplace!"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: error?.message || "An error occurred while listing the NFT",
        variant: "destructive"
      })
    }
  }

  // 4a) Unlisting NFT for sale
  const handleUnlistNFT = async () => {
    if (!wagmiAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet before unlisting an NFT.",
        variant: "destructive"
      })
      return
    }
    if (!selectedNFT || !selectedNFT.isOnSale) {
      toast({
        title: "Error",
        description: "No NFT selected or NFT is not listed.",
        variant: "destructive"
      })
      return
    }
    try {
      const abiUnlistNFT = {
        name: "unlistAIItem",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "itemId", type: "uint256" }],
        outputs: []
      }
      await writeContract({
        address: aiNftExchange?.address as `0x\${string}`,
        abi: [abiUnlistNFT],
        functionName: "unlistAIItem",
        args: [selectedNFT.itemId]
      })

      toast({
        title: "Success",
        description: "Your NFT has been unlisted!"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: error?.message || "An error occurred while unlisting the NFT",
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

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <h1 className="mb-6 text-center text-4xl font-extrabold text-primary">My NFTs</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Here are the NFTs you own. You can list them for sale in one click.
      </p>

      <Card className="border border-border rounded-lg shadow-xl bg-background">
        <CardHeader className="p-4 bg-accent text-accent-foreground rounded-t-lg">
          <CardTitle className="text-lg font-semibold">My NFTs</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {ownedNFTs.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have no NFTs to display.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {ownedNFTs.map((nft) => {
                const meta = metadataMap[String(nft.itemId)] || {}
                const displayUrl = getDisplayUrl(nft)
                return (
                  <div
                    key={String(nft.itemId)}
                    onClick={() => setSelectedNFT(nft)}
                    className={`cursor-pointer rounded-lg border-2 p-2 transition-transform hover:scale-105 ${selectedNFT?.itemId === nft.itemId ? "border-primary" : "border-border"
                      }`}
                  >
                    <div className="relative h-32 w-full overflow-hidden rounded-md sm:h-36">
                      <Image
                        src={displayUrl}
                        alt={`NFT #${nft.itemId}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-1 font-semibold">
                      {meta.name || `NFT #${String(nft.itemId)}`}
                    </p>
                    {nft.isOnSale && (
                      <p className="mt-1 text-xs text-red-500">Listed for sale</p>
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
          {/* Matching background color */}
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
                disabled={!selectedNFT || !price || isPending}
                className="w-full"
              >
                {isPending ? "Processing..." : "List for Sale"}
              </Button>
            </form>

            {/* Unlist NFT button (only if currently on sale) */}
            {selectedNFT?.isOnSale && (
              <Button
                variant="outline"
                onClick={handleUnlistNFT}
                disabled={!selectedNFT || isPending}
                className="mt-4 w-full"
              >
                {isPending ? "Processing..." : "Unlist NFT"}
              </Button>
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
    </main>
  )
}