'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { Brain, Loader2, Upload, Wand } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useState } from "react"
import { parseEther } from "viem"
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi"

async function uploadFileToIpfs(file: File): Promise<string> {
  const formData = new FormData()
  // Field name changed to "files"
  formData.append("files", file)
  const res = await fetch("https://rest.unique.network/opal/v1/ipfs/upload-files", {
    method: "POST",
    body: formData
  })
  if (!res.ok) throw new Error("Failed to upload file to IPFS")
  const data = await res.json()
  // Return the "fullUrl" from the server response
  return data.fullUrl
}

async function uploadJsonToIpfs(jsonData: any): Promise<string> {
  // Convert json to a Blob or file
  const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' })
  const file = new File([blob], "metadata.json", { type: "application/json" })

  const formData = new FormData()
  // Field name changed to "files"
  formData.append("files", file)
  const res = await fetch("https://rest.unique.network/opal/v1/ipfs/upload-files", {
    method: "POST",
    body: formData
  })
  if (!res.ok) throw new Error("Failed to upload JSON to IPFS")
  const data = await res.json()
  return data.fullUrl
}

export default function MintNFTPage() {
  const { address: wagmiAddress } = useAccount()
  const { toast } = useToast()
  const creatorCollection = useContract("NFTCreatorCollection")

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
  } = useWaitForTransactionReceipt({ hash: writeData ?? undefined })

  const [prompt, setPrompt] = useState("")
  const [category, setCategory] = useState("Character")
  const [aiNft, setAiNft] = useState<any>(null)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generateImageError, setGenerateImageError] = useState("")
  const [showPromptError, setShowPromptError] = useState(false)

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [useAIImage, setUseAIImage] = useState(true)
  const [mintError, setMintError] = useState("")

  // Step 1: Combined generation from LLM + replicate
  async function handleGenerateAttributesAndImage() {
    if (!prompt.trim()) {
      setShowPromptError(true)
      return
    }
    setShowPromptError(false)
    setAiNft(null)
    setGenerateImageError("")
    setGeneratingImage(true)
    try {
      // We'll call our new route that merges LLM attribute generation + replicate image
      const resp = await fetch("/api/v1/ai-nft/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, category })
      })
      if (!resp.ok) throw new Error("Metadata generation request failed.")
      const data = await resp.json()
      if (!data.success) {
        throw new Error(data.error || "AI generation error occurred.")
      }
      // data.metadata => { name, image, attributes: {...} }
      setAiNft(data.metadata)
      toast({
        title: "LLM + Image Generation Complete",
        description: "We have an AI-generated image and attributes ready. We'll upload them to IPFS before minting."
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

  // Step 2: Do the final mint flow
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
          description: "NFTCreatorCollection contract not found. Check your chain or config.",
          variant: "destructive"
        })
        return
      }

      let finalMetadataUrl = ""
      // If using advanced LLM path
      if (useAIImage) {
        if (!aiNft?.image) {
          setMintError("No AI metadata found. Generate or upload an image first.")
          toast({
            title: "No AI Data",
            description: "Please generate or upload an image/metadata before minting.",
            variant: "destructive"
          })
          return
        }
        toast({ title: "Uploading to IPFS...", description: "Please wait" })

        // We'll store the entire aiNft object in IPFS as metadata
        // But first we should store the AI image itself in IPFS if we want
        // The route gave us a direct replicate link. We'll re-upload for permanent IPFS storage
        const imageData = await fetch(aiNft.image)
        if (!imageData.ok) throw new Error("Failed to fetch AI image for re-upload to IPFS")
        const blob = await imageData.blob()
        const file = new File([blob], "ai_nft.png", { type: blob.type })
        const imageIpfsUrl = await uploadFileToIpfs(file)

        // now put that IPFS url in the metadata
        const finalMetadata = {
          ...aiNft,
          image: imageIpfsUrl
        }
        finalMetadataUrl = await uploadJsonToIpfs(finalMetadata)
      } else {
        // Manual upload path
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
        const imageIpfsUrl = await uploadFileToIpfs(uploadedFile)
        // minimal JSON
        const finalMetadata = {
          name: prompt || "Untitled NFT",
          image: imageIpfsUrl,
          attributes: {}
        }
        finalMetadataUrl = await uploadJsonToIpfs(finalMetadata)
      }

      // Step 3: call the contract
      // function mintFromCollection(uint256 collectionId, string memory imageUrl) payable
      // We'll store finalMetadataUrl as the "imageUrl" param for simplicity
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

      // For example, we use collectionId = 0, with a 0.1 ETH mint fee
      await writeContract({
        address: creatorCollection?.address as `0x\${string}`,
        abi: [mintFromCollectionABI],
        functionName: "mintFromCollection",
        args: [0, finalMetadataUrl],
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
    <main className="w-full min-h-screen bg-white dark:bg-gray-900 text-foreground flex justify-center px-4 py-12 sm:px-6 md:px-8">
      <div className="max-w-5xl w-full">
        <h1 className="mb-4 text-center text-4xl font-extrabold text-primary">Create AI NFT</h1>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Generate or upload your NFT image and let an LLM create advanced attributes.
        </p>

        <Card className="border border-border shadow-lg rounded-lg p-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Wand className="h-5 w-5" />
              NFT Image &amp; Attribute Options
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
                <div className="mt-2">
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">Category</label>
                  <select
                    className="border border-input bg-background p-2 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Character">Character</option>
                    <option value="GameItem">Game Item</option>
                    <option value="Powerup">Powerup</option>
                  </select>
                </div>
                {showPromptError && (
                  <p className="mt-1 text-xs text-destructive">Please enter a prompt.</p>
                )}
                <Button
                  onClick={handleGenerateAttributesAndImage}
                  disabled={generatingImage}
                  className="mt-2 w-full"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Image & Attributes"
                  )}
                </Button>
                {generateImageError && (
                  <p className="mt-2 text-xs text-destructive">{generateImageError}</p>
                )}
                {aiNft?.image && (
                  <div className="mt-4 flex flex-col items-center space-y-2">
                    <div className="relative h-48 w-48 overflow-hidden rounded-md border border-border">
                      <Image
                        src={aiNft.image}
                        alt="AI NFT Preview"
                        fill
                        sizes="(max-width: 768px) 100vw,
                               (max-width: 1200px) 50vw,
                               33vw"
                        className="object-cover"
                      />
                    </div>
                    <pre className="text-xs bg-secondary p-2 rounded-md w-full overflow-auto">
                      {JSON.stringify(aiNft.attributes, null, 2)}
                    </pre>
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
                  className="file:mr-4 file:rounded file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-foreground hover:file:bg-accent/90"
                />
                {uploadedFile && previewUrl && (
                  <div className="mt-4 flex flex-col items-center space-y-2">
                    <div className="relative h-48 w-48 overflow-hidden rounded-md border border-border">
                      <Image
                        src={previewUrl}
                        alt="Custom NFT Preview"
                        fill
                        sizes="(max-width: 768px) 100vw,
                               (max-width: 1200px) 50vw,
                               33vw"
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
                <p className="text-xs text-destructive break-words whitespace-pre-wrap">
                  {mintError}
                </p>
              )}

              {(isWritePending || isTxLoading || isTxSuccess || isTxError) && (
                <div className="rounded-md border border-border p-4 mt-2 text-sm">
                  <p className="font-bold">Transaction Status:</p>
                  {isTxLoading && <p className="font-bold text-muted-foreground">Pending confirmation...</p>}
                  {isTxSuccess && (
                    <p className="font-bold text-green-600">
                      Transaction Confirmed! Your NFT is minted.
                    </p>
                  )}
                  {isTxError && (
                    <p className="font-bold text-orange-600 dark:text-orange-500 whitespace-pre-wrap break-words">
                      Transaction Failed: {txError?.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}