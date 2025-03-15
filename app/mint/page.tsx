'use client'

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Brain, Wand, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { parseEther } from "viem"
import { useContract } from "@/hooks/use-contract"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

async function uploadFileToIpfs(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch("https://rest.unique.network/opal/v1/ipfs/upload-file", {
    method: "POST",
    body: formData
  })
  if (!res.ok) throw new Error("Failed to upload file to IPFS")
  const data = await res.json()
  return data.fullUrl
}

export default function MintNFTPage() {
  const { address: wagmiAddress } = useAccount()
  const { toast } = useToast()
  const creatorCollection = useContract("CreatorCollection")

  const {
    data: writeData,
    error,
    isPending: isWritePending,
    isSuccess: isWriteSuccess,
    writeContract
  } = useWriteContract()

  const {
    data: txReceipt,
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    isError: isTxError,
    error: txError
  } = useWaitForTransactionReceipt({
    hash: writeData ?? undefined
  })

  const [prompt, setPrompt] = useState("")
  const [aiNft, setAiNft] = useState<any>(null)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generateImageError, setGenerateImageError] = useState("")
  const [showPromptError, setShowPromptError] = useState(false)

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [useAIImage, setUseAIImage] = useState(true)
  const [mintError, setMintError] = useState("")

  async function handleGenerateImage() {
    if (!prompt.trim()) {
      setShowPromptError(true)
      return
    }
    setShowPromptError(false)
    setAiNft(null)
    setGenerateImageError("")
    setGeneratingImage(true)
    try {
      const resp = await fetch("/api/v1/ai-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      })
      if (!resp.ok) throw new Error("AI generation request failed.")
      const data = await resp.json()
      if (!data.success) {
        throw new Error(data.error || "AI generation error occurred.")
      }
      setAiNft(data)
      toast({
        title: "Generation Complete",
        description: "Your AI-generated image is ready. We'll upload it to IPFS before minting."
      })
    } catch (err: any) {
      setGenerateImageError(err.message || "Failed to generate image")
      toast({
        title: "Generation Error",
        description: err.message || "Failed to generate image",
        variant: "destructive"
      })
    } finally {
      setGeneratingImage(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setUploadedFile(file)
    setAiNft(null)
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  async function handleMint() {
    try {
      setMintError("")
      if (!wagmiAddress) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet or switch to a supported network before minting.",
          variant: "destructive"
        })
        return
      }
      if (!creatorCollection) {
        toast({
          title: "No Contract Found",
          description: "CreatorCollection contract not found. Check your chain or config.",
          variant: "destructive"
        })
        return
      }

      let finalImageUrl = ""
      if (useAIImage) {
        if (!aiNft?.imageUrl) {
          setMintError("No AI image found. Generate or upload an image first.")
          toast({
            title: "No AI Image",
            description: "Please generate or upload an image before minting.",
            variant: "destructive"
          })
          return
        }
        toast({ title: "Uploading to IPFS...", description: "Please wait" })
        const imageData = await fetch(aiNft.imageUrl)
        if (!imageData.ok) throw new Error("Failed to fetch AI image for re-upload to IPFS")
        const blob = await imageData.blob()
        const file = new File([blob], "ai_nft.png", { type: blob.type })
        finalImageUrl = await uploadFileToIpfs(file)
      } else {
        if (!uploadedFile) {
          setMintError("No manual upload found. Please generate or upload an image first.")
          toast({
            title: "No NFT Image",
            description: "Please generate or upload an image before minting.",
            variant: "destructive"
          })
          return
        }
        toast({ title: "Uploading to IPFS...", description: "Please wait" })
        finalImageUrl = await uploadFileToIpfs(uploadedFile)
      }

      const mintFromCollectionABI = {
        name: "mintFromCollection",
        type: "function",
        stateMutability: "payable",
        inputs: [
          { name: "collectionId", type: "uint256" },
          { name: "imageUrl", type: "string" }
        ],
        outputs: []
      }

      await writeContract({
        address: creatorCollection?.address as `0x${string}`,
        abi: [mintFromCollectionABI],
        functionName: "mintFromCollection",
        args: [0, finalImageUrl],
        value: parseEther("0.1")
      })

      toast({
        title: "Mint Transaction",
        description: "Transaction submitted... awaiting confirmation."
      })
    } catch (err: any) {
      setMintError(err.message || "Unable to mint NFT")
      toast({
        title: "Mint Failure",
        description: err.message || "Unable to mint NFT",
        variant: "destructive"
      })
    }
  }

  // Show toasts for transaction events
  useEffect(() => {
    if (isTxLoading) {
      toast({
        title: "Transaction Pending",
        description: "Your mint transaction is being confirmed..."
      })
    }
    if (isTxSuccess) {
      toast({
        title: "Transaction Successful!",
        description: "NFT minted successfully! Check your wallet or see in My NFTs."
      })
    }
    if (isTxError) {
      toast({
        title: "Transaction Failed",
        description: txError?.message || "Something went wrong.",
        variant: "destructive"
      })
    }
  }, [isTxLoading, isTxSuccess, isTxError, txError, toast])

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <h1 className="mb-4 text-center text-4xl font-extrabold text-primary">Create AI NFT</h1>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Generate or upload your NFT image and mint from the default collection.
      </p>

      <Card className="border border-border shadow-lg rounded-lg p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Wand className="h-5 w-5" />
            NFT Image Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              Choose how to get your NFT image
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant={useAIImage ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setUseAIImage(true)
                  setUploadedFile(null)
                  setPreviewUrl(null)
                }}
              >
                <Brain className="mr-1 h-4 w-4" />
                Generate with AI
              </Button>
              <Button
                variant={!useAIImage ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setUseAIImage(false)
                  setAiNft(null)
                }}
              >
                <Upload className="mr-1 h-4 w-4" />
                Upload Custom Image
              </Button>
            </div>
          </div>

          {useAIImage && (
            <div className="rounded-md bg-secondary p-4">
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Enter an AI Prompt
              </label>
              <Input
                placeholder="e.g. Surreal cityscape with neon vibes"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              {showPromptError && (
                <p className="mt-1 text-xs text-destructive">Please enter a prompt.</p>
              )}
              <Button onClick={handleGenerateImage} disabled={generatingImage} className="mt-2 w-full">
                {generatingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Image...
                  </>
                ) : (
                  "Generate Image"
                )}
              </Button>
              {generateImageError && (
                <p className="mt-2 text-xs text-destructive">{generateImageError}</p>
              )}
              {aiNft && (
                <div className="mt-4 flex flex-col items-center space-y-2">
                  <div className="relative h-48 w-48 overflow-hidden rounded-md border border-border">
                    <Image
                      src={aiNft.imageUrl}
                      alt="AI NFT Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!useAIImage && (
            <div className="rounded-md bg-secondary p-4">
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Upload Custom Image
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file:mr-4 file:rounded file:border-0 file:bg-accent file:px-4 file:py-2 file:text-accent-foreground hover:file:bg-accent/90"
              />
              {uploadedFile && previewUrl && (
                <div className="mt-4 flex flex-col items-center space-y-2">
                  <div className="relative h-48 w-48 overflow-hidden rounded-md border border-border">
                    <Image
                      src={previewUrl}
                      alt="Custom NFT Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border shadow-lg rounded-lg mt-8 p-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Mint the NFT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleMint}
              disabled={isWritePending || isTxLoading}
              className="w-full"
            >
              {isWritePending || isTxLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isWritePending ? "Waiting for Wallet..." : "Minting..."}
                </>
              ) : (
                "Mint NFT"
              )}
            </Button>

            {mintError && (
              <p className="text-xs text-destructive break-words whitespace-pre-wrap">{mintError}</p>
            )}

            {/* Transaction Status block */}
            <div className="rounded-md border border-border p-4 mt-2 text-sm">
              <p className="font-medium">Transaction Status:</p>
              {isTxLoading && <p className="text-muted-foreground">Pending confirmation...</p>}
              {isTxSuccess && (
                <p className="text-green-600">
                  Transaction Confirmed! Your NFT is minted.
                </p>
              )}
              {isTxError && (
                <p className="font-bold text-orange-600 dark:text-orange-500">
                  Transaction Failed: {txError?.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}