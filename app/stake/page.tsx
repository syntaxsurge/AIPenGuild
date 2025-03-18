'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContract } from "@/hooks/use-smart-contract";
import { useToast } from "@/hooks/use-toast-notifications";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

interface NFTItem {
  itemId: bigint;
  creator: string;
  xpValue: bigint;
  isOnSale: boolean;
  salePrice: bigint;
  resourceUrl: string;
  owner: string;
  stakeInfo?: StakeInfo; // optional stake info
}

interface StakeInfo {
  staker: `0x${string}`;
  startTimestamp: bigint;
  lastClaimed: bigint;
  staked: boolean;
}

export default function StakePage() {
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();

  const nftMarketplaceHub = useContract("NFTMarketplaceHub");
  const nftStakingPool = useContract("NFTStakingPool");

  const [allItems, setAllItems] = useState<NFTItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [fetched, setFetched] = useState(false);

  const [txMap, setTxMap] = useState<Record<string, { loading: boolean; success: boolean; error: string | null }>>({});

  // We'll store xpPerSecond from the staking contract (default 0n until loaded).
  const [xpRate, setXpRate] = useState<bigint>(0n);
  // Additional boolean to prevent repeated calls
  const [hasFetchedXpRate, setHasFetchedXpRate] = useState(false);

  // Current time in seconds (for real-time rewards).
  const [currentTime, setCurrentTime] = useState<number>(Math.floor(Date.now() / 1000));

  // Interval ref so we can clear it if needed
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start an interval to update currentTime once per second (for real-time unclaimed XP display).
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 1) Read xpPerSecond from NFTStakingPool only once
  useEffect(() => {
    async function loadXpRate() {
      if (hasFetchedXpRate) return; // skip if we've already fetched
      if (!nftStakingPool?.address || !nftStakingPool.abi || !publicClient) return;

      try {
        const val = await publicClient.readContract({
          address: nftStakingPool.address as `0x${string}`,
          abi: nftStakingPool.abi,
          functionName: "xpPerSecond",
          args: []
        });
        if (typeof val === "bigint") {
          setXpRate(val);
        }
        setHasFetchedXpRate(true);
      } catch (err) {
        console.error("Failed to read xpPerSecond:", err);
      }
    }
    loadXpRate();
  }, [nftStakingPool, publicClient, hasFetchedXpRate]);

  // 2) Fetch all items (nftData, ownerOf, and stake info) via single multicall
  async function fetchAllNFTs(forceReload?: boolean) {
    if (!nftMarketplaceHub?.address || !publicClient || !userAddress || !nftStakingPool?.address) return;
    if (!forceReload && fetched) return;

    setFetched(true);
    setLoadingItems(true);

    try {
      // First read totalItemId
      const totalItemId = await publicClient.readContract({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: nftMarketplaceHub.abi,
        functionName: "getLatestItemId",
        args: []
      }) as bigint;

      if (typeof totalItemId !== "bigint" || totalItemId < 1n) {
        setLoadingItems(false);
        return;
      }

      // Build array of calls in sets of 3: [nftData, ownerOf, stakes]
      const calls = [];
      for (let i = 1n; i <= totalItemId; i++) {
        calls.push({
          address: nftMarketplaceHub.address as `0x${string}`,
          abi: nftMarketplaceHub.abi,
          functionName: "nftData",
          args: [i]
        });
        calls.push({
          address: nftMarketplaceHub.address as `0x${string}`,
          abi: nftMarketplaceHub.abi,
          functionName: "ownerOf",
          args: [i]
        });
        calls.push({
          address: nftStakingPool.address as `0x${string}`,
          abi: nftStakingPool.abi,
          functionName: "stakes",
          args: [i]
        });
      }

      // Execute multicall once
      const multicallResults = await publicClient.multicall({
        contracts: calls,
        allowFailure: true // if some fail, continue
      });

      const newItems: NFTItem[] = [];
      for (let i = 0; i < multicallResults.length; i += 3) {
        const nftDataResult = multicallResults[i];
        const ownerOfResult = multicallResults[i + 1];
        const stakeInfoResult = multicallResults[i + 2];

        if (!nftDataResult.result || !ownerOfResult.result || !stakeInfoResult.result) {
          // If something failed, skip.
          continue;
        }

        const [itemId, creator, xpValue, isOnSale, salePrice, resourceUrl] = nftDataResult.result as [
          bigint,
          string,
          bigint,
          boolean,
          bigint,
          string
        ];
        const owner = ownerOfResult.result as `0x${string}`;
        const [staker, startTimestamp, lastClaimed, staked] = stakeInfoResult.result as [
          `0x${string}`,
          bigint,
          bigint,
          boolean
        ];

        // Build the item
        newItems.push({
          itemId,
          creator,
          xpValue,
          isOnSale,
          salePrice,
          resourceUrl,
          owner,
          stakeInfo: {
            staker,
            startTimestamp,
            lastClaimed,
            staked
          }
        });
      }

      setAllItems(newItems);
    } catch (err) {
      console.error("Error loading items via multicall:", err);
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => {
    // Only fetch once initially or if user changes (and we want to refetch)
    fetchAllNFTs();
  }, [userAddress, nftMarketplaceHub, nftStakingPool, publicClient]);

  // 4) setApprovalForAll so staking pool can transfer from marketplace
  async function ensureApprovalForAll() {
    if (!walletClient || !nftMarketplaceHub?.address || !userAddress) return;
    try {
      // check isApprovedForAll
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
        args: [userAddress, nftStakingPool?.address as `0x${string}`]
      })) as boolean;

      if (!isApproved) {
        toast({
          title: "Approval Required",
          description: "You must first approve the staking contract to transfer your NFTs."
        });
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
          args: [nftStakingPool?.address as `0x${string}`, true],
          account: userAddress
        });
        toast({
          title: "Approval Transaction Sent",
          description: `Tx Hash: ${String(hash)}`
        });
        // Wait for confirmation
        await publicClient?.waitForTransactionReceipt({ hash });
        toast({
          title: "Approved!",
          description: "Staking contract can now transfer your NFTs."
        });
      }
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message || "Could not set approval for all.",
        variant: "destructive"
      });
      throw error;
    }
  }

  // 5) stake/unstake/claim
  async function handleStake(itemId: bigint) {
    if (!nftStakingPool || !walletClient || !userAddress) return;
    setTxMap((prev) => ({
      ...prev,
      [itemId.toString()]: { loading: true, success: false, error: null }
    }));

    try {
      await ensureApprovalForAll();
      toast({ title: "Staking...", description: "Sending transaction..." });
      const hash = await walletClient.writeContract({
        address: nftStakingPool.address as `0x${string}`,
        abi: nftStakingPool.abi,
        functionName: "stakeNFT",
        args: [itemId],
        account: userAddress
      });
      toast({ title: "Transaction Submitted", description: `Tx Hash: ${String(hash)}` });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Stake Complete", description: "Your NFT is now staked." });

      setTxMap((prev) => ({
        ...prev,
        [itemId.toString()]: { loading: false, success: true, error: null }
      }));
      // refresh data
      fetchAllNFTs(true);
    } catch (err: any) {
      setTxMap((prev) => ({
        ...prev,
        [itemId.toString()]: { loading: false, success: false, error: err.message || "Failed to stake NFT" }
      }));
      toast({
        title: "Stake Error",
        description: err.message || "Failed to stake NFT",
        variant: "destructive"
      });
    }
  }

  async function handleUnstake(itemId: bigint) {
    if (!nftStakingPool || !walletClient || !userAddress) return;
    setTxMap((prev) => ({
      ...prev,
      [itemId.toString()]: { loading: true, success: false, error: null }
    }));

    try {
      toast({ title: "Unstaking...", description: "Sending transaction..." });
      const hash = await walletClient.writeContract({
        address: nftStakingPool.address as `0x${string}`,
        abi: nftStakingPool.abi,
        functionName: "unstakeNFT",
        args: [itemId],
        account: userAddress
      });
      toast({ title: "Transaction Submitted", description: `Tx Hash: ${String(hash)}` });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Unstake Complete", description: "Your NFT has been unstaked." });

      setTxMap((prev) => ({
        ...prev,
        [itemId.toString()]: { loading: false, success: true, error: null }
      }));
      // refresh data
      fetchAllNFTs(true);
    } catch (err: any) {
      setTxMap((prev) => ({
        ...prev,
        [itemId.toString()]: { loading: false, success: false, error: err.message || "Failed to unstake NFT" }
      }));
      toast({
        title: "Unstake Error",
        description: err.message || "Failed to unstake NFT",
        variant: "destructive"
      });
    }
  }

  async function handleClaim(itemId: bigint) {
    if (!nftStakingPool || !walletClient || !userAddress) return;
    setTxMap((prev) => ({
      ...prev,
      [itemId.toString()]: { loading: true, success: false, error: null }
    }));

    try {
      toast({ title: "Claiming...", description: "Sending transaction..." });
      const hash = await walletClient.writeContract({
        address: nftStakingPool.address as `0x${string}`,
        abi: nftStakingPool.abi,
        functionName: "claimStakingRewards",
        args: [itemId],
        account: userAddress
      });
      toast({ title: "Transaction Submitted", description: `Tx Hash: ${String(hash)}` });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Claim Success", description: "You claimed staking rewards as XP." });

      setTxMap((prev) => ({
        ...prev,
        [itemId.toString()]: { loading: false, success: true, error: null }
      }));
      // refresh data
      fetchAllNFTs(true);
    } catch (err: any) {
      setTxMap((prev) => ({
        ...prev,
        [itemId.toString()]: { loading: false, success: false, error: err.message || "Failed to claim rewards" }
      }));
      toast({
        title: "Claim Error",
        description: err.message || "Failed to claim rewards",
        variant: "destructive"
      });
    }
  }

  function isStaked(item: NFTItem) {
    return item?.stakeInfo?.staked ?? false;
  }

  // 6) We'll gather the user's items. Include items the user staked (i.e. staker == user) or items the user owns.
  const userItems = allItems.filter((item) => {
    const staked = item?.stakeInfo?.staked;
    const stakerIsUser =
      (item?.stakeInfo?.staker?.toLowerCase() === userAddress?.toLowerCase()) && staked;
    const ownerIsUser = item.owner.toLowerCase() === userAddress?.toLowerCase();
    return ownerIsUser || stakerIsUser;
  });

  // 7) For staked items belonging to user, compute unclaimed XP in the front end with local time
  function computeUnclaimedXP(item: NFTItem): bigint {
    if (!item.stakeInfo || !item.stakeInfo.staked) return 0n;
    if (item.stakeInfo.staker.toLowerCase() !== userAddress?.toLowerCase()) return 0n;
    const diff = BigInt(currentTime) - item.stakeInfo.lastClaimed;
    if (diff <= 0n) return 0n;
    return diff * xpRate;
  }

  // 8) Sum total unclaimed XP across all staked items the user owns
  const totalUnclaimed = userItems.reduce((acc, item) => {
    const unclaimed = computeUnclaimedXP(item);
    return acc + unclaimed;
  }, 0n);

  return (
    <main className="mx-auto max-w-4xl min-h-screen px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <h1 className="text-center text-4xl font-extrabold text-primary mb-6">
        Stake Your NFTs
      </h1>
      <p className="text-center text-sm text-muted-foreground mb-8">
        Lock your NFTs here to earn staking XP over time.
      </p>

      {/* Display total unclaimed for user */}
      <div className="mb-6 text-center">
        <p className="text-lg font-semibold">Your Total Unclaimed Staking Rewards:</p>
        <p className="text-2xl font-extrabold text-primary">
          {totalUnclaimed.toString()} XP
        </p>
      </div>

      {loadingItems ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading your NFTs...</span>
        </div>
      ) : userItems.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">You have no NFTs here.</p>
      ) : (
        <Card className="border border-border">
          <CardHeader className="bg-accent text-accent-foreground p-4 rounded-t-md">
            <CardTitle>Your NFTs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {userItems.map((item) => {
                const staked = isStaked(item);
                let displayUrl = item.resourceUrl;
                if (displayUrl.startsWith("ipfs://")) {
                  displayUrl = displayUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
                }

                const unclaimedXP = computeUnclaimedXP(item);
                const txState = txMap[item.itemId.toString()];

                return (
                  <div
                    key={String(item.itemId)}
                    className="border border-border rounded-md p-2 shadow-sm"
                  >
                    <div className="relative h-32 w-full overflow-hidden rounded-md sm:h-36">
                      <Image
                        src={displayUrl}
                        alt={`NFT #${String(item.itemId)}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-2 text-sm">
                      <p className="font-semibold">Item #{String(item.itemId)}</p>
                      {staked ? (
                        <p className="text-xs text-green-600">Staked</p>
                      ) : (
                        <p className="text-xs text-orange-600">Not Staked</p>
                      )}
                    </div>
                    {staked ? (
                      <div className="mt-2">
                        <p className="text-sm">Unclaimed XP:</p>
                        <p className="font-bold text-primary">{unclaimedXP.toString()} XP</p>
                      </div>
                    ) : null}

                    {staked ? (
                      <div className="mt-3 flex flex-col gap-2">
                        <Button onClick={() => handleClaim(item.itemId)}>
                          {txState?.loading
                            ? "Processing..."
                            : "Claim Rewards"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleUnstake(item.itemId)}
                          disabled={!!txState?.loading}
                        >
                          {txState?.loading
                            ? "Processing..."
                            : "Unstake"}
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <Button
                          onClick={() => handleStake(item.itemId)}
                          disabled={!!txState?.loading}
                        >
                          {txState?.loading
                            ? "Processing..."
                            : "Stake"}
                        </Button>
                      </div>
                    )}

                    {/* Only show transaction status if there's an active transaction or result */}
                    {(txState?.loading || txState?.success || txState?.error) && (
                      <div className="rounded-md border border-border p-4 mt-2 text-sm">
                        <p className="font-medium">Transaction Status:</p>
                        {txState.loading && (
                          <p className="text-muted-foreground">Pending confirmation...</p>
                        )}
                        {txState.success && (
                          <p className="text-green-600">Transaction Confirmed!</p>
                        )}
                        {txState.error && (
                          <p className="font-bold text-orange-600 dark:text-orange-500">
                            Transaction Failed: {txState.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}