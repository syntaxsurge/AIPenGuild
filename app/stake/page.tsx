'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useContract } from "@/hooks/use-smart-contract"
import { useToast } from "@/hooks/use-toast-notifications"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"

interface StakeInfo {
  staker: `0x${string}`
  startTimestamp: bigint
  lastClaimed: bigint
  staked: boolean
}

interface NFTItem {
  itemId: bigint
  creator: string
  xpValue: bigint
  isOnSale: boolean
  salePrice: bigint
  resourceUrl: string
  owner: string
  stakeInfo?: StakeInfo
}

export default function StakePage() {
  const { address: userAddress } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { toast } = useToast()

  const nftMarketplaceHub = useContract("NFTMarketplaceHub")
  const nftStakingPool = useContract("NFTStakingPool")

  // All items from the chain
  const [allItems, setAllItems] = useState<NFTItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [fetched, setFetched] = useState(false)

  // xpPerSecond from the contract
  const [xpRate, setXpRate] = useState<bigint>(0n)
  const [hasFetchedXpRate, setHasFetchedXpRate] = useState(false)

  // For showing a selected NFT in a side card
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)

  // For transaction states, keyed by itemId
  interface TxState {
    loading: boolean
    success: boolean
    error: string | null
  }
  const [txMap, setTxMap] = useState<Record<string, TxState>>({})

  // Current time for real-time unclaimed XP
  const [currentTime, setCurrentTime] = useState<number>(
    Math.floor(Date.now() / 1000)
  )
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Update currentTime every second
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // 1) Read xpPerSecond from staking contract
  useEffect(() => {
    async function loadXpRate() {
      if (hasFetchedXpRate) return
      if (!publicClient) return
      if (!nftStakingPool) return

      try {
        const val = await publicClient.readContract({
          address: nftStakingPool.address as `0x${string}`,
          abi: nftStakingPool.abi,
          functionName: "xpPerSecond",
          args: []
        })
        if (typeof val === "bigint") {
          setXpRate(val)
        }
        setHasFetchedXpRate(true)
      } catch (err) {
        console.error("Failed to read xpPerSecond:", err)
      }
    }
    loadXpRate()
  }, [publicClient, nftStakingPool, hasFetchedXpRate])

  // 2) Fetch items from marketplace hub
  async function fetchAllNFTs(forceReload?: boolean) {
    if (!userAddress) return
    if (!publicClient) return
    if (!nftMarketplaceHub) return

    if (!forceReload && fetched) return
    setFetched(true)
    setLoadingItems(true)

    try {
      // read totalItemId
      const totalItemId = await publicClient.readContract({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: nftMarketplaceHub.abi,
        functionName: "getLatestItemId",
        args: []
      }) as bigint

      if (typeof totalItemId !== "bigint" || totalItemId < 1n) {
        setLoadingItems(false)
        return
      }

      // build multicall requests: [nftData, ownerOf, stakes]
      const calls = []
      for (let i = 1n; i <= totalItemId; i++) {
        calls.push({
          address: nftMarketplaceHub.address as `0x${string}`,
          abi: nftMarketplaceHub.abi,
          functionName: "nftData",
          args: [i]
        })
        calls.push({
          address: nftMarketplaceHub.address as `0x${string}`,
          abi: nftMarketplaceHub.abi,
          functionName: "ownerOf",
          args: [i]
        })
        calls.push({
          address: nftStakingPool?.address as `0x${string}`,
          abi: nftStakingPool?.abi,
          functionName: "stakes",
          args: [i]
        })
      }

      const multicallResults = await publicClient.multicall({
        contracts: calls,
        allowFailure: true
      })

      const newItems: NFTItem[] = []
      for (let i = 0; i < multicallResults.length; i += 3) {
        const nftDataResult = multicallResults[i]
        const ownerResult = multicallResults[i + 1]
        const stakeInfoResult = multicallResults[i + 2]

        if (!nftDataResult.result || !ownerResult.result || !stakeInfoResult.result) {
          continue
        }

        const [itemId, creator, xpValue, isOnSale, salePrice, resourceUrl] =
          nftDataResult.result as [bigint, string, bigint, boolean, bigint, string]
        const owner = ownerResult.result as `0x${string}`
        const [staker, startTimestamp, lastClaimed, staked] =
          stakeInfoResult.result as [string, bigint, bigint, boolean]

        newItems.push({
          itemId,
          creator,
          xpValue,
          isOnSale,
          salePrice,
          resourceUrl,
          owner,
          stakeInfo: {
            staker: staker as `0x${string}`,
            startTimestamp,
            lastClaimed,
            staked
          }
        })
      }

      setAllItems(newItems)
    } catch (err) {
      console.error("Error loading items via multicall:", err)
    } finally {
      setLoadingItems(false)
    }
  }

  useEffect(() => {
    fetchAllNFTs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress, publicClient, nftMarketplaceHub, nftStakingPool])

  // 3) Ensure setApprovalForAll
  async function ensureApprovalForAll() {
    if (!userAddress || !walletClient || !nftMarketplaceHub || !nftStakingPool) return

    try {
      const isApproved = (await publicClient?.readContract({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: [
          {
            name: "isApprovedForAll",
            type: "function",
            stateMutability: "view",
            inputs: [
              { name: "owner", type: "address" },
              { name: "operator", type: "address" }
            ],
            outputs: [{ name: "", type: "bool" }]
          }
        ],
        functionName: "isApprovedForAll",
        args: [userAddress, nftStakingPool.address as `0x${string}`]
      })) as boolean

      if (!isApproved) {
        toast({ title: "Approval Required", description: "Approving staking contract..." })
        const hash = await walletClient.writeContract({
          address: nftMarketplaceHub.address as `0x${string}`,
          abi: [
            {
              name: "setApprovalForAll",
              type: "function",
              stateMutability: "nonpayable",
              inputs: [
                { name: "operator", type: "address" },
                { name: "approved", type: "bool" }
              ],
              outputs: []
            }
          ],
          functionName: "setApprovalForAll",
          args: [nftStakingPool.address as `0x${string}`, true],
          account: userAddress
        })
        toast({ title: "Approval Tx Sent", description: `Hash: ${hash}` })
        await publicClient?.waitForTransactionReceipt({ hash })
        toast({
          title: "Approved!",
          description: "Staking contract can now manage your NFTs."
        })
      }
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message || "Could not set approval for all.",
        variant: "destructive"
      })
      throw error
    }
  }

  // 4) handle stake
  async function handleStake(item: NFTItem) {
    if (!nftStakingPool || !walletClient || !userAddress || !publicClient) return

    const itemIdStr = item.itemId.toString()
    setTxMap((prev) => ({
      ...prev,
      [itemIdStr]: { loading: true, success: false, error: null }
    }))

    try {
      await ensureApprovalForAll()
      toast({ title: "Staking...", description: "Sending transaction..." })
      const hash = await walletClient.writeContract({
        address: nftStakingPool.address as `0x${string}`,
        abi: nftStakingPool.abi,
        functionName: "stakeNFT",
        args: [item.itemId],
        account: userAddress
      })

      toast({ title: "Transaction Submitted", description: `Tx Hash: ${String(hash)}` })
      await publicClient.waitForTransactionReceipt({ hash })

      toast({ title: "Stake Complete", description: "Your NFT is now staked." })
      setTxMap((prev) => ({
        ...prev,
        [itemIdStr]: { loading: false, success: true, error: null }
      }))

      // Refresh data
      fetchAllNFTs(true)
    } catch (err: any) {
      setTxMap((prev) => ({
        ...prev,
        [itemIdStr]: { loading: false, success: false, error: err.message }
      }))
      toast({
        title: "Stake Error",
        description: err.message || "Failed to stake NFT",
        variant: "destructive"
      })
    }
  }

  // 5) handle unstake
  async function handleUnstake(item: NFTItem) {
    if (!nftStakingPool || !walletClient || !userAddress || !publicClient) return

    const itemIdStr = item.itemId.toString()
    setTxMap((prev) => ({
      ...prev,
      [itemIdStr]: { loading: true, success: false, error: null }
    }))

    try {
      toast({ title: "Unstaking...", description: "Sending transaction..." })
      const hash = await walletClient.writeContract({
        address: nftStakingPool.address as `0x${string}`,
        abi: nftStakingPool.abi,
        functionName: "unstakeNFT",
        args: [item.itemId],
        account: userAddress
      })

      toast({ title: "Transaction Submitted", description: `Tx Hash: ${String(hash)}` })
      await publicClient.waitForTransactionReceipt({ hash })

      toast({ title: "Unstake Complete", description: "Your NFT has been unstaked." })
      setTxMap((prev) => ({
        ...prev,
        [itemIdStr]: { loading: false, success: true, error: null }
      }))

      fetchAllNFTs(true)
    } catch (err: any) {
      setTxMap((prev) => ({
        ...prev,
        [itemIdStr]: { loading: false, success: false, error: err.message }
      }))
      toast({
        title: "Unstake Error",
        description: err.message || "Failed to unstake NFT",
        variant: "destructive"
      })
    }
  }

  // 6) handle claim
  async function handleClaim(item: NFTItem) {
    if (!nftStakingPool || !walletClient || !userAddress || !publicClient) return

    const itemIdStr = item.itemId.toString()
    setTxMap((prev) => ({
      ...prev,
      [itemIdStr]: { loading: true, success: false, error: null }
    }))

    try {
      toast({ title: "Claiming...", description: "Sending transaction..." })
      const hash = await walletClient.writeContract({
        address: nftStakingPool.address as `0x${string}`,
        abi: nftStakingPool.abi,
        functionName: "claimStakingRewards",
        args: [item.itemId],
        account: userAddress
      })

      toast({ title: "Transaction Submitted", description: `Tx Hash: ${String(hash)}` })
      await publicClient.waitForTransactionReceipt({ hash })

      toast({ title: "Claim Success", description: "You claimed staking rewards as XP." })
      setTxMap((prev) => ({
        ...prev,
        [itemIdStr]: { loading: false, success: true, error: null }
      }))

      fetchAllNFTs(true)
    } catch (err: any) {
      setTxMap((prev) => ({
        ...prev,
        [itemIdStr]: { loading: false, success: false, error: err.message }
      }))
      toast({
        title: "Claim Error",
        description: err.message || "Failed to claim rewards",
        variant: "destructive"
      })
    }
  }

  // 7) Filter user items (owner or staker)
  const userItems = allItems.filter((item) => {
    if (!userAddress) return false
    const staked = item.stakeInfo?.staked
    const stakerIsUser = item.stakeInfo?.staker?.toLowerCase() === userAddress.toLowerCase()
    const ownerIsUser = item.owner.toLowerCase() === userAddress.toLowerCase()
    return ownerIsUser || (staked && stakerIsUser)
  })

  // 8) compute unclaimed xp for a single item
  function computeUnclaimedXP(item: NFTItem): bigint {
    if (!xpRate) return 0n
    if (!item.stakeInfo?.staked) return 0n
    if (item.stakeInfo.staker.toLowerCase() !== userAddress?.toLowerCase()) return 0n

    const diff = BigInt(currentTime) - item.stakeInfo.lastClaimed
    return diff > 0 ? diff * xpRate : 0n
  }

  // 9) sum total unclaimed xp
  const totalUnclaimed = userItems.reduce((acc, item) => acc + computeUnclaimedXP(item), 0n)

  // If not connected
  if (!userAddress) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
        <h1 className="mb-2 text-4xl font-extrabold text-primary">Stake NFTs</h1>
        <p className="text-sm text-muted-foreground">Please connect your wallet.</p>
      </main>
    )
  }

  // Helper to convert a bigInt timestamp (seconds) to local date/time
  function formatTimestampSec(sec: bigint): string {
    // sec is a bigInt. Convert to Number, multiply by 1000 for ms
    const ms = Number(sec) * 1000
    return new Date(ms).toLocaleString()
  }

  return (
    <main className="mx-auto max-w-5xl min-h-screen px-4 py-12 sm:px-6 md:px-8 bg-background text-foreground">
      {/* Page Title */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-extrabold text-primary">Stake Your NFTs</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Earn extra XP by staking your NFTs on AIPenGuild.
        </p>
      </div>

      {/* Card for total unclaimed XP */}
      <Card className="mb-6 border border-border rounded-lg shadow-sm">
        <CardHeader className="p-4 bg-secondary text-secondary-foreground rounded-t-lg">
          <CardTitle className="text-base font-semibold">
            Your Unclaimed Staking Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-xl font-extrabold text-primary">
            {totalUnclaimed.toString()} XP
          </p>
        </CardContent>
      </Card>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left card: Grid of user's NFTs */}
        <Card className="border border-border rounded-lg shadow-sm">
          <CardHeader className="p-4 bg-accent text-accent-foreground rounded-t-lg">
            <CardTitle className="text-base font-semibold">Your NFTs</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {loadingItems ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading NFTs...</span>
              </div>
            ) : userItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No NFTs found for staking.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {userItems.map((item) => {
                  const displayUrl =
                    item.resourceUrl.startsWith("ipfs://")
                      ? item.resourceUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
                      : item.resourceUrl

                  const staked = item.stakeInfo?.staked
                  return (
                    <div
                      key={String(item.itemId)}
                      onClick={() => setSelectedNFT(item)}
                      className={cn(
                        "cursor-pointer rounded-md border p-2 hover:shadow transition",
                        selectedNFT?.itemId === item.itemId
                          ? "border-primary"
                          : "border-border"
                      )}
                    >
                      <div className="relative h-24 w-full overflow-hidden rounded bg-secondary sm:h-28">
                        <Image
                          src={displayUrl}
                          alt={`NFT #${String(item.itemId)}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-foreground line-clamp-1">
                        #{String(item.itemId)} {staked && "(Staked)"}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right card: Selected NFT + stake actions */}
        <Card className="border border-border rounded-lg shadow-sm">
          <CardHeader className="p-4 bg-secondary text-secondary-foreground rounded-t-lg">
            <CardTitle className="text-base font-semibold">
              {selectedNFT
                ? `NFT #${String(selectedNFT.itemId)}`
                : "Select an NFT"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {!selectedNFT ? (
              <p className="text-sm text-muted-foreground">
                Please select an NFT from the left panel.
              </p>
            ) : (
              <div className="space-y-4">
                {/* NFT Preview */}
                <div className="relative h-40 w-full overflow-hidden rounded-md border border-border bg-secondary">
                  <Image
                    src={
                      selectedNFT.resourceUrl.startsWith("ipfs://")
                        ? selectedNFT.resourceUrl.replace(
                          "ipfs://",
                          "https://ipfs.io/ipfs/"
                        )
                        : selectedNFT.resourceUrl
                    }
                    alt={`NFT #${String(selectedNFT.itemId)}`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Display if staked or not */}
                {selectedNFT.stakeInfo?.staked ? (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-bold text-green-600">Staked</span>{" "}
                    since{" "}
                    <span className="font-bold text-foreground">
                      {formatTimestampSec(selectedNFT.stakeInfo.startTimestamp)}
                    </span>
                    .
                    <br />
                    Unclaimed XP:{" "}
                    <span className="font-bold text-primary">
                      {computeUnclaimedXP(selectedNFT).toString()}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-orange-600 font-bold">Not Staked</p>
                )}

                {/* Transaction State */}
                {(() => {
                  const txState = txMap[selectedNFT.itemId.toString()]
                  if (!txState) return null

                  if (txState.loading || txState.success || txState.error) {
                    return (
                      <div className="rounded-md border border-border p-3 text-xs">
                        <p className="font-medium">Transaction Status:</p>
                        {txState.loading && (
                          <p className="text-muted-foreground">Pending...</p>
                        )}
                        {txState.success && (
                          <p className="text-green-600">Transaction Confirmed!</p>
                        )}
                        {txState.error && (
                          <p className="font-bold text-orange-600">
                            Transaction Failed: {txState.error}
                          </p>
                        )}
                      </div>
                    )
                  }
                  return null
                })()}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  {selectedNFT.stakeInfo?.staked ? (
                    <>
                      <Button
                        variant="default"
                        onClick={() => handleClaim(selectedNFT)}
                        disabled={txMap[selectedNFT.itemId.toString()]?.loading}
                      >
                        {txMap[selectedNFT.itemId.toString()]?.loading
                          ? "Processing..."
                          : "Claim Rewards"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUnstake(selectedNFT)}
                        disabled={txMap[selectedNFT.itemId.toString()]?.loading}
                      >
                        {txMap[selectedNFT.itemId.toString()]?.loading
                          ? "Processing..."
                          : "Unstake"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="default"
                      onClick={() => handleStake(selectedNFT)}
                      disabled={txMap[selectedNFT.itemId.toString()]?.loading}
                    >
                      {txMap[selectedNFT.itemId.toString()]?.loading
                        ? "Processing..."
                        : "Stake"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}