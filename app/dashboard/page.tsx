'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { getUserTitle } from "@/lib/experience"
import { Crown, Folder, Gauge, Loader2, PieChart } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useAccount, usePublicClient } from "wagmi"

export default function DashboardPage() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { toast } = useToast()

  const userExperiencePoints = useContract("UserExperiencePoints")
  const nftMintingPlatform = useContract("NFTMintingPlatform")
  const nftMarketplaceHub = useContract("NFTMarketplaceHub")
  const nftStakingPool = useContract("NFTStakingPool")

  const [xp, setXp] = useState<bigint | null>(null)
  const [loadingXp, setLoadingXp] = useState(false)

  const [totalMinted, setTotalMinted] = useState(0)
  const [totalSold, setTotalSold] = useState(0)
  const [totalListed, setTotalListed] = useState(0)
  const [totalStaked, setTotalStaked] = useState(0)

  const [loadingItems, setLoadingItems] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!address || !publicClient) return
    if (!userExperiencePoints?.address || !userExperiencePoints?.abi) return
    if (!nftMintingPlatform?.address || !nftMintingPlatform?.abi) return
    if (!nftMarketplaceHub?.address || !nftMarketplaceHub?.abi) return
    if (!nftStakingPool?.address || !nftStakingPool?.abi) return

    if (loadedRef.current) return
    loadedRef.current = true

    async function fetchAllData() {
      try {
        setLoadingXp(true)
        setLoadingItems(true)

        // 1) read user XP
        const userXp = await publicClient?.readContract({
          address: userExperiencePoints?.address as `0x${string}`,
          abi: userExperiencePoints?.abi,
          functionName: "userExperience",
          args: [address],
        }) as bigint
        setXp(userXp)

        // 2) read total minted from nftMintingPlatform => getLatestMintedId
        const totalItemId = await publicClient?.readContract({
          address: nftMintingPlatform?.address as `0x${string}`,
          abi: nftMintingPlatform?.abi,
          functionName: "getLatestMintedId",
          args: []
        }) as bigint

        const itemCount = Number(totalItemId)
        let mintedCount = 0
        let soldCount = 0
        let listedCount = 0
        let stakedCount = 0

        for (let i = 1; i <= itemCount; i++) {
          const bigI = BigInt(i)
          try {
            // read ownerOf
            const owner = await publicClient?.readContract({
              address: nftMintingPlatform?.address as `0x${string}`,
              abi: nftMintingPlatform?.abi,
              functionName: "ownerOf",
              args: [bigI]
            }) as `0x${string}`

            // read NFT data
            const itemData = await publicClient?.readContract({
              address: nftMintingPlatform?.address as `0x${string}`,
              abi: nftMintingPlatform?.abi,
              functionName: "nftItems",
              args: [bigI]
            }) as [bigint, string, bigint, string] // xpValue, resourceUrl, mintedAt, creator

            const creator = itemData[3]

            // read marketplace data => marketItems(i)
            const marketItem = await publicClient?.readContract({
              address: nftMarketplaceHub?.address as `0x${string}`,
              abi: nftMarketplaceHub?.abi,
              functionName: "marketItems",
              args: [bigI]
            }) as [boolean, bigint]

            const isOnSale = marketItem[0]
            // read stake info
            const stakeData = await publicClient?.readContract({
              address: nftStakingPool?.address as `0x${string}`,
              abi: nftStakingPool?.abi,
              functionName: "stakes",
              args: [bigI]
            }) as [string, bigint, bigint, boolean]

            const staker = stakeData[0]
            const staked = stakeData[3] && staker.toLowerCase() === address?.toLowerCase()

            // minted by user?
            if (creator.toLowerCase() === address?.toLowerCase()) {
              mintedCount++

              // if user minted but doesn't own => check if staked
              if (owner.toLowerCase() !== address.toLowerCase()) {
                if (staked) {
                  // staked by user anyway
                } else {
                  soldCount++
                }
              }
            }

            // if user owns & isOnSale => user listed it
            if (owner.toLowerCase() === address?.toLowerCase() && isOnSale) {
              listedCount++
            }

            // track staked
            if (staked) {
              stakedCount++
            }

          } catch {
            // skip
          }
        }

        setTotalMinted(mintedCount)
        setTotalSold(soldCount)
        setTotalListed(listedCount)
        setTotalStaked(stakedCount)
      } catch (err) {
        console.error("[Dashboard] Error fetching data:", err)
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoadingXp(false)
        setLoadingItems(false)
      }
    }

    fetchAllData()
  }, [
    address,
    publicClient,
    userExperiencePoints,
    nftMintingPlatform,
    nftMarketplaceHub,
    nftStakingPool,
    toast
  ])

  const userTitle = getUserTitle(Number(xp ?? 0))

  if (!address) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-foreground">
        <h1 className="mb-2 text-4xl font-extrabold text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Please connect your wallet to view your dashboard.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-6 md:px-8 bg-background text-foreground">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-extrabold text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your personal control center for AIPenGuild.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* XP Card */}
        <Card className="border border-border shadow-md">
          <CardHeader className="p-4 bg-secondary text-secondary-foreground flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">Experience Points</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            {loadingXp ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading XP...</span>
              </div>
            ) : (
              <span className="text-3xl font-bold">
                {xp !== null ? xp.toString() : "0"}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Title Card */}
        <Card className="border border-border shadow-md">
          <CardHeader className="p-4 bg-secondary text-secondary-foreground flex items-center gap-2">
            <Crown className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">Your Title</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            {loadingXp ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Checking title...</span>
              </div>
            ) : (
              <span className="text-2xl font-bold">
                {userTitle}
              </span>
            )}
          </CardContent>
        </Card>

        {/* NFT Stats Card */}
        <Card className="border border-border shadow-md">
          <CardHeader className="p-4 bg-secondary text-secondary-foreground flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">NFT Stats</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingItems ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading stats...</span>
              </div>
            ) : (
              <div className="space-y-2 text-sm sm:text-base">
                <p>
                  <strong>Minted:</strong> {totalMinted}
                </p>
                <p>
                  <strong>Sold:</strong> {totalSold}
                </p>
                <p>
                  <strong>Listed:</strong> {totalListed}
                </p>
                <p>
                  <strong>Staked:</strong> {totalStaked}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owned NFTs / CTA Card */}
        <Card className="border border-border shadow-md">
          <CardHeader className="p-4 bg-secondary text-secondary-foreground flex items-center gap-2">
            <Folder className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">Owned NFTs</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              View and manage all the NFTs you own.
            </p>
            <Link href="/my-nfts">
              <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                View Owned NFTs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}