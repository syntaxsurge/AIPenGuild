'use client'

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount, usePublicClient, useWaitForTransactionReceipt } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useContract } from "@/hooks/use-contract"
import { useWriteContract } from "wagmi"
import { parseEther } from "viem"

export default function AdminPage() {
  const router = useRouter()

  // Wagmi states
  const { address: wagmiAddress, isDisconnected } = useAccount()
  const publicClient = usePublicClient()
  const { toast } = useToast()

  // Contract config
  const platformRewardPool = useContract("PlatformRewardPool")

  // State to track if the user is the owner
  const [isOwner, setIsOwner] = useState(false)
  const [ownerLoading, setOwnerLoading] = useState(true)

  // Pool balance states
  const [poolBalance, setPoolBalance] = useState<bigint>(0n)
  const [loadingBalance, setLoadingBalance] = useState(false)

  // Withdraw input
  const [withdrawAmount, setWithdrawAmount] = useState("")

  // Write contract states
  const {
    data: withdrawData,
    error: withdrawError,
    isPending: isWithdrawPending,
    isSuccess: isWriteSuccess,
    writeContract: writeWithdrawContract
  } = useWriteContract()

  const {
    data: withdrawReceipt,
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    isError: isTxError,
    error: txError
  } = useWaitForTransactionReceipt({
    hash: withdrawData ?? undefined
  })

  // 1) Check ownership (once address is known)
  useEffect(() => {
    async function checkOwner() {
      if (!platformRewardPool?.address || !platformRewardPool?.abi || !publicClient || !wagmiAddress) {
        setIsOwner(false)
        setOwnerLoading(false)
        return
      }
      try {
        const contractOwner = await publicClient.readContract({
          address: platformRewardPool.address as `0x${string}`,
          abi: platformRewardPool.abi,
          functionName: "owner",
          args: []
        }) as `0x${string}`

        setIsOwner(contractOwner.toLowerCase() === wagmiAddress.toLowerCase())
      } catch {
        setIsOwner(false)
      }
      setOwnerLoading(false)
    }

    // If there's a connected address, check ownership
    if (!isDisconnected && wagmiAddress) {
      checkOwner()
    } else {
      setIsOwner(false)
      setOwnerLoading(false)
    }
  }, [platformRewardPool, publicClient, wagmiAddress, isDisconnected])

  // 2) Load pool balance
  useEffect(() => {
    async function loadBalance() {
      if (!platformRewardPool?.address || !platformRewardPool?.abi || !publicClient) return
      try {
        setLoadingBalance(true)
        const val = await publicClient.readContract({
          address: platformRewardPool.address as `0x${string}`,
          abi: platformRewardPool.abi,
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

    // Load balance once user possibly is the owner or not
    if (!isDisconnected && platformRewardPool?.address) {
      loadBalance()
    }
  }, [platformRewardPool?.address, isDisconnected, toast, publicClient])

  // 3) Watch withdrawal transaction events
  useEffect(() => {
    if (isTxLoading) {
      toast({
        title: "Transaction Pending",
        description: "Your withdrawal transaction is being confirmed..."
      })
    }
    if (isTxSuccess) {
      toast({
        title: "Withdrawal Successful",
        description: "Funds withdrawn from reward pool"
      })
      setWithdrawAmount("")
      // Reload balance
      if (!loadingBalance) {
        // Trigger a fresh load
        (async () => {
          if (platformRewardPool?.address && platformRewardPool?.abi && publicClient) {
            try {
              setLoadingBalance(true)
              const val = await publicClient.readContract({
                address: platformRewardPool.address as `0x\${string}`,
                abi: platformRewardPool.abi,
                functionName: "getPoolBalance",
                args: []
              })
              if (typeof val === "bigint") {
                setPoolBalance(val)
              }
            } catch { }
            setLoadingBalance(false)
          }
        })()
      }
    }
    if (isTxError) {
      toast({
        title: "Transaction Failed",
        description: txError?.message || withdrawError?.message || "Something went wrong",
        variant: "destructive"
      })
    }
  }, [isTxLoading, isTxSuccess, isTxError, withdrawError, txError, toast, platformRewardPool?.address, platformRewardPool?.abi, publicClient, loadingBalance])

  // 4) If user is not the owner (and done loading), redirect
  //    We must declare the effect unconditionally, so the hooks order remains stable.
  useEffect(() => {
    if (!ownerLoading && !isOwner) {
      router.push("/errors/403")
    }
  }, [ownerLoading, isOwner, router])

  // 5) Handle withdrawal
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!platformRewardPool?.address || !platformRewardPool?.abi) {
      toast({
        title: "Error",
        description: "Unable to find PlatformRewardPool contract or ABI.",
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
        address: platformRewardPool.address as `0x\${string}`,
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

  // A) If not connected at all
  if (isDisconnected) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
        <h1 className="text-center text-4xl font-extrabold text-primary mb-6">Admin Panel</h1>
        <p className="text-center text-sm text-muted-foreground">Please connect your wallet.</p>
      </main>
    )
  }

  // B) If we're still loading ownership
  if (ownerLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
        <h1 className="text-center text-4xl font-extrabold text-primary mb-6">Admin Panel</h1>
        <p className="text-center text-sm text-muted-foreground">Checking ownership...</p>
      </main>
    )
  }

  // C) If at this point, user is not owner, we return null
  //    The effect above will have pushed them to /errors/403
  if (!isOwner) {
    return null
  }

  // D) If user is indeed the contract owner, show the panel
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
            <form onSubmit={handleWithdraw} className="flex flex-col gap-2">
              <div className="flex flex-col">
                <label className="text-xs font-medium">Amount in ETH</label>
                <Input
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.5"
                />
              </div>
              <Button
                type="submit"
                disabled={isWithdrawPending || isTxLoading}
              >
                {isWithdrawPending || isTxLoading ? "Withdrawing..." : "Withdraw"}
              </Button>

              {/* Transaction Status */}
              <div className="rounded-md border border-border p-4 mt-2 text-sm">
                <p className="font-medium">Transaction Status:</p>
                {isTxLoading && <p className="text-muted-foreground">Pending confirmation...</p>}
                {isTxSuccess && (
                  <p className="text-green-600">
                    Transaction Confirmed! Withdrawal successful.
                  </p>
                )}
                {isTxError && (
                  <p className="font-bold text-orange-600 dark:text-orange-500">
                    Transaction Failed: {txError?.message || withdrawError?.message}
                  </p>
                )}
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}