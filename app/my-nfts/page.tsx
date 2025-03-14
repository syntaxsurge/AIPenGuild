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
 * Previously: "list-nft"
 * Updated to "my-nfts" for clarity and improved naming convention.
 * This page shows the NFTs you own, letting you list them for sale if desired.
 */

interface NFTDetails {
  itemId: bigint
  creator: string
  xpValue: bigint
  isOnSale: boolean
  salePrice: bigint
  resourceUrl: string
}

export default function MyNFTsPage() {
  const { address: wagmiAddress } = useAccount()
  const publicClient = usePublicClient()
  const { toast } = useToast()
  const nftMarketplace = useContract("NFTMarketplace")
  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const [price, setPrice] = useState("")
  const [ownedNFTs, setOwnedNFTs] = useState<NFTDetails[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTDetails | null>(null)

  // Retrieve total minted token count from the contract
  const { data: currentTokenId } = useContractRead({
    address: nftMarketplace?.address as `0x${string}`,
    abi: nftMarketplace?.abi,
    functionName: "getLatestItemId"
  })

  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      if (!wagmiAddress || !currentTokenId || !nftMarketplace?.address || !nftMarketplace?.abi || !publicClient) return
      const ownedTokens: NFTDetails[] = []
      for (let i = 1; i <= Number(currentTokenId); i++) {
        try {
          // Check if user is the owner
          const owner = (await publicClient.readContract({
            address: nftMarketplace.address as `0x${string}`,
            abi: nftMarketplace.abi,
            functionName: "ownerOf",
            args: [BigInt(i)]
          })) as `0x${string}`

          if (owner.toLowerCase() === wagmiAddress.toLowerCase()) {
            // Get item data from public mapping
            const details = (await publicClient.readContract({
              address: nftMarketplace.address as `0x${string}`,
              abi: nftMarketplace.abi,
              functionName: "itemData",
              args: [BigInt(i)]
            })) as [bigint, string, bigint, boolean, bigint, string]

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
          // Some tokens may not exist or revert. Just continue for others
        }
      }
      setOwnedNFTs(ownedTokens)
    }
    fetchOwnedNFTs()
  }, [wagmiAddress, currentTokenId, nftMarketplace, publicClient])

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
        address: nftMarketplace?.address as `0x${string}`,
        abi: [abiListNFT],
        functionName: "listAIItem",
        args: [selectedNFT.itemId, parseEther(price)]
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
            <div className="grid grid-cols-2 gap-4">
              {ownedNFTs.map((nft) => (
                <div
                  key={String(nft.itemId)}
                  onClick={() => setSelectedNFT(nft)}
                  className={`cursor-pointer rounded-lg border-2 p-2 transition-transform hover:scale-105 ${
                    selectedNFT?.itemId === nft.itemId ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="relative h-24 w-full overflow-hidden rounded-md">
                    <Image
                      src={nft.resourceUrl}
                      alt={`NFT #${nft.itemId}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Item ID: {String(nft.itemId)}</p>
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