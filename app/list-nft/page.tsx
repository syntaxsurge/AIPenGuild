"use client"
import React, { useState, useEffect } from "react"
import { useAccount, useContractRead, usePublicClient } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useContract } from "@/hooks/useContract"
import { useWriteContract } from "wagmi"
import Image from "next/image"
import { parseEther } from "viem"

/**
 * Renamed from "create-new-item" to "list-nft" for clarity.
 * This page has a wider styling (max-w-4xl) and a more modern design for listing an NFT.
 */

interface NFTDetails {
  tokenId: bigint
  creator: string
  xpPoints: bigint
  mintPrice: bigint
  isListed: boolean
  listingPrice: bigint
  imageUrl: string
}

export default function ListNFTPage() {
  const { address: wagmiAddress } = useAccount()
  const publicClient = usePublicClient()
  const { toast } = useToast()
  const nftMarketplace = useContract("NFTMarketplace")
  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const [price, setPrice] = useState("")
  const [ownedNFTs, setOwnedNFTs] = useState<NFTDetails[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTDetails | null>(null)

  const { data: currentTokenId } = useContractRead({
    address: nftMarketplace?.address as `0x${string}`,
    abi: nftMarketplace?.abi,
    functionName: "getTokenId"
  })

  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      if (!wagmiAddress || !currentTokenId || !nftMarketplace?.address || !nftMarketplace?.abi || !publicClient) return
      const ownedTokens: NFTDetails[] = []
      for (let i = 1; i <= Number(currentTokenId); i++) {
        try {
          const owner = (await publicClient.readContract({
            address: nftMarketplace.address as `0x${string}`,
            abi: nftMarketplace.abi,
            functionName: "ownerOf",
            args: [BigInt(i)]
          })) as `0x${string}`

          if (owner.toLowerCase() === wagmiAddress.toLowerCase()) {
            const details = (await publicClient.readContract({
              address: nftMarketplace.address as `0x${string}`,
              abi: nftMarketplace.abi,
              functionName: "nftDetails",
              args: [BigInt(i)]
            })) as NFTDetails
            ownedTokens.push(details)
          }
        } catch {}
      }
      setOwnedNFTs(ownedTokens)
    }
    fetchOwnedNFTs()
  }, [wagmiAddress, currentTokenId, nftMarketplace, publicClient])

  const handleListNFT = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if wallet is connected
    if (!wagmiAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet or switch to a supported network before listing an NFT.",
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
        address: nftMarketplace?.address as `0x${string}`,
        abi: [abiListNFT],
        functionName: "listNFTForSale",
        args: [selectedNFT.tokenId, parseEther(price)]
      })
      toast({
        title: "Success",
        description: "Your item has been listed on the marketplace!",
        variant: "default"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: error?.message || "An error occurred while listing the NFT",
        variant: "destructive"
      })
    }
  }

  return (
    <main
      className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground"
    >
      <h1 className="mb-6 text-center text-4xl font-extrabold text-primary">List NFT for Sale</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Choose from your existing NFTs and list them for sale with one click.
      </p>

      <Card className="border border-border rounded-lg shadow-xl bg-background">
        <CardHeader className="p-4 bg-accent text-accent-foreground rounded-t-lg">
          <CardTitle className="text-lg font-semibold">Your NFTs</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {ownedNFTs.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have no NFTs to list.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {ownedNFTs.map((nft) => (
                <div
                  key={String(nft.tokenId)}
                  onClick={() => setSelectedNFT(nft)}
                  className={`cursor-pointer rounded-lg border-2 p-2 transition-transform hover:scale-105 ${
                    selectedNFT?.tokenId === nft.tokenId ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="relative h-24 w-full overflow-hidden rounded-md">
                    <Image
                      src={nft.imageUrl}
                      alt={`NFT #${nft.tokenId}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Token ID: {String(nft.tokenId)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedNFT && (
        <Card className="mt-6 border border-border rounded-lg shadow-xl bg-background">
          <CardHeader className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-primary-foreground rounded-t-lg">
            <CardTitle className="text-lg font-semibold">Set Sale Price</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleListNFT} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Sale Price (WND)</label>
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
              <Button type="submit" disabled={!selectedNFT || !price || isPending} className="w-full">
                {isPending ? "Processing..." : "List for Sale"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  )
}