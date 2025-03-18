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

/**
 * This stake page:
 *  - If an NFT is listed (isOnSale), the user cannot stake it.
 *  - Show '(LISTED)' in place of '(Staked)' if isOnSale == true.
 *  - In the details card, do not show stake button if isOnSale == true and not staked. Instead show a note that it’s listed.
 */

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

// Transaction state for each action type
interface ActionTxState {
  loading: boolean
  success: boolean
  error: string | null
}

// We'll group stake/claim/unstake states under an item-specific object.
interface ItemTxState {
  stake?: ActionTxState
  claim?: ActionTxState
  unstake?: ActionTxState
}

export default function StakePage() {
  const { address: userAddress } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { toast } = useToast()

  const nftMarketplaceHub = useContract("NFTMarketplaceHub")
  const nftStakingPool = useContract("NFTStakingPool")

  // All items
  const [allItems, setAllItems] = useState<NFTItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [fetched, setFetched] = useState(false)

  // xpPerSecond
  const [xpRate, setXpRate] = useState<bigint>(0n)
  const [hasFetchedXpRate, setHasFetchedXpRate] = useState(false)

  // selected NFT
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)

  // Transaction states keyed by itemId
  const [txMap, setTxMap] = useState<Record<string, ItemTxState>>({})

  // For real-time unclaimed XP
  const [currentTime, setCurrentTime] = useState<number>(
    Math.floor(Date.now() / 1000)
  )
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function formatTimestampSec(sec: bigint): string {
    const ms = Number(sec) * 1000
    return new Date(ms).toLocaleString()
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // 1) read xpPerSecond
  useEffect(() => {
    async function loadXpRate() {
      if (hasFetchedXpRate) return
      if (!publicClient || !nftStakingPool) return
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

  // 2) fetch items
  async function fetchAllNFTs(forceReload?: boolean) {
    if (!userAddress || !publicClient || !nftMarketplaceHub) return
    if (!forceReload && fetched) return

    setFetched(true)
    setLoadingItems(true)
    try {
      const totalItemId = (await publicClient.readContract({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: nftMarketplaceHub.abi,
        functionName: "getLatestItemId",
        args: []
      })) as bigint

      if (typeof totalItemId !== "bigint" || totalItemId < 1n) {
        setLoadingItems(false)
        return
      }

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

  // 3) setApproval
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
        toast({
          title: "Approval Required",
          description: "Approving staking contract..."
        })
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
        toast({
          title: "Approval Tx Sent",
          description: `Hash: ${String(hash)}`
        })
        await publicClient?.waitForTransactionReceipt({ hash })
        toast({
          title: "Approved!",
          description: "Staking contract can now manage your NFTs."
        })
      }
    } catch (err: any) {
      toast({
        title: "Approval Failed",
        description: err.message || "Could not set approval for all.",
        variant: "destructive"
      })
      throw err
    }
  }

  // Helper to set or update a single action within txMap
  function updateTxState(itemId: bigint, action: "stake" | "claim" | "unstake", nextState: Partial<ActionTxState>) {
    setTxMap((prev) => {
      const itemIdStr = itemId.toString()
      const oldItemTxState = prev[itemIdStr] || {}
      const oldActionState = oldItemTxState[action] || { loading: false, success: false, error: null }
      const newActionState = { ...oldActionState, ...nextState }
      return {
        ...prev,
        [itemIdStr]: {
          ...oldItemTxState,
          [action]: newActionState
        }
      }
    })
  }

  // 4) stake
  async function handleStake(item: NFTItem) {
    if (!nftStakingPool || !walletClient || !userAddress || !publicClient) return

    // If it's on sale, do nothing
    if (item.isOnSale) {
      toast({
        title: "Cannot Stake",
        description: "This NFT is currently listed for sale. Please unlist it first.",
        variant: "destructive"
      })
      return
    }

    // Set stakeTxState to loading
    updateTxState(item.itemId, "stake", { loading: true, success: false, error: null })
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
      updateTxState(item.itemId, "stake", { loading: false, success: true })
      fetchAllNFTs(true)
    } catch (err: any) {
      updateTxState(item.itemId, "stake", { loading: false, success: false, error: err.message })
      toast({
        title: "Stake Error",
        description: err.message || "Failed to stake NFT",
        variant: "destructive"
      })
    }
  }

  // 5) unstake
  async function handleUnstake(item: NFTItem) {
    if (!nftStakingPool || !walletClient || !userAddress || !publicClient) return

    updateTxState(item.itemId, "unstake", { loading: true, success: false, error: null })
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
      updateTxState(item.itemId, "unstake", { loading: false, success: true })
      fetchAllNFTs(true)
    } catch (err: any) {
      updateTxState(item.itemId, "unstake", { loading: false, success: false, error: err.message })
      toast({
        title: "Unstake Error",
        description: err.message || "Failed to unstake NFT",
        variant: "destructive"
      })
    }
  }

  // 6) claim
  async function handleClaim(item: NFTItem) {
    if (!nftStakingPool || !walletClient || !userAddress || !publicClient) return

    updateTxState(item.itemId, "claim", { loading: true, success: false, error: null })
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
      updateTxState(item.itemId, "claim", { loading: false, success: true })
      fetchAllNFTs(true)
    } catch (err: any) {
      updateTxState(item.itemId, "claim", { loading: false, success: false, error: err.message })
      toast({
        title: "Claim Error",
        description: err.message || "Failed to claim rewards",
        variant: "destructive"
      })
    }
  }

  // user items
  const userItems = allItems.filter((item) => {
    if (!userAddress) return false
    const staked = item.stakeInfo?.staked
    const stakerIsUser =
      item.stakeInfo?.staker?.toLowerCase() === userAddress.toLowerCase()
    const ownerIsUser = item.owner.toLowerCase() === userAddress.toLowerCase()
    return ownerIsUser || (staked && stakerIsUser)
  })

  // compute unclaimed xp
  function computeUnclaimedXP(item: NFTItem): bigint {
    if (!xpRate) return 0n
    if (!item.stakeInfo?.staked) return 0n
    if (item.stakeInfo.staker.toLowerCase() !== userAddress?.toLowerCase()) return 0n

    const diff = BigInt(currentTime) - item.stakeInfo.lastClaimed
    return diff > 0 ? diff * xpRate : 0n
  }

  // total unclaimed xp
  const totalUnclaimed = userItems.reduce((acc, item) => acc + computeUnclaimedXP(item), 0n)

  // staked count
  const stakedCount = userItems.filter((item) => item.stakeInfo?.staked).length
  const notStakedCount = userItems.length - stakedCount

  // If not connected
  if (!userAddress) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
        <h1 className="mb-2 text-4xl font-extrabold text-primary">Stake NFTs</h1>
        <p className="text-sm text-muted-foreground">Please connect your wallet.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full min-h-screen px-4 py-12 sm:px-6 md:px-8 bg-background text-foreground">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-extrabold text-primary">Stake Your NFTs</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enjoy extra XP rewards by staking your NFTs on AIPenGuild.
        </p>
      </div>

      {/* Staking Overview */}
      <Card className="mb-6 border border-border rounded-lg shadow-sm">
        <CardHeader className="p-4 bg-secondary text-secondary-foreground rounded-t-lg">
          <CardTitle className="text-base font-semibold">Staking Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-6 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total NFTs (recognized):</span>
            <span className="font-semibold">{userItems.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Staked NFTs:</span>
            <span className="font-semibold">{stakedCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Not Staked:</span>
            <span className="font-semibold">{notStakedCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Staking Rate (XP/sec):</span>
            <span className="font-semibold">{xpRate.toString()}</span>
          </div>
          <hr className="my-3 border-border" />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Unclaimed XP:</span>
            <span className="text-2xl font-extrabold text-primary">
              {totalUnclaimed.toString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left - your NFTs */}
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
                  const displayUrl = item.resourceUrl.startsWith("ipfs://")
                    ? item.resourceUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
                    : item.resourceUrl

                  // " (STAKED)" or " (LISTED)" or neither
                  let label = ""
                  if (item.stakeInfo?.staked) {
                    label = "(STAKED)"
                  } else if (item.isOnSale) {
                    label = "(LISTED)"
                  }

                  const selected = selectedNFT?.itemId === item.itemId

                  return (
                    <div
                      key={String(item.itemId)}
                      onClick={() => setSelectedNFT(item)}
                      className={cn(
                        "cursor-pointer rounded-md border p-2 hover:shadow transition",
                        selected ? "border-primary" : "border-border"
                      )}
                    >
                      <div className="relative h-24 w-full overflow-hidden rounded bg-secondary sm:h-28">
                        <Image
                          src={displayUrl}
                          alt={`NFT #${String(item.itemId)}`}
                          fill
                          sizes="(max-width: 768px) 100vw,
                                 (max-width: 1200px) 50vw,
                                 33vw"
                          className="object-cover"
                        />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-foreground line-clamp-1">
                        NFT #{String(item.itemId)} {label}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right - details */}
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
                {/* Preview */}
                <div className="relative w-full h-96 overflow-hidden rounded-md border border-border bg-secondary">
                  <Image
                    src={
                      selectedNFT.resourceUrl.startsWith("ipfs://")
                        ? selectedNFT.resourceUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
                        : selectedNFT.resourceUrl
                    }
                    alt={`NFT #${String(selectedNFT.itemId)}`}
                    fill
                    sizes="(max-width: 768px) 100vw,
                           (max-width: 1200px) 50vw,
                           33vw"
                    className="object-contain"
                  />
                </div>

                {/* Info: staked or not, isOnSale */}
                {selectedNFT.stakeInfo?.staked ? (
                  // Staked => show unclaimed XP, claim, unstake
                  <div className="text-sm">
                    <span className="font-bold text-green-600">Staked</span>{" "}
                    since{" "}
                    <span className="font-bold text-foreground">
                      {formatTimestampSec(selectedNFT.stakeInfo.startTimestamp)}
                    </span>
                    .
                    <div className="mt-2 text-muted-foreground">
                      <span>Unclaimed XP:&nbsp;</span>
                      <span className="text-2xl font-extrabold text-primary">
                        {computeUnclaimedXP(selectedNFT).toString()}
                      </span>
                    </div>

                    {/* Tx states */}
                    {(() => {
                      const itemTx = txMap[selectedNFT.itemId.toString()] || {}
                      const claimTx = itemTx.claim
                      const unstakeTx = itemTx.unstake
                      // Show claimTx if any
                      // Show unstakeTx if any
                      const showTxStatus = (tx?: ActionTxState) => {
                        if (!tx) return null
                        if (tx.loading || tx.success || tx.error) {
                          return (
                            <div className="rounded-md border border-border p-3 text-xs mt-2">
                              <p className="font-medium">Transaction Status:</p>
                              {tx.loading && <p className="text-muted-foreground">Pending...</p>}
                              {tx.success && <p className="text-green-600">Transaction Confirmed!</p>}
                              {tx.error && (
                                <p className="font-bold text-orange-600">
                                  Transaction Failed: {tx.error}
                                </p>
                              )}
                            </div>
                          )
                        }
                        return null
                      }

                      return (
                        <>
                          {/* Claim button */}
                          <Button
                            variant="default"
                            className="mt-3 w-full"
                            onClick={() => handleClaim(selectedNFT)}
                            disabled={claimTx?.loading}
                          >
                            {claimTx?.loading ? "Processing..." : "Claim NFT Rewards"}
                          </Button>
                          {showTxStatus(claimTx)}

                          {/* Unstake button */}
                          <Button
                            variant="outline"
                            className="mt-3 w-full"
                            onClick={() => handleUnstake(selectedNFT)}
                            disabled={unstakeTx?.loading}
                          >
                            {unstakeTx?.loading ? "Processing..." : "Unstake NFT"}
                          </Button>
                          {showTxStatus(unstakeTx)}
                        </>
                      )
                    })()}
                  </div>
                ) : selectedNFT.isOnSale ? (
                  // Not staked but on sale => cannot stake
                  <p className="text-sm font-bold text-orange-500">
                    This NFT is currently listed for sale. Please unlist it first if you want to stake.
                  </p>
                ) : (
                  // Not staked, not on sale => stake button
                  <div className="text-sm text-muted-foreground">
                    <p className="font-bold text-orange-600">Not Staked</p>
                    {(() => {
                      const itemTx = txMap[selectedNFT.itemId.toString()] || {}
                      const stakeTx = itemTx.stake
                      const showTxStatus = (tx?: ActionTxState) => {
                        if (!tx) return null
                        if (tx.loading || tx.success || tx.error) {
                          return (
                            <div className="rounded-md border border-border p-3 text-xs mt-2">
                              <p className="font-medium">Transaction Status:</p>
                              {tx.loading && <p className="text-muted-foreground">Pending...</p>}
                              {tx.success && <p className="text-green-600">Transaction Confirmed!</p>}
                              {tx.error && (
                                <p className="font-bold text-orange-600">
                                  Transaction Failed: {tx.error}
                                </p>
                              )}
                            </div>
                          )
                        }
                        return null
                      }
                      return (
                        <>
                          <Button
                            variant="default"
                            className="mt-2 w-full"
                            onClick={() => handleStake(selectedNFT)}
                            disabled={stakeTx?.loading}
                          >
                            {stakeTx?.loading ? "Processing..." : "Stake NFT"}
                          </Button>
                          {showTxStatus(stakeTx)}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}