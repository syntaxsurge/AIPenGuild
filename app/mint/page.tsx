'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useNativeCurrencySymbol } from "@/hooks/use-native-currency-symbol"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { Brain, Loader2, Upload, Wand } from "lucide-react"
import Image from "next/image"
import React, { useState } from "react"
import { parseEther } from "viem"
import { useAccount, useBalance, usePublicClient, useWalletClient } from "wagmi"

/**
 * Uploads a file to IPFS via Unique Network's endpoint.
 */
async function uploadFileToIpfs(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("files", file)
  const res = await fetch("https://rest.unique.network/opal/v1/ipfs/upload-files", {
    method: "POST",
    body: formData
  })
  if (!res.ok) throw new Error("Failed to upload file to IPFS")
  const data = await res.json()
  return data.fullUrl
}

/**
 * Uploads JSON data to IPFS.
 */
async function uploadJsonToIpfs(jsonData: any): Promise<string> {
  const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' })
  const file = new File([blob], "metadata.json", { type: "application/json" })
  const formData = new FormData()
  formData.append("files", file)
  const res = await fetch("https://rest.unique.network/opal/v1/ipfs/upload-files", {
    method: "POST",
    body: formData
  })
  if (!res.ok) throw new Error("Failed to upload JSON to IPFS")
  const data = await res.json()
  return data.fullUrl
}

function createRandomAttributes() {
  const randomBetween = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"]
  const randomRarity = rarities[randomBetween(0, rarities.length - 1)]

  return {
    power: randomBetween(1, 100),
    durability: randomBetween(1, 100),
    rarity: randomRarity
  }
}

/**
 * We'll read the XP from the UserExperiencePoints contract if paying with XP.
 */
async function fetchUserXP(
  publicClient: ReturnType<typeof usePublicClient>,
  xpModule: `0x${string}`,
  user: `0x${string}`
) {
  // minimal ABI to read userExperience
  const xpABI = [
    {
      "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
      "name": "userExperience",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    }
  ]

  const xpVal = await publicClient?.readContract({
    address: xpModule,
    abi: xpABI,
    functionName: "userExperience",
    args: [user]
  }) as bigint
  return xpVal
}

type MintStage =
  | 'idle'
  | 'checkingPrereqs'
  | 'uploadingImage'
  | 'sendingTx'
  | 'waitingForTx'
  | 'success'
  | 'failed'

