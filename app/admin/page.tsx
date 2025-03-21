'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TransactionStatus } from "@/components/ui/transaction-status"
import { useNativeCurrencySymbol } from "@/hooks/use-native-currency-symbol"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { useRouter } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"
import { parseEther } from "viem"
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi"

interface TxStatus {
  loading: boolean
  success: boolean
  error: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const currencySymbol = useNativeCurrencySymbol()

  // Wagmi states
  const { address: wagmiAddress, isDisconnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { toast } = useToast()
  const chainId = useChainId() || 1287

  // Contract config
  const platformRewardPool = useContract("PlatformRewardPool")

  const isReferencesReady = (
    !isDisconnected &&
    !!publicClient &&
    !!wagmiAddress &&
    !!platformRewardPool?.address &&
    !!platformRewardPool?.abi
  )

  // State to track if the user is the owner
  const [isOwner, setIsOwner] = useState(false)
  const [ownerLoading, setOwnerLoading] = useState(true)

  // Pool balance states
  const [poolBalance, setPoolBalance] = useState<bigint>(0n)
  const [loadingBalance, setLoadingBalance] = useState(false)

  // Withdraw input
  const [withdrawAmount, setWithdrawAmount] = useState("")

  // Transaction state
  const [withdrawTx, setWithdrawTx] = useState<TxStatus>({
    loading: false,
    success: false,
    error: null
  })
  // We'll track the transaction hash, so we can show a link in <TransactionStatus />
  const [withdrawHash, setWithdrawHash] = useState<`0x${string}` | null>(null)

  const referencesCheckedRef = useRef(false)
  const balanceLoadedRef = useRef(false)

  // 1) Check ownership once references are ready
  useEffect(() => {
    if (!isReferencesReady) return
    if (referencesCheckedRef.current) return
    referencesCheckedRef.current = true

    async function checkOwner() {
      try {
        const contractOwner = await publicClient!.readContract({
          address: platformRewardPool!.address as `0x${string}`,
          abi: platformRewardPool!.abi,
          functionName: "owner",
          args: []
        }) as `0x${string}`

        setIsOwner(contractOwner.toLowerCase() === wagmiAddress!.toLowerCase())
      } catch {
        setIsOwner(false)
      } finally {
        setOwnerLoading(false)
      }
    }

    checkOwner()
  }, [isReferencesReady, publicClient, platformRewardPool, wagmiAddress])

  // 2) redirect if not owner
  useEffect(() => {
    if (!ownerLoading && !isOwner && isReferencesReady) {
      router.push("/errors/403")
    }
  }, [ownerLoading, isOwner, router, isReferencesReady])

  // 3) load pool balance (only once)
  useEffect(() => {
    async function loadBalance() {
      if (!publicClient || !platformRewardPool?.address || !platformRewardPool?.abi) return
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

    // Only load once if references are ready, we know we're the owner, and not disconnected
    if (isReferencesReady && !ownerLoading && isOwner && !balanceLoadedRef.current) {
      balanceLoadedRef.current = true
      loadBalance()
    }
  }, [isReferencesReady, ownerLoading, isOwner, platformRewardPool, publicClient, toast])

  // Withdraw logic
  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()

    if (!platformRewardPool?.address || !platformRewardPool?.abi) {
      toast({
        title: "Error",
        description: "Unable to find PlatformRewardPool contract or ABI.",
        variant: "destructive"
      })
      return
    }

    if (!walletClient || !publicClient) {
      toast({
        title: "No Wallet or Public Client",
        description: "Please connect your wallet properly before withdrawing.",
        variant: "destructive"
      })
      return
    }

    setWithdrawTx({ loading: true, success: false, error: null })
    setWithdrawHash(null)

    const weiAmount = parseEther(withdrawAmount)
    try {
      toast({
        title: "Transaction Submitted",
        description: `Withdrawing ${withdrawAmount} ${currencySymbol} from reward pool...`
      })

      const hash = await walletClient.writeContract({
        address: platformRewardPool.address as `0x${string}`,
        abi: platformRewardPool.abi,
        functionName: "withdrawPoolFunds",
        args: [weiAmount],
        account: wagmiAddress
      })

      setWithdrawHash(hash)

      await publicClient.waitForTransactionReceipt({ hash })

      toast({
        title: "Withdrawal Successful",
        description: "Funds withdrawn from reward pool"
      })
      setWithdrawTx({ loading: false, success: true, error: null })

      // Reset input, reload balance
      setWithdrawAmount("")
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
      setWithdrawTx({ loading: false, success: false, error: err.message })
      toast({
        title: "Transaction Failed",
        description: err.message || "Something went wrong",
        variant: "destructive"
      })
    }
  }

  if (isDisconnected) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-gray-900 text-foreground flex justify-center px-4 py-12">
        <div className="max-w-5xl w-full">
          <h1 className="text-center text-4xl font-extrabold text-primary mb-6">Admin Panel</h1>
          <p className="text-center text-sm text-muted-foreground">Please connect your wallet.</p>
        </div>
      </main>
    )
  }

  if (!isReferencesReady) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-gray-900 text-foreground flex justify-center px-4 py-12">
        <div className="max-w-5xl w-full">
          <h1 className="text-center text-4xl font-extrabold text-primary mb-6">Admin Panel</h1>
          <p className="text-center text-sm text-muted-foreground">
            Loading contract references...
          </p>
        </div>
      </main>
    )
  }

  if (ownerLoading) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-gray-900 text-foreground flex justify-center px-4 py-12">
        <div className="max-w-5xl w-full">
          <h1 className="text-center text-4xl font-extrabold text-primary mb-6">Admin Panel</h1>
          <p className="text-center text-sm text-muted-foreground">Checking ownership...</p>
        </div>
      </main>
    )
  }

  if (!isOwner) {
    return null
  }

  return (
    <main className="w-full min-h-screen bg-white dark:bg-gray-900 text-foreground flex justify-center px-4 py-12">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-extrabold text-primary text-center mb-8">Admin Panel</h1>
        <Card className="border border-border rounded-lg shadow-xl bg-background">
          <CardHeader className="p-4 bg-secondary text-secondary-foreground rounded-t-lg">
            <CardTitle className="text-lg font-semibold">Reward Pool Management</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Pool Balance:</p>
              <div className="text-lg font-bold text-primary">
                {loadingBalance ? "Loading..." : `${(Number(poolBalance) / 1e18).toFixed(4)} ${currencySymbol}`}
              </div>
            </div>
            <hr className="border-border" />
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Withdraw funds from the reward pool (owner only).
              </p>
              <form onSubmit={handleWithdraw} className="flex flex-col gap-2">
                <div className="flex flex-col">
                  <label className="text-xs font-medium">Amount in {currencySymbol}</label>
                  <Input
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.5"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    !withdrawAmount ||
                    isNaN(Number(withdrawAmount)) ||
                    Number(withdrawAmount) <= 0 ||
                    withdrawTx.loading
                  }
                >
                  {withdrawTx.loading ? "Withdrawing..." : "Withdraw"}
                </Button>
              </form>

              <TransactionStatus
                isLoading={withdrawTx.loading}
                isSuccess={withdrawTx.success}
                errorMessage={withdrawTx.error}
                txHash={withdrawHash}
                chainId={chainId}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}