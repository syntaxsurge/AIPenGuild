'use client'

import React, { useEffect, useState } from "react"
import { useAccount, usePublicClient } from "wagmi"
import { useContract } from "@/hooks/use-contract"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { address: wagmiAddress } = useAccount()
  const publicClient = usePublicClient()
  const aiExperience = useContract("AIExperience")
  const [xp, setXp] = useState<bigint>(0n)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function loadXP() {
    if (!aiExperience || !wagmiAddress || !publicClient) return
    try {
      setLoading(true)
      const val = await publicClient.readContract({
        address: aiExperience.address as `0x${string}`,
        abi: aiExperience.abi,
        functionName: "userExperience",
        args: [wagmiAddress.toLowerCase()]
      })
      if (typeof val === "bigint") {
        setXp(val)
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load your XP.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadXP()
  }, [wagmiAddress, aiExperience])

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <h1 className="mb-4 text-center text-3xl font-extrabold text-primary">My XP Dashboard</h1>
      {!wagmiAddress ? (
        <p className="text-center text-sm text-muted-foreground">
          Please connect your wallet to view your XP.
        </p>
      ) : (
        <Card className="mt-6 border border-border rounded-lg shadow-xl bg-background">
          <CardHeader className="p-4 bg-secondary text-secondary-foreground rounded-t-lg">
            <CardTitle className="text-lg font-semibold">Your Experience Points</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm mb-2 text-muted-foreground">
              Keep minting, trading, and engaging with AIPenGuild to earn more XP and achieve new tiers!
            </p>
            <div className="flex items-center gap-2 text-xl font-bold text-primary">
              {loading ? "Loading..." : `${xp.toString()} XP`}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}