'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DualRangeSlider } from "@/components/ui/dual-range-slider"
import { Input } from "@/components/ui/input"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { getUserTitle } from "@/lib/experience"
import { Loader2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { usePublicClient } from "wagmi"

interface LeaderboardEntry {
  address: string
  xp: bigint
}

export default function LeaderboardPage() {
  const { toast } = useToast()
  const userExperiencePoints = useContract("UserExperiencePoints")
  const nftMintingPlatform = useContract("NFTMintingPlatform")
  const nftStakingPool = useContract("NFTStakingPool")

  // The primary state for storing the fetched data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  // Display a spinner or table
  const [loading, setLoading] = useState(true)

  // Filter states
  const [addressSearch, setAddressSearch] = useState("")
  const [xpRange, setXpRange] = useState<[number, number]>([0, 1000000])

  const publicClient = usePublicClient()
  const loadedRef = useRef(false)

  // fetch function
  async function loadLeaderboard() {
    if (!nftMintingPlatform?.address || !nftMintingPlatform?.abi) return
    if (!nftStakingPool?.address || !nftStakingPool?.abi) return
    if (!userExperiencePoints?.address || !userExperiencePoints?.abi) return
    if (!publicClient) return

    setLoading(true)
    try {
      // read total minted from NFTMintingPlatform
      const totalItems = await publicClient.readContract({
        address: nftMintingPlatform.address as `0x${string}`,
        abi: nftMintingPlatform.abi,
        functionName: "getLatestMintedId",
        args: []
      }) as bigint

      if (!totalItems || totalItems < 1n) {
        setLeaderboard([])
        setLoading(false)
        return
      }

      const calls = []
      // For each token, we want to read ownerOf and also read stake info
      for (let i = 1n; i <= totalItems; i++) {
        // 1) ownerOf
        calls.push({
          address: nftMintingPlatform.address as `0x${string}`,
          abi: nftMintingPlatform.abi,
          functionName: "ownerOf",
          args: [i]
        })
        // 2) stakes(i)
        calls.push({
          address: nftStakingPool.address as `0x${string}`,
          abi: nftStakingPool.abi,
          functionName: "stakes",
          args: [i]
        })
      }

      const multicallRes = await publicClient.multicall({
        contracts: calls,
        allowFailure: true
      })

      const ownersSet = new Set<string>()
      let index = 0
      for (let i = 1n; i <= totalItems; i++) {
        const ownerCall = multicallRes[index]
        const stakeCall = multicallRes[index + 1]
        index += 2

        if (ownerCall?.result) {
          const ownerAddr = ownerCall.result as `0x${string}`
          ownersSet.add(ownerAddr.toLowerCase())
        }
        if (stakeCall?.result) {
          const [stakerAddr, , , staked] = stakeCall.result as [string, bigint, bigint, boolean]
          if (staked && stakerAddr !== "0x0000000000000000000000000000000000000000") {
            ownersSet.add(stakerAddr.toLowerCase())
          }
        }
      }

      // For each unique address, read userExperience
      const resultEntries: LeaderboardEntry[] = []
      for (const addr of ownersSet) {
        try {
          const xpVal = await publicClient.readContract({
            address: userExperiencePoints.address as `0x${string}`,
            abi: userExperiencePoints.abi,
            functionName: "userExperience",
            args: [addr]
          }) as bigint

          resultEntries.push({ address: addr, xp: xpVal })
        } catch {
          // skip
        }
      }

      // sort descending
      resultEntries.sort((a, b) => Number(b.xp - a.xp))
      setLeaderboard(resultEntries)
    } catch (err: any) {
      console.error("[loadLeaderboard] error:", err)
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
    if (!loadedRef.current) {
      loadedRef.current = true
      loadLeaderboard()
    }
  }, [loadLeaderboard])

  // filter
  const filteredLeaderboard = useMemo(() => {
    const minVal = Math.min(xpRange[0], xpRange[1])
    const maxVal = Math.max(xpRange[0], xpRange[1])
    const minXP = BigInt(minVal)
    const maxXP = BigInt(maxVal)

    return leaderboard
      .filter((entry) => {
        if (entry.xp < minXP || entry.xp > maxXP) return false
        if (addressSearch) {
          if (!entry.address.includes(addressSearch.toLowerCase())) {
            return false
          }
        }
        return true
      })
      .slice(0, 10)
  }, [leaderboard, xpRange, addressSearch])

  return (
    <main className="w-full min-h-screen bg-white dark:bg-gray-900 text-foreground flex justify-center px-4 py-12 sm:px-6 md:px-8">
      <div className="max-w-5xl w-full">
        <h1 className="mb-6 text-center text-4xl font-extrabold text-primary">XP Leaderboard</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Explore the top XP holders on AIPenGuild. Addresses with high XP earn special titles.
        </p>

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
                  max={10000000}
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
              <p className="text-sm text-muted-foreground">
                No addresses found for the given filters.
              </p>
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
                      <td>
                        {entry.address.slice(0, 6)}...
                        {entry.address.slice(-4)}
                      </td>
                      <td>{entry.xp.toString()} XP</td>
                      <td>
                        {(() => {
                          const numericXp = Number(entry.xp)
                          const userTitle = getUserTitle(numericXp)
                          let colorClass = "text-muted-foreground"

                          if (numericXp >= 5000) {
                            colorClass = "text-green-600"
                          } else if (numericXp >= 3000) {
                            colorClass = "text-blue-600"
                          } else if (numericXp >= 1000) {
                            colorClass = "text-purple-600"
                          } else if (numericXp >= 200) {
                            colorClass = "text-yellow-600"
                          }

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
      </div>
    </main>
  )
}