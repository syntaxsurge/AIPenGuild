"use client"
"use client"
import React, { useState } from "react"
import Image from "next/image"
import { Loader2, Brain, Wand, BookOpen, Info, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { parseEther } from "viem"
import { useContract } from "@/hooks/useContract"
import { useAccount, useWriteContract } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

/**
 * This page now offers two ways to set the NFT image:
 * 1. Generate via AI (Optional).
 * 2. Upload your own custom image.
 *
 * It also allows for AI-based or manual stories (metadata).
 * We have updated references from "AI NFT" to "NFT" to reflect this new flexibility.
 *
 * NOTE: If you click "Mint NFT" and nothing happens:
 * - Ensure your wallet is connected
 * - The contract function here is still a placeholder ("createCollection"),
 *   so you may need to adapt or replace with your real mint function.
 * - Check console for errors
 */

export default function MintNFTPage() {
  const { address: wagmiAddress } = useAccount()
  const { toast } = useToast()
  const creatorCollection = useContract("CreatorCollection")
  const { data: hash, error, isPending, isSuccess, writeContract } = useWriteContract()

  // For user prompt if they want to use AI generation
  const [prompt, setPrompt] = useState("")

  // If user chooses AI generation, we store the AI image data here
  const [aiNft, setAiNft] = useState<any>(null)

  // If user chooses manual image upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Let users pick between AI-based or manual image
  const [useAIImage, setUseAIImage] = useState<boolean>(true)

  // Let users pick between AI-based story or manual story
  const [useAIStory, setUseAIStory] = useState<boolean>(true)

  // AI story generation
  const [metadataStory, setMetadataStory] = useState("")
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatingStory, setGeneratingStory] = useState(false)
  const [minting, setMinting] = useState(false)

  // Additional states for showing messages
  const [showPromptError, setShowPromptError] = useState(false)
  const [generateImageError, setGenerateImageError] = useState<string>("")
  const [generateStoryError, setGenerateStoryError] = useState<string>("")
  const [mintError, setMintError] = useState<string>("")

  // Optional manual metadata field
  const [manualMetadata, setManualMetadata] = useState("")

  // Handle manual file upload selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setUploadedFile(file)
    setAiNft(null) // Reset AI image if user chooses manual
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  // Generate AI Image
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

  // Generate AI story
  async function handleGenerateStory() {
    // If we have no image or haven't generated an AI image, still okay
    // We only need prompt for story. But let's show an error if there's truly no base
    if (useAIImage && !aiNft) {
      setGenerateStoryError("No AI NFT image found. Please generate an image first or switch to upload mode.")
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
      // Use the AI image attribute or prompt for a story
      // If we have an AI NFT with attributes, let's pass that
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

  // Mint logic
  async function handleMint() {
    // Check we have some kind of image (either AI or upload)
    const finalImageUrl = useAIImage
      ? aiNft?.imageUrl
      : previewUrl

    if (!finalImageUrl) {
      setMintError("No NFT image found. Please generate or upload an image first.")
      toast({
        title: "No NFT Image",
        description: "Please generate or upload an image first.",
        variant: "destructive"
      })
      return
    }
    setMintError("")
    setMinting(true)

    // If user is using manual metadata, use that, else use AI story
    const finalMetadata = useAIStory ? metadataStory : manualMetadata

    // Check if wallet is connected
    if (!wagmiAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet or switch to a supported network before minting an NFT.",
        variant: "destructive"
      })
      return
    }

    try {
      // Placeholder contract function. You can adapt to your actual mint function.
      // Updated contract function call to mint NFT from a collection.
      // This calls the mintFromCollection function which is payable and accepts (collectionId, imageUrl).
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
          0, // Using primary collection (collectionId 0)
          finalImageUrl
        ],
        value: parseEther("0.1")
      })
      toast({
        title: "Mint Success",
        description: "Your NFT has been recorded on-chain! (Placeholder function)."
      })
    } catch (err: any) {
      setMintError(err.message || "Unable to mint NFT")
      toast({
        title: "Mint Failure",
        description: err.message || "Unable to mint NFT",
        variant: "destructive"
      })
    } finally {
      setMinting(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
        <h1 className="mb-4 text-center text-4xl font-extrabold text-primary">Create AI NFT</h1>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        You can generate an AI image or upload your own custom image, then optionally add metadata or a story before minting.
        <br />
        <span className="mt-2 block font-semibold text-foreground">
          Note: A connected wallet is required to complete the mint transaction on-chain.
        </span>
      </p>

      <Card className="border border-border shadow-lg rounded-lg p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Info className="h-5 w-5" />
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

      <Card className="border border-border shadow-lg rounded-lg mt-8 p-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wand className="h-5 w-5" />
            Finalize &amp; Mint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleMint} disabled={minting} className="w-full">
            {minting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Minting...
              </>
            ) : (
              "Mint NFT"
            )}
          </Button>
          {mintError && (
            <p className="mt-2 text-xs text-destructive">{mintError}</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}