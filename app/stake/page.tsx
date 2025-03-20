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
  resourceUrl: string
  mintedAt: bigint
  owner: string
  isOnSale: boolean
  salePrice: bigint
  stakeInfo?: StakeInfo
}

interface ActionTxState {
  loading: boolean
  success: boolean
  error: string | null
}

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
  const nftMintingPlatform = useContract("NFTMintingPlatform")
  const nftStakingPool = useContract("NFTStakingPool")

  const [allItems, setAllItems] = useState<NFTItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [fetched, setFetched] = useState(false)

  const [xpRate, setXpRate] = useState<bigint>(0n)
  const [hasFetchedXpRate, setHasFetchedXpRate] = useState(false)

  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)
  const [txMap, setTxMap] = useState<Record<string, ItemTxState>>({})
  const [currentTime, setCurrentTime] = useState<number>(
    Math.floor(Date.now() / 1000)
  )
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function formatTimestampSec(sec: bigint): string {
    return new Date(Number(sec) * 1000).toLocaleString()
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // 1) read xpPerSecond from NFTStakingPool
  useEffect(() => {
    async function loadXpRate() {
      if (hasFetchedXpRate) return
      if (!publicClient || !nftStakingPool?.address || !nftStakingPool?.abi) return
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

  // 2) fetch items from NFTMintingPlatform (metadata + ownership) and from NFTMarketplaceHub (sale data) + NFTStakingPool (stake data)
  async function fetchAllNFTs(forceReload?: boolean) {
    if (!userAddress || !publicClient || !nftMintingPlatform || !nftMarketplaceHub || !nftStakingPool) return
    if (!forceReload && fetched) return

    setFetched(true)
    setLoadingItems(true)
    try {
      // total minted
      const totalItemId = await publicClient.readContract({
        address: nftMintingPlatform.address as `0x${string}`,
        abi: nftMintingPlatform.abi,
        functionName: "getLatestMintedId",
        args: []
      }) as bigint

      if (typeof totalItemId !== "bigint" || totalItemId < 1n) {
        setLoadingItems(false)
        return
      }

      const calls = []
      for (let i = 1n; i <= totalItemId; i++) {
        // nftItems(i)
        calls.push({
          address: nftMintingPlatform.address as `0x${string}`,
          abi: nftMintingPlatform.abi,
          functionName: "nftItems",
          args: [i]
        })
        // ownerOf(i)
        calls.push({
          address: nftMintingPlatform.address as `0x${string}`,
          abi: nftMintingPlatform.abi,
          functionName: "ownerOf",
          args: [i]
        })
        // marketplace => marketItems(i)
        calls.push({
          address: nftMarketplaceHub.address as `0x${string}`,
          abi: nftMarketplaceHub.abi,
          functionName: "marketItems",
          args: [i]
        })
        // staking => stakes(i)
        calls.push({
          address: nftStakingPool.address as `0x${string}`,
          abi: nftStakingPool.abi,
          functionName: "stakes",
          args: [i]
        })
      }

      const multicallResults = await publicClient.multicall({
        contracts: calls,
        allowFailure: true
      })

      const newItems: NFTItem[] = []
      let idx = 0
      for (let i = 1n; i <= totalItemId; i++) {
        const nftDataCall = multicallResults[idx]
        const ownerCall = multicallResults[idx + 1]
        const marketCall = multicallResults[idx + 2]
        const stakeCall = multicallResults[idx + 3]
        idx += 4

        if (!nftDataCall?.result || !ownerCall?.result || !marketCall?.result || !stakeCall?.result) {
          continue
        }

        // nftItems => [xpValue, resourceUrl, mintedAt, creator]
        const [xpValue, resourceUrl, mintedAt, creator] = nftDataCall.result as [bigint, string, bigint, string]
        const owner = ownerCall.result as `0x${string}`
        const [isOnSale, salePrice] = marketCall.result as [boolean, bigint]
        const [stakerAddr, startTimestamp, lastClaimed, staked] = stakeCall.result as [string, bigint, bigint, boolean]

        newItems.push({
          itemId: i,
          creator,
          xpValue,
          resourceUrl,
          mintedAt,
          owner,
          isOnSale,
          salePrice,
          stakeInfo: {
            staker: stakerAddr as `0x${string}`,
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
  }, [userAddress, publicClient, nftMintingPlatform, nftMarketplaceHub, nftStakingPool])

  // ensure approval
  async function ensureApprovalForAll() {
    if (!userAddress || !walletClient || !nftMintingPlatform || !nftStakingPool) return
    try {
      const isApproved = await publicClient?.readContract({
        address: nftMintingPlatform.address as `0x${string}`,
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
      }) as boolean

      if (!isApproved) {
        toast({
          title: "Approval Required",
          description: "Approving staking contract..."
        })
        const hash = await walletClient.writeContract({
          address: nftMintingPlatform.address as `0x${string}`,
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

  // stake
  async function handleStake(item: NFTItem) {
    if (!nftStakingPool || !walletClient || !userAddress || !publicClient) return
    if (item.isOnSale) {
      toast({
        title: "Cannot Stake",
        description: "This NFT is currently listed for sale. Please unlist it first.",
        variant: "destructive"
      })
      return
    }
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

  // unstake
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

  // claim
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
    const stakerIsUser = item.stakeInfo?.staker.toLowerCase() === userAddress.toLowerCase()
    const ownerIsUser = item.owner.toLowerCase() === userAddress.toLowerCase()
    return ownerIsUser || (staked && stakerIsUser)
  })

  function computeUnclaimedXP(item: NFTItem): bigint {
    if (!xpRate) return 0n
    if (!item.stakeInfo?.staked) return 0n
    if (item.stakeInfo.staker.toLowerCase() !== userAddress?.toLowerCase()) return 0n

    const diff = BigInt(currentTime) - item.stakeInfo.lastClaimed
    return diff > 0 ? diff * xpRate : 0n
  }

  const totalUnclaimed = userItems.reduce((acc, item) => acc + computeUnclaimedXP(item), 0n)
  const stakedCount = userItems.filter((item) => item.stakeInfo?.staked).length
  const notStakedCount = userItems.length - stakedCount

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
                  // transform ipfs if needed
                  let displayUrl = item.resourceUrl
                  if (displayUrl.startsWith("ipfs://")) {
                    displayUrl = displayUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
                  }

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

                {selectedNFT.stakeInfo?.staked ? (
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
                    {(() => {
                      const itemTx = txMap[selectedNFT.itemId.toString()] || {}
                      const claimTx = itemTx.claim
                      const unstakeTx = itemTx.unstake

                      return (
                        <>
                          <Button
                            variant="default"
                            className="mt-3 w-full"
                            onClick={() => handleClaim(selectedNFT)}
                            disabled={claimTx?.loading}
                          >
                            {claimTx?.loading ? "Processing..." : "Claim NFT Rewards"}
                          </Button>
                          {showTxStatusBlock(claimTx)}

                          <Button
                            variant="outline"
                            className="mt-3 w-full"
                            onClick={() => handleUnstake(selectedNFT)}
                            disabled={unstakeTx?.loading}
                          >
                            {unstakeTx?.loading ? "Processing..." : "Unstake NFT"}
                          </Button>
                          {showTxStatusBlock(unstakeTx)}
                        </>
                      )
                    })()}
                  </div>
                ) : selectedNFT.isOnSale ? (
                  <p className="text-sm font-bold text-orange-500">
                    This NFT is currently listed for sale. Please unlist it first if you want to stake.
                  </p>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-bold text-orange-600">Not Staked</p>
                    {(() => {
                      const itemTx = txMap[selectedNFT.itemId.toString()] || {}
                      const stakeTx = itemTx.stake
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
                          {showTxStatusBlock(stakeTx)}
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

function showTxStatusBlock(tx?: ActionTxState) {
  if (!tx) return null
  if (tx.loading || tx.success || tx.error) {
    return (
      <div className="rounded-md border border-border p-3 text-xs mt-2">
        <p className="font-bold">Transaction Status:</p>
        {tx.loading && <p className="font-bold text-muted-foreground">Pending...</p>}
        {tx.success && <p className="font-bold text-green-600">Transaction Confirmed!</p>}
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