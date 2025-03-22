'use client'

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { TransactionButton } from "@/components/ui/TransactionButton"
import { TransactionStatus } from "@/components/ui/TransactionStatus"
import { useNativeCurrencySymbol } from "@/hooks/use-native-currency-symbol"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { useTransactionState } from "@/hooks/use-transaction-state"
import { uploadFileToIpfs, uploadJsonToIpfs } from "@/lib/ipfs"
import { Brain, Loader2, Upload, Wand } from "lucide-react"
import Image from "next/image"
import React, { useState } from "react"
import { parseEther } from "viem"
import { useAccount, useBalance, useChainId, usePublicClient, useWalletClient } from "wagmi"

export default function MintNFTPage() {
  const { toast } = useToast()
  const { address: wagmiAddress } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId() || 1287

  const currencySymbol = useNativeCurrencySymbol()

  const { data: userBalanceData } = useBalance({
    address: wagmiAddress
  })

  const creatorCollection = useContract("NFTCreatorCollection")
  const xpModule = useContract("UserExperiencePoints")

  // Basic states
  const [prompt, setPrompt] = useState("")
  const [category, setCategory] = useState<"Character" | "GameItem" | "Powerup">("Character")
  const [aiNft, setAiNft] = useState<any>(null)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generateImageError, setGenerateImageError] = useState("")
  const [showPromptError, setShowPromptError] = useState(false)

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [payWithXP, setPayWithXP] = useState(false)
  const [useAIImage, setUseAIImage] = useState(true)
  const [debugUploadCustomImage] = useState(process.env.NEXT_PUBLIC_DEBUG_UPLOAD_CUSTOM_IMAGE === 'true')

  // The single unified transaction state
  const mintTx = useTransactionState()

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
      setAiNft(data.metadata)
      toast({
        title: "AI Generation Complete",
        description: "AI-generated image & attributes ready."
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

  async function handleMint() {
    if (!wagmiAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet before minting.",
        variant: "destructive"
      })
      return
    }
    if (!creatorCollection || !creatorCollection.address || !creatorCollection.abi) {
      toast({
        title: "No Contract Found",
        description: "NFTCreatorCollection contract not found. Check your chain or config.",
        variant: "destructive"
      })
      return
    }

    // Start the transaction
    mintTx.start()

    try {
      // Additional checks
      if (payWithXP) {
        if (!publicClient) {
          throw new Error("No public client found. Please connect your wallet.")
        }
        const xpVal = await publicClient.readContract({
          address: xpModule?.address as `0x${string}`,
          abi: xpModule?.abi,
          functionName: "userExperience",
          args: [wagmiAddress]
        }) as bigint
        if (xpVal < 100n) {
          throw new Error(`Insufficient XP. You have ${xpVal.toString()} XP, need 100.`)
        }
      } else {
        if (userBalanceData?.value) {
          if (userBalanceData.value < parseEther("0.1")) {
            throw new Error(`Insufficient balance. You only have ${userBalanceData.formatted} ${userBalanceData.symbol}`)
          }
        }
      }

      // Upload to IPFS
      let finalMetadataUrl = ""
      if (useAIImage) {
        if (!aiNft?.image) {
          throw new Error("No AI metadata found. Please generate an image first.")
        }
        const imageData = await fetch(aiNft.image)
        if (!imageData.ok) throw new Error("Failed to fetch AI image for re-upload")
        const blob = await imageData.blob()
        const file = new File([blob], "ai_nft.png", { type: blob.type })
        const imageIpfsUrl = await uploadFileToIpfs(file)

        const finalMetadata = {
          name: aiNft.name || "Untitled NFT",
          image: imageIpfsUrl,
          attributes: aiNft.attributes || {}
        }
        finalMetadataUrl = await uploadJsonToIpfs(finalMetadata)
      } else {
        if (!debugUploadCustomImage) {
          throw new Error("Custom image uploads are disabled in this production build.")
        }
        if (!uploadedFile) {
          throw new Error("No manual upload found. Please upload an image.")
        }
        const imageIpfsUrl = await uploadFileToIpfs(uploadedFile)
        const randomAttrs = {
          power: Math.floor(Math.random() * 100) + 1,
          durability: Math.floor(Math.random() * 100) + 1,
          rarity: "Random"
        }
        const finalMetadata = {
          name: prompt || "Untitled NFT",
          image: imageIpfsUrl,
          attributes: randomAttrs
        }
        finalMetadataUrl = await uploadJsonToIpfs(finalMetadata)
      }

      // Prepare writing to contract
      const mintValue = payWithXP ? undefined : parseEther("0.1")

      if (!walletClient) {
        throw new Error("No wallet client found. Please connect your wallet.")
      }

      // Send the transaction
      const hash = await walletClient.writeContract({
        address: creatorCollection.address as `0x${string}`,
        abi: creatorCollection.abi,
        functionName: "mintFromCollection",
        args: [0, finalMetadataUrl, payWithXP],
        value: mintValue
      })

      toast({
        title: "Transaction Sent",
        description: `Tx Hash: ${hash}`
      })

      // Wait for transaction receipt
      mintTx.start(hash)
      const receipt = await publicClient?.waitForTransactionReceipt({ hash })
      if (receipt?.status === "reverted") {
        mintTx.fail("Transaction reverted on-chain.")
        throw new Error("Transaction reverted on-chain.")
      }

      mintTx.success(hash)
      toast({
        title: "Transaction Confirmed",
        description: "NFT minted successfully!"
      })
    } catch (err: any) {
      mintTx.fail(err.message || "Minting failed.")
      toast({
        title: "Mint Failure",
        description: err.message || "Unable to mint NFT",
        variant: "destructive"
      })
    }
  }

  function getMintButtonLabel() {
    if (mintTx.isProcessing) return "Processing..."
    if (mintTx.isSuccess) return "Mint Again"
    if (mintTx.error) return "Retry Mint"
    return "Mint NFT"
  }

  if (!wagmiAddress) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center p-8 bg-background text-foreground">
        <h1 className="mb-2 text-4xl font-extrabold text-primary">Create AI NFT</h1>
        <p className="text-sm text-muted-foreground">Please connect your wallet to proceed.</p>
      </main>
    )
  }

  return (
    <main className="w-full min-h-screen bg-background text-foreground flex justify-center px-4 py-12 sm:px=6 md:px=8">
      <div className="max-w-5xl w-full">
        <h1 className="mb-4 text-center text-4xl font-extrabold text-primary">Create AI NFT</h1>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Generate or upload your NFT image. Choose whether to pay 100 XP or 0.1 {currencySymbol}.
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
              <div className="mb-2 text-sm font-medium text-muted-foreground">Choose how to get your NFT image</div>
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
                {debugUploadCustomImage && (
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
                )}
              </div>
            </div>

            {useAIImage && (
              <div className="rounded-md bg-secondary p-4">
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Enter an AI Prompt
                </label>
                <Input
                  placeholder="e.g. Vibrant cyberpunk samurai with neon aesthetic"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <div className="mt-2">
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">Category</label>
                  <select
                    className="border border-input bg-background p-2 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as "Character" | "GameItem" | "Powerup")}
                  >
                    <option value="Character">Character</option>
                    <option value="GameItem">Game Item</option>
                    <option value="Powerup">Powerup</option>
                  </select>
                </div>
                {showPromptError && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Please enter a prompt.
                  </p>
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
                  <div className="mt-2 rounded-md border-l-4 border-red-500 bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-100 whitespace-pre-wrap break-words">
                    <strong>Error:</strong> {generateImageError}
                  </div>
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

            {!useAIImage && debugUploadCustomImage && (
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
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="payWithXP"
                  checked={payWithXP}
                  onChange={() => setPayWithXP(true)}
                />
                <label htmlFor="payWithXP" className="text-sm">
                  Pay with 100 XP
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="payWithNative"
                  checked={!payWithXP}
                  onChange={() => setPayWithXP(false)}
                />
                <label htmlFor="payWithNative" className="text-sm">
                  Pay 0.1 {currencySymbol}
                </label>
              </div>
            </div>
            <div className="mt-4">
              <TransactionButton
                isLoading={mintTx.isProcessing}
                loadingText="Processing..."
                onClick={handleMint}
                className="w-full flex items-center justify-center gap-2"
              >
                {getMintButtonLabel()}
              </TransactionButton>
            </div>
            {mintTx.error && (
              <div className="mt-2 rounded-md border-l-4 border-red-500 bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-100 whitespace-pre-wrap break-words">
                <strong>Error:</strong> {mintTx.error}
              </div>
            )}

            <TransactionStatus
              isLoading={mintTx.isProcessing}
              isSuccess={mintTx.isSuccess}
              errorMessage={mintTx.error || undefined}
              txHash={mintTx.txHash || undefined}
              chainId={chainId}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}