export default function MintNFTPage() {
  const { toast } = useToast()
  const { address: wagmiAddress } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const currencySymbol = useNativeCurrencySymbol()

  // Wagmi's useBalance for native currency checks
  const { data: userBalanceData } = useBalance({
    address: wagmiAddress
  })

  // The NFTCreatorCollection contract from our config
  const creatorCollection = useContract("NFTCreatorCollection")

  // We'll fetch the XP module address dynamically via useContract
  const xpModule = useContract("UserExperiencePoints")

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
  const [mintError, setMintError] = useState("")
  const [mintStage, setMintStage] = useState<MintStage>('idle')
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

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

      setMintError("")
      setMintStage('checkingPrereqs')

      // 1) If paying with XP => ensure user has at least 100 XP
      if (payWithXP) {
        if (!publicClient) {
          throw new Error("No public client found. Please connect your wallet.")
        }
        const userXP = await fetchUserXP(publicClient, xpModule?.address as `0x${string}`, wagmiAddress as `0x${string}`)
        if (userXP < 100n) {
          throw new Error(`Insufficient XP. You have ${userXP.toString()} XP, need 100.`)
        }
      } else {
        // paying with 0.05 native
        if (userBalanceData?.value) {
          if (userBalanceData.value < parseEther("0.05")) {
            throw new Error(`Insufficient balance. You only have ${userBalanceData.formatted} ${userBalanceData.symbol}`)
          }
        }
      }

      // 2) upload to IPFS
      setMintStage('uploadingImage')
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
          ...aiNft,
          image: imageIpfsUrl
        }
        finalMetadataUrl = await uploadJsonToIpfs(finalMetadata)
      } else {
        if (!uploadedFile) {
          throw new Error("No manual upload found. Please upload an image.")
        }
        const imageIpfsUrl = await uploadFileToIpfs(uploadedFile)
        const randomAttrs = createRandomAttributes()
        const finalMetadata = {
          name: prompt || "Untitled NFT",
          image: imageIpfsUrl,
          attributes: randomAttrs
        }
        finalMetadataUrl = await uploadJsonToIpfs(finalMetadata)
      }

      // 3) send transaction
      setMintStage('sendingTx')
      const mintValue = payWithXP ? undefined : parseEther("0.05")

      if (!walletClient) {
        throw new Error("No wallet client found. Please connect your wallet.")
      }

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

      setTxHash(hash)
      setMintStage('waitingForTx')

      const receipt = await publicClient?.waitForTransactionReceipt({ hash })
      if (receipt?.status === "reverted") {
        setMintStage('failed')
        throw new Error("Transaction reverted on-chain.")
      }

      setMintStage('success')
      toast({
        title: "Transaction Confirmed",
        description: "NFT minted successfully!"
      })

    } catch (err: any) {
      setMintStage('failed')
      setMintError(err.message || "Minting failed.")
      toast({
        title: "Mint Failure",
        description: err.message || "Unable to mint NFT",
        variant: "destructive"
      })
    }
  }

  function getMintButtonLabel() {
    switch (mintStage) {
      case 'checkingPrereqs':
        return "Checking Requirements..."
      case 'uploadingImage':
        return "Uploading to IPFS..."
      case 'sendingTx':
        return "Sending Transaction..."
      case 'waitingForTx':
        return "Awaiting Confirmation..."
      case 'success':
        return "Mint Again"
      case 'failed':
        return "Retry Mint"
      default:
        return "Mint NFT"
    }
  }

  const isMinting = (
    mintStage === 'checkingPrereqs' ||
    mintStage === 'uploadingImage' ||
    mintStage === 'sendingTx' ||
    mintStage === 'waitingForTx'
  )

  if (!wagmiAddress) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center p-8 bg-background text-foreground">
        <h1 className="mb-2 text-4xl font-extrabold text-primary">Create AI NFT</h1>
        <p className="text-sm text-muted-foreground">Please connect your wallet to proceed.</p>
      </main>
    )
  }

  return (
    <main className="w-full min-h-screen bg-background text-foreground flex justify-center px-4 py-12 sm:px-6 md:px-8">
      <div className="max-w-5xl w-full">
        <h1 className="mb-4 text-center text-4xl font-extrabold text-primary">Create AI NFT</h1>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Generate or upload your NFT image. Choose whether to pay 100 XP or 0.05 {currencySymbol}. <br />
          This version checks your XP or native balance first and provides more helpful error messages.
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
                  Pay 0.05 {currencySymbol}
                </label>
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleMint}
                disabled={isMinting}
                className="w-full flex items-center justify-center gap-2"
              >
                {isMinting && <Loader2 className="h-4 w-4 animate-spin" />}
                {getMintButtonLabel()}
              </Button>
            </div>
            {mintError && (
              <div className="mt-2 rounded-md border-l-4 border-red-500 bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-100 whitespace-pre-wrap break-words">
                <strong>Error:</strong> {mintError}
              </div>
            )}
            {txHash && (
              <div className="rounded-md border border-border p-4 mt-2 text-sm">
                <p className="font-bold">Transaction Hash:</p>
                <a
                  href={`https://moonbase.moonscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-primary"
                >
                  {txHash}
                </a>
                {mintStage === 'waitingForTx' && (
                  <p className="mt-1 text-sm text-muted-foreground">Waiting for confirmation...</p>
                )}
                {mintStage === 'success' && (
                  <p className="mt-1 text-sm text-green-600 font-bold">Confirmed!</p>
                )}
                {mintStage === 'failed' && (
                  <p className="mt-1 text-sm text-red-500 font-bold">Transaction reverted / failed.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}