"use client"
import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Brain, Wand, BookOpen, Info, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { parseEther } from "viem"
import { useContract } from "@/hooks/useContract"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * Updated to use `useWaitForTransactionReceipt` from wagmi instead of `useWaitForTransaction`.
 * For older wagmi versions that do not export useWaitForTransaction,
 * we rely on useWaitForTransactionReceipt which uses a hash.
 */

export default function MintNFTPage() {
  const { address: wagmiAddress } = useAccount()
  const { toast } = useToast()

  // Our CreatorCollection contract instance
  const creatorCollection = useContract("CreatorCollection")

  // For initiating writes
  const {
    data: writeData,       // This is the transaction hash (0x...)
    error,
    isPending: isWritePending,
    isSuccess: isWriteSuccess,
    writeContract
  } = useWriteContract()

  // Wait for the transaction receipt using the hash (writeData)
  // If no hash is present, pass undefined to avoid errors
  const {
    data: txReceipt,
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    isError: isTxError,
    error: txError
  } = useWaitForTransactionReceipt({
    hash: writeData ?? undefined
  })

  // Prompt for AI generation
  const [prompt, setPrompt] = useState("")
  // AI Image data from replicate
  const [aiNft, setAiNft] = useState<any>(null)
  // Upload-based image
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Toggles for AI or manual image, AI or manual story
  const [useAIImage, setUseAIImage] = useState(true)
  const [useAIStory, setUseAIStory] = useState(true)

  // States for the story metadata
  const [metadataStory, setMetadataStory] = useState("")
  const [manualMetadata, setManualMetadata] = useState("")

  // States for loading & errors
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatingStory, setGeneratingStory] = useState(false)
  const [mintError, setMintError] = useState("")
  const [generateImageError, setGenerateImageError] = useState("")
  const [generateStoryError, setGenerateStoryError] = useState("")
  const [showPromptError, setShowPromptError] = useState(false)

  // Let user pick which collection ID to mint from (0 => primary, 1 => new)
  const [collectionId, setCollectionId] = useState("0")

  // -------------- AI Image Generation --------------
  async function handleGenerateImage() {
    if (!prompt.trim()) {
      setShowPromptError(true)
      return
    }
    setShowPromptError(false)
    setAiNft(null)
    setMetadataStory("")
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
        description: "Your AI-generated image is ready."
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

  // -------------- AI Story Generation --------------
  async function handleGenerateStory() {
    if (useAIImage && !aiNft) {
      setGenerateStoryError("No AI NFT image found. Generate or upload an image first.")
      toast({
        title: "No Image",
        description: "Generate or upload an image before creating a story.",
        variant: "destructive"
      })
      return
    }
    setGenerateStoryError("")
    setGeneratingStory(true)
    try {
      const firstTrait = aiNft?.metadata?.attributes?.[0]?.value || "Your NFT"
      const res = await fetch("/api/v1/ai-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Create a short story about ${firstTrait} in a futuristic world.`
        })
      })
      const storyData = await res.json()
      if (!storyData.success) {
        throw new Error(storyData.error || "Story generation error.")
      }
      setMetadataStory(storyData.story)
      toast({
        title: "Story Generated",
        description: "An AI-based story has been created for your NFT!"
      })
    } catch (err: any) {
      setGenerateStoryError(err.message || "Unable to generate story")
      toast({
        title: "Metadata Error",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setGeneratingStory(false)
    }
  }

  // -------------- File Upload --------------
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setUploadedFile(file)
    setAiNft(null) // reset AI image if user chooses manual upload
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  // -------------- Mint NFT --------------
  async function handleMint() {
    try {
      setMintError("")

      // Check connection
      if (!wagmiAddress) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet or switch to a supported network before minting.",
          variant: "destructive"
        })
        return
      }
      // Check we have an image
      const finalImageUrl = useAIImage ? aiNft?.imageUrl : previewUrl
      if (!finalImageUrl) {
        setMintError("No NFT image found. Please generate or upload an image first.")
        toast({
          title: "No NFT Image",
          description: "Please generate or upload an image before minting.",
          variant: "destructive"
        })
        return
      }

      // If user is using manual metadata, use that, else use AI story
      // (Not storing finalMetadata on-chain here, but you could store it in IPFS.)
      const finalMetadata = useAIStory ? metadataStory : manualMetadata

      // Prepare the mint call to CreatorCollection
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
        args: [
          parseInt(collectionId),
          finalImageUrl
        ],
        value: parseEther("0.1") // 0.1 DEV or ETH
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

  // -------------- Transaction Status Handling --------------
  // Show toast messages once the transaction changes
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
        description: "NFT minted successfully! Check your wallet or view it in My NFTs."
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

  // -------------- UI Rendering --------------
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <h1 className="mb-4 text-center text-4xl font-extrabold text-primary">Create AI NFT</h1>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Generate or upload your NFT image, add optional AI-based or manual metadata, and mint from your chosen collection.
      </p>

      {/* Collection Selection */}
      <Card className="mb-8 border border-border shadow-lg rounded-lg">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Info className="h-5 w-5" />
            Select Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pick which collection ID you want to mint from. 0 = primary, 1 or higher = additional collections.
          </p>
          <Select value={collectionId} onValueChange={setCollectionId}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Collection ID" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Primary Collection (ID=0)</SelectItem>
              <SelectItem value="1">Collection #1</SelectItem>
              {/* Add more if defineNewCollection is used */}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Image Source: AI or Upload */}
      <Card className="border border-border shadow-lg rounded-lg p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Wand className="h-5 w-5" />
            NFT Image Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle: AI-based image or manual upload */}
          <div>
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              <Wand className="mr-1 inline-block h-4 w-4" /> Select NFT Image Source
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
                Upload Custom Image
              </Button>
            </div>
          </div>

          {/* AI-based image */}
          {useAIImage && (
            <div className="rounded-md bg-secondary p-4">
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                <Brain className="mr-1 inline-block h-4 w-4" /> AI Prompt
              </label>
              <Input
                placeholder="Describe your NFT concept..."
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

              {/* Preview AI Image */}
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

          {/* Manual file upload */}
          {!useAIImage && (
            <div className="rounded-md bg-secondary p-4">
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                <Upload className="mr-1 inline-block h-4 w-4" /> Upload Custom Image
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

      {/* Metadata / Story */}
      <Card className="border border-border shadow-lg rounded-lg mt-8 p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5" />
            Metadata / Story
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              <BookOpen className="mr-1 inline-block h-4 w-4" /> Choose Story Generation
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant={useAIStory ? "default" : "outline"}
                size="sm"
                onClick={() => setUseAIStory(true)}
              >
                Generate AI Story
              </Button>
              <Button
                variant={!useAIStory ? "default" : "outline"}
                size="sm"
                onClick={() => setUseAIStory(false)}
              >
                Manual Metadata
              </Button>
            </div>
          </div>

          {useAIStory && (
            <div>
              <Button
                onClick={handleGenerateStory}
                disabled={generatingStory}
                variant="secondary"
                className="w-full"
              >
                {generatingStory ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Story...
                  </>
                ) : (
                  "Generate AI Story"
                )}
              </Button>
              {generateStoryError && (
                <p className="mt-2 text-xs text-destructive">{generateStoryError}</p>
              )}
              {metadataStory && (
                <div className="mt-3 rounded-md bg-accent p-3 text-sm text-accent-foreground whitespace-pre-line">
                  {metadataStory}
                </div>
              )}
            </div>
          )}

          {!useAIStory && (
            <textarea
              className="w-full h-28 mt-2 p-2 border border-input rounded-md bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Write your custom NFT description or story here..."
              value={manualMetadata}
              onChange={(e) => setManualMetadata(e.target.value)}
            />
          )}
        </CardContent>
      </Card>

      {/* Final Mint CTA */}
      <Card className="border border-border shadow-lg rounded-lg mt-8 p-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wand className="h-5 w-5" />
            Finalize &amp; Mint
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

            {/* Display final transaction success or error */}
            {isTxSuccess && (
              <p className="text-xs text-green-600">
                Transaction Confirmed! Your NFT is minted.
              </p>
            )}
            {isTxError && (
              <p className="text-xs text-red-600 break-words whitespace-pre-wrap">
                Transaction Failed: {txError?.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}