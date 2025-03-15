'use client'

import { useAccount } from "wagmi"
import { useContract } from "@/hooks/use-contract"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { parseEther } from "viem"
import { useWriteContract } from "wagmi"
import { useWaitForTransactionReceipt } from "wagmi"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const { address } = useAccount()
  const { toast } = useToast()
  const rewardPool = useContract("AIRewardPool")
  const [owner, setOwner] = useState<string>("")
  const [poolBalance, setPoolBalance] = useState<string>("0")
  const [isOwner, setIsOwner] = useState<boolean>(false)

  // Hardcoded owner check for demonstration. In practice, you'd fetch from your contracts.
  // Or if you have a specific contract that sets ownership for the Admin site, you'd read from it.
  useEffect(() => {
    // Suppose the contract's owner is the deployer
    async function fetchOwner() {
      try {
        if (!rewardPool?.address || !rewardPool?.abi) return
        // In your real code, you'd read from the contract. This is just an example.
        // For simplicity, let's assume the contract is Ownable and has an owner() function.
        // But you might also store the owner's address in your addresses.ts
        // and compare with `address` from wagmi.
        const retrievedOwner = "0xOwnerAddress" // placeholder
        setOwner(retrievedOwner)
      } catch (error) {
        console.log(error)
      }
    }
    fetchOwner()
  }, [rewardPool])

  useEffect(() => {
    setIsOwner(address?.toLowerCase() === owner?.toLowerCase())
  }, [address, owner])

  // If not owner => 403 Access Denied
  if (!isOwner) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900 text-foreground p-8">
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-extrabold">403 Access Denied</h1>
          <p className="text-orange-600 dark:text-orange-500 font-bold text-sm mt-3">
            You do not have permission to view this page. Please connect with the contract owner's wallet.
          </p>
        </div>
      </main>
    )
  }

  // If owner => show some minimal admin UI
  // Example: Withdrawing from the reward pool
  const {
    data: withdrawWriteData,
    error: withdrawError,
    isPending: isWithdrawPending,
    writeContract
  } = useWriteContract()

  const {
    data: withdrawTxReceipt,
    isLoading: isWithdrawTxLoading,
    isSuccess: isWithdrawTxSuccess,
    isError: isWithdrawTxError,
    error: withdrawTxReceiptError
  } = useWaitForTransactionReceipt({
    hash: withdrawWriteData ?? undefined
  })

  useEffect(() => {
    if (isWithdrawTxLoading) {
      toast({
        title: "Withdrawing Funds",
        description: "Your transaction is pending..."
      })
    }
    if (isWithdrawTxSuccess) {
      toast({
        title: "Withdrawal Successful",
        description: "Funds have been withdrawn from the reward pool."
      })
    }
    if (isWithdrawTxError) {
      toast({
        title: "Withdrawal Failed",
        description: withdrawTxReceiptError?.message || withdrawError?.message || "Something went wrong.",
        variant: "destructive"
      })
    }
  }, [isWithdrawTxLoading, isWithdrawTxSuccess, isWithdrawTxError, withdrawTxReceiptError, withdrawError, toast])

  // Load pool balance for demonstration
  useEffect(() => {
    async function loadPoolBalance() {
      try {
        if (!rewardPool || !rewardPool.address || !rewardPool.abi) return
        // read contract for getPoolBalance
        const data = await fetchPoolBalance()
        setPoolBalance(data)
      } catch (error) {
        console.log(error)
      }
    }
    loadPoolBalance()
  }, [rewardPool])

  async function fetchPoolBalance(): Promise<string> {
    if (!rewardPool || !rewardPool.address) return "0"
    const result = await window.ethereum?.request({
      method: "eth_call",
      params: [
        {
          to: rewardPool.address,
          data: "0x18160ddd" // function signature for "totalSupply()" or "getPoolBalance()" might differ
        },
        "latest"
      ]
    })
    // This is a simplified approach, you'd decode the data properly or use publicClient.readContract
    if (!result) return "0"
    const hexValue = BigInt(result)
    return (Number(hexValue) / 1e18).toFixed(4)
  }

  async function handleWithdraw() {
    try {
      if (!rewardPool?.address || !rewardPool?.abi) return
      const methodSignature = {
        name: "withdrawPoolFunds",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "amount", type: "uint256" }
        ],
        outputs: []
      }
      await writeContract({
        address: rewardPool.address as `0x${string}`,
        abi: [methodSignature],
        functionName: "withdrawPoolFunds",
        args: [parseEther("0.1")]
      })
      toast({
        title: "Transaction Sent",
        description: "Withdraw request submitted..."
      })
    } catch (error: any) {
      toast({
        title: "Withdrawal Error",
        description: error.message || "Could not withdraw funds.",
        variant: "destructive"
      })
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl p-4 bg-white dark:bg-gray-900 text-foreground">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Welcome, Admin! This page demonstrates how to withdraw from the reward pool.
          </p>
          <div className="mt-4">
            <p className="text-sm">Reward Pool Balance: {poolBalance} ETH</p>
          </div>
          <Button onClick={handleWithdraw} disabled={isWithdrawPending || isWithdrawTxLoading} className="mt-4">
            {isWithdrawPending || isWithdrawTxLoading ? "Withdrawing..." : "Withdraw 0.1 ETH"}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}