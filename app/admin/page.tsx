'use client'

import React, { useState, useEffect } from "react"
import { useAccount, usePublicClient, useWaitForTransactionReceipt } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useContract } from "@/hooks/use-contract"
import { useWriteContract } from "wagmi"

/**
 * Basic admin page:
 *  - Show reward pool balance (from AIRewardPool)
 *  - Let owner withdraw an amount
 *  - Potential placeholder for distributing from the pool, awarding perks, etc.
 *
 * In production, you might require an on-chain check if the user is the owner.
 * Here we trust them to only call if they are the contract owner, or the transaction will fail.
 */

export default function AdminPage() {
  const { address: wagmiAddress } = useAccount()
  const publicClient = usePublicClient()
  const aiRewardPool = useContract("AIRewardPool")
  const { toast } = useToast()

  const [balance, setBalance] = useState<bigint>(0n)
  const [reload, setReload] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [loadingBalance, setLoadingBalance] = useState(false)

  // For the withdraw transaction
  const {
    data: withdrawData,
    error: withdrawError,
    isPending: isWithdrawPending,
    isSuccess: isWithdrawSuccess,
    writeContract: writeWithdrawContract
  } = useWriteContract()

  const {
    data: withdrawReceipt,
    isLoading: isWithdrawTxLoading,
    isSuccess: isWithdrawTxSuccess,
    isError: isWithdrawTxError,
    error: withdrawTxReceiptError
  } = useWaitForTransactionReceipt({
    hash: withdrawData ?? undefined
  })

  // Toast notifications for withdraw
  useEffect(() => {
    if (isWithdrawTxLoading) {
      toast({
        title: "Transaction Pending",
        description: "Your withdraw transaction is being confirmed..."
      })
    }
    if (isWithdrawTxSuccess) {
      toast({
        title: "Transaction Successful!",
        description: "Funds have been withdrawn from the reward pool."
      })
      setWithdrawAmount("")
      setReload(!reload)
    }
    if (isWithdrawTxError) {
      toast({
        title: "Transaction Failed",
        description: withdrawTxReceiptError?.message || withdrawError?.message || "Something went wrong.",
        variant: "destructive"
      })
    }
  }, [
    isWithdrawTxLoading,
    isWithdrawTxSuccess,
    isWithdrawTxError,
    withdrawTxReceiptError,
    withdrawError,
    toast,
    reload
  ])

  // If user rejects in the wallet
  useEffect(() => {
    if (withdrawError) {
      toast({
        title: "Transaction Rejected",
        description: withdrawError.message || "User canceled transaction in wallet.",
        variant: "destructive"
      })
    }
  }, [withdrawError, toast])

  async function loadBalance() {
    if (!aiRewardPool?.address || !aiRewardPool?.abi || !publicClient) return
    try {
      setLoadingBalance(true)
      const val = await publicClient.readContract({
        address: aiRewardPool.address as `0x${string}`,
        abi: aiRewardPool.abi,
        functionName: "getPoolBalance",
        args: [] // FIX: Provide empty args
      })
      if (typeof val === "bigint") {
        setBalance(val)
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Cannot load reward pool balance.",
        variant: "destructive"
      })
    } finally {
      setLoadingBalance(false)
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    if (!aiRewardPool?.address) {
      toast({
        title: "No Contract Found",
        description: "AIRewardPool contract not found.",
        variant: "destructive"
      })
      return
    }
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid numeric amount (in ETH).",
        variant: "destructive"
      })
      return
    }

    // We'll parse the input as ETH, convert to wei
    const weiAmount = BigInt(Math.floor(Number(withdrawAmount) * 1e18))

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
        title: "Withdrawal Transaction",
        description: "Transaction submitted... awaiting confirmation."
      })
    } catch (err: any) {
      toast({
        title: "Withdraw Error",
        description: err.message || "Unable to process withdrawal.",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    loadBalance()
  }, [reload, aiRewardPool])

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <h1 className="mb-4 text-center text-3xl font-extrabold text-primary">Admin Panel</h1>
      {!wagmiAddress ? (
        <p className="text-center text-sm text-muted-foreground">Please connect your wallet.</p>
      ) : (
        <>
          <Card className="border border-border rounded-lg shadow-xl bg-background">
            <CardHeader className="p-4 bg-secondary text-secondary-foreground rounded-t-lg">
              <CardTitle className="text-lg font-semibold">Reward Pool</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pool Balance:</p>
                <div className="text-lg font-bold text-primary">
                  {loadingBalance ? "Loading..." : `${Number(balance) / 1e18} ETH`}
                </div>
              </div>
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Withdraw funds from the reward pool (owner only).
                </p>
                <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row sm:items-end gap-2">
                  <div className="flex flex-col flex-1">
                    <label className="text-xs font-medium">Amount (ETH)</label>
                    <Input
                      placeholder="0.5"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
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

          {/* Extra placeholder: awarding perks or distributing from the pool can be added here */}
          <Card className="mt-6 border border-border rounded-lg shadow-xl bg-background">
            <CardHeader className="p-4 bg-accent text-accent-foreground rounded-t-lg">
              <CardTitle className="text-lg font-semibold">XP Perks / Airdrops (Placeholder)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Future expansion: Distribute token rewards or perks to top XP users automatically.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}