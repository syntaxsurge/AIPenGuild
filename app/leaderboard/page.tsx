'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DualRangeSlider } from "@/components/ui/dual-range-slider"
import { Input } from "@/components/ui/input"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { getUserTitle } from "@/lib/experience"
import { Loader2 } from "lucide-react"
import React, { useEffect, useState } from "react"
import { usePublicClient } from "wagmi"

/**
 * We'll gather addresses by scanning all minted items from the NFTMarketplaceHub,
 * also checking stakers from NFTStakingPool so that staked NFTs are counted.
 * Then read userExperience(address) from UserExperiencePoints, store them in a map,
 * and show the top 10 addresses with the highest XP.
 * We also allow:
 *  - Address search
 *  - XP Range filter
 */

interface LeaderboardEntry {
  address: string
  xp: bigint
}

export default function LeaderboardPage() {
  const { toast } = useToast()
  const userExperiencePoints = useContract("UserExperiencePoints")
  const nftMarketplaceHub = useContract("NFTMarketplaceHub")
  const nftStakingPool = useContract("NFTStakingPool")
  const publicClient = usePublicClient()

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [fetched, setFetched] = useState(false)
  const [loading, setLoading] = useState(false)

  // Filter states
  const [addressSearch, setAddressSearch] = useState("")
  const [xpRange, setXpRange] = useState<[number, number]>([0, 500]) // sample default range

  // We'll track minted item owners up to getLatestItemId(), store them in a set (including stakers),
  // then query XP from UserExperience.
  async function loadLeaderboard() {
    if (!userExperiencePoints || !nftMarketplaceHub || !nftStakingPool || !publicClient) return
    try {
      setLoading(true)
      const itemCount = await publicClient.readContract({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: nftMarketplaceHub.abi,
        functionName: "getLatestItemId",
        args: []
      })
      if (typeof itemCount !== "bigint") return

      const ownersSet = new Set<string>()

      for (let i = 1n; i <= itemCount; i++) {
        // 1) Try to get the "ownerOf" from the MarketplaceHub
        try {
          const owner = await publicClient.readContract({
            address: nftMarketplaceHub.address as `0x${string}`,
            abi: nftMarketplaceHub.abi,
            functionName: "ownerOf",
            args: [i]
          }) as `0x${string}`
          ownersSet.add(owner.toLowerCase())
        } catch {
          // skip any error
        }

        // 2) Also check the staking info from NFTStakingPool, in case it's staked
        // If staked, the actual "ownerOf" might be the pool's contract, not the user.
        try {
          const [staker, , , staked] = await publicClient.readContract({
            address: nftStakingPool.address as `0x${string}`,
            abi: nftStakingPool.abi,
            functionName: "stakes",
            args: [i]
          }) as [string, bigint, bigint, boolean]

          // If staked is true and staker isn't the zero address, add them
          if (staked && staker && staker !== "0x0000000000000000000000000000000000000000") {
            ownersSet.add(staker.toLowerCase())
          }
        } catch {
          // skip any error
        }
      }

      // Now we have all addresses. For each, read userExperience from UserExperiencePoints
      const results: LeaderboardEntry[] = []
      for (const addr of ownersSet) {
        try {
          const xpVal = await publicClient.readContract({
            address: userExperiencePoints.address as `0x${string}`,
            abi: userExperiencePoints.abi,
            functionName: "userExperience",
            args: [addr]
          })
          if (typeof xpVal === "bigint") {
            results.push({ address: addr, xp: xpVal })
          }
        } catch {
          // skip
        }
      }

      // Sort descending by XP
      results.sort((a, b) => Number(b.xp - a.xp))
      setLeaderboard(results)
    } catch (err: any) {
      toast({
        title: "Error loading leaderboard",
        description: err.message || "Something went wrong loading XP leaderboard",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!fetched) {
      setFetched(true)
      loadLeaderboard()
    }
  }, [fetched, loadLeaderboard])

  // Filter the sorted leaderboard, then show top 10
  const filteredLeaderboard = React.useMemo(() => {
    const minXP = BigInt(xpRange[0])
    const maxXP = BigInt(xpRange[1])
    return leaderboard.filter((entry) => {
      if (entry.xp < minXP || entry.xp > maxXP) return false
      if (addressSearch) {
        if (!entry.address.toLowerCase().includes(addressSearch.toLowerCase())) {
          return false
        }
      }
      return true
    }).slice(0, 10)
  }, [leaderboard, xpRange, addressSearch])

  return (
    <main className="mx-auto max-w-4xl min-h-screen px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <h1 className="mb-6 text-center text-4xl font-extrabold text-primary">XP Leaderboard</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        See the top XP holders on AIPenGuild. Addresses with high XP gain title.
      </p>

      {/* Filters */}
      <Card className="mb-6 border border-border rounded-lg shadow bg-background">
        <CardHeader className="p-4 bg-secondary text-secondary-foreground rounded-t-lg">
          <CardTitle className="text-lg font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Search by Address</label>
              <Input
                placeholder="0x..."
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">XP Range</label>
              <DualRangeSlider
                min={0}
                max={10000}
                step={10}
                value={xpRange}
                onValueChange={(val) => setXpRange([val[0], val[1]])}
              />
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{xpRange[0]} XP</span>
                <span>{xpRange[1]} XP</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      <Card className="border border-border rounded-lg shadow bg-background">
        <CardHeader className="p-4 bg-accent text-accent-foreground rounded-t-lg">
          <CardTitle className="text-lg font-semibold">Top 10 XP Holders</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading leaderboard data...</span>
            </div>
          ) : filteredLeaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">No addresses found for the given filters.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2">Rank</th>
                  <th>Address</th>
                  <th>XP</th>
                  <th>Title</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((entry, index) => (
                  <tr key={entry.address} className="border-b border-border last:border-none">
                    <td className="py-2">{index + 1}</td>
                    <td>{entry.address.slice(0, 6)}...{entry.address.slice(-4)}</td>
                    <td>{entry.xp.toString()} XP</td>
                    <td>
                      {(() => {
                        const numericXp = Number(entry.xp)
                        const userTitle = getUserTitle(numericXp)
                        let colorClass = "text-muted-foreground"

                        if (numericXp >= 5000) colorClass = "text-green-600"
                        else if (numericXp >= 3000) colorClass = "text-blue-600"
                        else if (numericXp >= 1000) colorClass = "text-purple-600"
                        else if (numericXp >= 200) colorClass = "text-yellow-600"

                        return <span className={colorClass}>{userTitle}</span>
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}