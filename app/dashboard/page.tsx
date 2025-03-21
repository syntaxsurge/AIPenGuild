'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { getUserTitle } from "@/lib/experience"
import { fetchAllNFTs, NFTItem } from "@/lib/nft-data"
import { Crown, Folder, Gauge, Loader2, PieChart } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useAccount, usePublicClient } from "wagmi"

/**
 * We'll also fetch user XP from the userExperiencePoints contract
 * for the connected user.
 */
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

  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  const [totalMinted, setTotalMinted] = useState<number>(0)
  const [totalSold, setTotalSold] = useState<number>(0)
  const [totalListed, setTotalListed] = useState<number>(0)
  const [totalStaked, setTotalStaked] = useState<number>(0)

  const [loaded, setLoaded] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    // Ensure all required values are defined.
    if (
      !address ||
      !publicClient ||
      !userExperiencePoints ||
      !userExperiencePoints.address ||
      !userExperiencePoints.abi ||
      !nftMintingPlatform ||
      !nftMintingPlatform.address ||
      !nftMintingPlatform.abi ||
      !nftMarketplaceHub ||
      !nftMarketplaceHub.address ||
      !nftMarketplaceHub.abi ||
      !nftStakingPool ||
      !nftStakingPool.address ||
      !nftStakingPool.abi
    ) {
      return
    }

    // Prevent re-loading if already loaded.
    if (loadedRef.current) return
    loadedRef.current = true

    // Create local constants to satisfy TS narrowing.
    const _address = address
    const _publicClient = publicClient
    const _userExperiencePoints = userExperiencePoints
    const _nftMintingPlatform = nftMintingPlatform
    const _nftMarketplaceHub = nftMarketplaceHub
    const _nftStakingPool = nftStakingPool

    async function fetchAll() {
      try {
        setLoadingXp(true)
        setLoadingItems(true)

        // 1) Read user XP from the smart contract.
        const userXp = await _publicClient.readContract({
          address: _userExperiencePoints.address as `0x${string}`,
          abi: _userExperiencePoints.abi,
          functionName: "userExperience",
          args: [_address],
        }) as bigint
        setXp(userXp)

        // 2) Load all minted NFTs.
        const all = await fetchAllNFTs(_publicClient, _nftMintingPlatform, _nftMarketplaceHub, _nftStakingPool)
        setNfts(all)

        // Filter and count NFTs related to the user.
        let mintedCount = 0
        let soldCount = 0
        let listedCount = 0
        let stakedCount = 0

        for (const item of all) {
          const isUserCreator = item.creator.toLowerCase() === _address.toLowerCase()
          if (isUserCreator) {
            mintedCount++
            // If the item is not owned by the user, consider it sold.
            if (item.owner.toLowerCase() !== _address.toLowerCase()) {
              soldCount++
            }
          }
          // Count NFTs that the user owns and that are on sale.
          if (item.owner.toLowerCase() === _address.toLowerCase() && item.isOnSale) {
            listedCount++
          }
          // Count staked NFTs by the user.
          if (
            item.stakeInfo?.staked &&
            item.stakeInfo.staker.toLowerCase() === _address.toLowerCase()
          ) {
            stakedCount++
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
          variant: "destructive",
        })
      } finally {
        setLoadingXp(false)
        setLoadingItems(false)
        setLoaded(true)
      }
    }

    fetchAll()
  }, [
    address,
    publicClient,
    userExperiencePoints,
    nftMintingPlatform,
    nftMarketplaceHub,
    nftStakingPool,
    toast,
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
              <span className="text-2xl font-bold">{userTitle}</span>
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
                  <strong>Minted by You:</strong> {totalMinted}
                </p>
                <p>
                  <strong>Sold by You:</strong> {totalSold}
                </p>
                <p>
                  <strong>Listed by You:</strong> {totalListed}
                </p>
                <p>
                  <strong>Staked by You:</strong> {totalStaked}
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
              <Button
                variant="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                View Owned NFTs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}