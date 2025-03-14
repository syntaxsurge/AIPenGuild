"use client"
import React, { useState } from "react"
import { useAccount } from "wagmi"
import { parseEther } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useContract } from "@/hooks/useContract"
import { useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from "@wagmi/core"
import { config } from "@/providers/config"
import Image from "next/image"
import { Loader2 } from "lucide-react"

interface CollectionForm {
  name: string
  description: string 
  mintPrice: string
  maxSupply: string
}

export default function CreateCollectionPage() {
  const { address: wagmiAddress } = useAccount()
  const { data: hash, error, isPending, isSuccess, writeContract } = useWriteContract()
  const { toast } = useToast()

  const [formData, setFormData] = useState<CollectionForm>({
    name: "",
    description: "",
    mintPrice: "",
    maxSupply: ""
  })

  const nftMarketplace = useContract("NFTMarketplace")
  const creatorCollection = useContract("CreatorCollection")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!wagmiAddress) {
        toast({
          title: "Error",
          description: "Please connect your wallet first.",
          variant: "destructive"
        })
        return
      }
      if (!nftMarketplace || !creatorCollection) {
        toast({
          title: "Error",
          description: "No contract found. Check your config.",
          variant: "destructive"
        })
        return
      }

      const createCollectionABI = {
        name: "defineNewCollection",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "nameValue", type: "string" },
          { name: "descriptionValue", type: "string" },
          { name: "price", type: "uint256" },
          { name: "supplyLimit", type: "uint256" }
        ],
        outputs: []
      }

      await writeContract({
        address: creatorCollection.address as `0x${string}`,
        abi: [createCollectionABI],
        functionName: "createCollection",
        args: [
          formData.name,
          formData.description, 
          parseEther(formData.mintPrice),
          BigInt(formData.maxSupply)
        ]
      })

      const registerCollectionABI = {
        name: "registerAIDerivedContract",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "collectionAddr", type: "address" }],
        outputs: []
      }
      await writeContract({
        address: nftMarketplace.address as `0x${string}`,
        abi: [registerCollectionABI],
        functionName: "registerCollection",
        args: [creatorCollection.address as `0x${string}`]
      })

      toast({
        title: "Processing",
        description: "Confirming transaction on chain..."
      })

      const receipt = await waitForTransactionReceipt(config, {
        hash: hash as `0x${string}`
      })
      if (!receipt) throw new Error("Transaction failed.")

      toast({
        title: "Success",
        description: "Your new collection has been created and registered!"
      })
    } catch (err: any) {
      toast({
        title: "Transaction failed",
        description: error?.message || err?.message || "An error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <h1 className="mb-4 text-center text-3xl font-extrabold text-primary">Create New NFT Collection</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Launch your AI-powered NFT collection on AIPenGuild in moments.
      </p>

      <Card className="border border-border rounded-lg">
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-semibold">Collection Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4">
          <form onSubmit={handleCreateCollection} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Collection Name</label>
              <Input
                type="text"
                placeholder="Cyberpunk Dreams"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <Input
                type="text"
                placeholder="What makes it unique?"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="w-full">
                <label className="mb-1 block text-sm font-medium">Mint Price (ETH)</label>
                <Input
                  type="number"
                  name="mintPrice"
                  placeholder="0.05"
                  step="0.001"
                  value={formData.mintPrice}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="w-full">
                <label className="mb-1 block text-sm font-medium">Max Supply</label>
                <Input
                  type="number"
                  name="maxSupply"
                  placeholder="1000"
                  value={formData.maxSupply}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="mt-4 w-full">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : isSuccess ? "Collection Created!" : "Create Collection"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}