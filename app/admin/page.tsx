'use client'

import React, { useEffect, useState } from "react"
import { useAccount, usePublicClient, useWaitForTransactionReceipt } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useContract } from "@/hooks/use-contract"
import { useWriteContract } from "wagmi"
import { parseEther } from "viem"

export default function AdminPage() {
  const { address: wagmiAddress, isDisconnected } = useAccount()
  const publicClient = usePublicClient()
  const aiRewardPool = useContract("AIRewardPool")
  const { toast } = useToast()

  const [isOwner, setIsOwner] = useState(false)
  const [ownerLoading, setOwnerLoading] = useState(true)

  // We'll store the pool balance
  const [poolBalance, setPoolBalance] = useState<bigint>(0n)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [reloadBalance, setReloadBalance] = useState(false)

  // For withdrawing from reward pool
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const {
    data: withdrawData,
    error: withdrawError,
    isPending: isWithdrawPending,
    writeContract: writeWithdrawContract
  } = useWriteContract()

  const {
    data: withdrawReceipt,
    isLoading: isWithdrawTxLoading,
    isSuccess: isWithdrawTxSuccess,
    isError: isWithdrawTxError,
    error: withdrawTxError
  } = useWaitForTransactionReceipt({
    hash: withdrawData ?? undefined
  })

  // Check if user is AIRewardPool's owner
  useEffect(() => {
    async function checkOwner() {
      if (!aiRewardPool?.address || !aiRewardPool?.abi || !publicClient || !wagmiAddress) {
        setIsOwner(false)
        setOwnerLoading(false)
        return
      }
      try {
        const contractOwner = await publicClient.readContract({
          address: aiRewardPool.address as `0x${string}`,
          abi: aiRewardPool.abi,
          functionName: "owner",
          args: []
        }) as `0x${string}`
        if (contractOwner.toLowerCase() === wagmiAddress.toLowerCase()) {
          setIsOwner(true)
        } else {
          setIsOwner(false)
        }
      } catch (err: any) {
        console.error("Owner check error:", err)
        setIsOwner(false)
      }
      setOwnerLoading(false)
    }
    checkOwner()
  }, [aiRewardPool, publicClient, wagmiAddress])

  // Load reward pool balance
  async function loadBalance() {
    if (!aiRewardPool?.address || !aiRewardPool?.abi || !publicClient) return
    try {
      setLoadingBalance(true)
      const val = await publicClient.readContract({
        address: aiRewardPool.address as `0x${string}`,
        abi: aiRewardPool.abi,
        functionName: "getPoolBalance",
        args: []
      })
      if (typeof val === "bigint") {
        setPoolBalance(val)
      }
    } catch (err: any) {
      console.error("Error loading pool balance:", err)
      toast({
        title: "Error",
        description: err.message || "Cannot load reward pool balance.",
        variant: "destructive"
      })
    } finally {
      setLoadingBalance(false)
    }
  }

  useEffect(() => {
    loadBalance()
  }, [reloadBalance, aiRewardPool])

  // Handle withdraw transaction
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiRewardPool?.address || !aiRewardPool?.abi) {
      toast({
        title: "Error",
        description: "Unable to find AIRewardPool contract or ABI.",
        variant: "destructive"
      })
      return
    }
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive numeric amount of ETH to withdraw.",
        variant: "destructive"
      })
      return
    }
    const weiAmount = parseEther(withdrawAmount)

    const withdrawABI = {
      name: "withdrawPoolFunds",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "amount", type: "uint256" }
      ],
      outputs: []
    }

    try {
      await writeWithdrawContract({
        address: aiRewardPool.address as `0x${string}`,
        abi: [withdrawABI],
        functionName: "withdrawPoolFunds",
        args: [weiAmount]
      })
      toast({
        title: "Transaction Submitted",
        description: `Withdrawing ${withdrawAmount} ETH from reward pool...`
      })
    } catch (err: any) {
      toast({
        title: "Withdraw Error",
        description: err.message || "Transaction submission failed",
        variant: "destructive"
      })
    }
  }

  // Watch events for withdraw transaction
  useEffect(() => {
    if (isWithdrawTxLoading) {
      toast({
        title: "Transaction Pending",
        description: "Your withdrawal transaction is being confirmed..."
      })
    }
    if (isWithdrawTxSuccess) {
      toast({
        title: "Withdrawal Successful",
        description: "Funds withdrawn from reward pool"
      })
      setWithdrawAmount("")
      setReloadBalance(!reloadBalance)
    }
    if (isWithdrawTxError) {
      toast({
        title: "Transaction Failed",
        description: withdrawTxError?.message || withdrawError?.message || "Something went wrong",
        variant: "destructive"
      })
    }
  }, [
    isWithdrawTxLoading,
    isWithdrawTxSuccess,
    isWithdrawTxError,
    withdrawError,
    withdrawTxError,
    toast,
    reloadBalance
  ])

  if (isDisconnected) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
        <h1 className="text-center text-4xl font-extrabold text-primary mb-6">Admin Panel</h1>
        <p className="text-center text-sm text-muted-foreground">Please connect your wallet.</p>
      </main>
    )
  }

  if (ownerLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
        <h1 className="text-center text-4xl font-extrabold text-primary mb-6">Admin Panel</h1>
        <p className="text-center text-sm text-muted-foreground">Checking ownership...</p>
      </main>
    )
  }

  if (!isOwner) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
        <h1 className="text-center text-4xl font-extrabold text-primary mb-6">403 Access Denied</h1>
        <p className="text-center text-sm text-destructive">
          You do not have permission to view this page. Only the contract owner can access the Admin Panel.
        </p>
      </main>
    )
  }

  // If user is indeed the contract owner
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <h1 className="text-4xl font-extrabold text-primary text-center mb-8">Admin Panel</h1>
      <Card className="border border-border rounded-lg shadow-xl bg-background">
        <CardHeader className="p-4 bg-secondary text-secondary-foreground rounded-t-lg">
          <CardTitle className="text-lg font-semibold">Reward Pool Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Pool Balance:</p>
            <div className="text-lg font-bold text-primary">
              {loadingBalance ? "Loading..." : `${(Number(poolBalance) / 1e18).toFixed(4)} ETH`}
            </div>
          </div>

          <hr className="border-border" />

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Withdraw funds from the reward pool (owner only).
            </p>
            <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row sm:items-end gap-2">
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">Amount in ETH</label>
                <Input
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.5"
                />
              </div>
              <Button
                type="submit"
                disabled={isWithdrawPending || isWithdrawTxLoading}
              >
                {isWithdrawPending || isWithdrawTxLoading ? "Withdrawing..." : "Withdraw"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}