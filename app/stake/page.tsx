"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContract } from "@/hooks/use-smart-contract";
import { useToast } from "@/hooks/use-toast-notifications";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

interface NFTItem {
  itemId: bigint;
  creator: string;
  xpValue: bigint;
  isOnSale: boolean;
  salePrice: bigint;
  resourceUrl: string;
  owner: string;
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

  // We'll store stake info for each itemId
  const [stakeInfoMap, setStakeInfoMap] = useState<Record<string, StakeInfo>>({});
  // New state for transaction statuses
  const [txMap, setTxMap] = useState<Record<string, { loading: boolean; success: boolean; error: string | null }>>({});

  // 1) Fetch all item data from the marketplace
  async function fetchData(forceReload?: boolean) {
    if (!nftMarketplaceHub || !publicClient || !userAddress) return;
    if (!forceReload && fetched) return;
    setFetched(true);
    setLoadingItems(true);

    try {
      // read the total count
      const totalItemId = await publicClient.readContract({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: nftMarketplaceHub.abi,
        functionName: "getLatestItemId",
        args: [],
      });
      if (typeof totalItemId !== "bigint") {
        setLoadingItems(false);
        return;
      }

      const newItems: NFTItem[] = [];
      for (let i = 1n; i <= totalItemId; i++) {
        try {
          // read item data
          const data = await publicClient.readContract({
            address: nftMarketplaceHub.address as `0x${string}`,
            abi: nftMarketplaceHub.abi,
            functionName: "nftData",
            args: [i],
          }) as [bigint, string, bigint, boolean, bigint, string];

          // read owner
          const owner = await publicClient.readContract({
            address: nftMarketplaceHub.address as `0x${string}`,
            abi: nftMarketplaceHub.abi,
            functionName: "ownerOf",
            args: [i],
          }) as `0x${string}`;

          newItems.push({
            itemId: data[0],
            creator: data[1],
            xpValue: data[2],
            isOnSale: data[3],
            salePrice: data[4],
            resourceUrl: data[5],
            owner,
          });
        } catch {
          // skip any invalid items
        }
      }
      setAllItems(newItems);
    } catch (err) {
      console.error("Error loading items:", err);
    } finally {
      setLoadingItems(false);
    }
  }

  // 2) For each item, read stake info if any
  async function fetchStakeInfo(itemId: bigint) {
    if (!nftStakingPool || !publicClient) return null;
    try {
      const stakeInfo = await publicClient.readContract({
        address: nftStakingPool.address as `0x${string}`,
        abi: nftStakingPool.abi,
        functionName: "stakes",
        args: [itemId],
      }) as [string, bigint, bigint, boolean];

      return {
        staker: stakeInfo[0] as `0x${string}`,
        startTimestamp: stakeInfo[1],
        lastClaimed: stakeInfo[2],
        staked: stakeInfo[3],
      };
    } catch {
      return null;
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress, nftMarketplaceHub, publicClient]);

  useEffect(() => {
    async function checkAllStakes() {
      const map: Record<string, StakeInfo> = {};
      for (const nft of allItems) {
        const info = await fetchStakeInfo(nft.itemId);
        if (info) {
          map[nft.itemId.toString()] = info;
        }
      }
      setStakeInfoMap(map);
    }
    if (allItems.length > 0) {
      checkAllStakes();
    }
  }, [allItems, nftStakingPool, publicClient]);

  // Helper: setApprovalForAll on the marketplace so that the staking pool can transfer NFTs
  async function ensureApprovalForAll() {
    if (!walletClient || !nftMarketplaceHub?.address || !userAddress) return;
    try {
      // Check isApprovedForAll first
      const isApproved = await publicClient?.readContract({
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
      }) as boolean;

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
          description: `Hash: ${String(hash)}`
        });
        // Wait for the transaction to confirm
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

  // 3) Helpers for stake / unstake / claim using walletClient
  async function handleStake(itemId: bigint) {
    if (!nftStakingPool || !walletClient || !userAddress) return;
    // Set tx state to loading
    setTxMap((prev) => ({
      ...prev,
      [itemId.toString()]: { loading: true, success: false, error: null },
    }));

    try {
      // Ensure that we have setApprovalForAll
      await ensureApprovalForAll();

      toast({ title: "Staking...", description: "Sending transaction..." });
      const hash = await walletClient.writeContract({
        address: nftStakingPool.address as `0x\${string}`,
        abi: nftStakingPool.abi,
        functionName: "stakeNFT",
        args: [itemId],
        account: userAddress as `0x\${string}`,
      });
      toast({ title: "Transaction Submitted", description: `Hash: \${String(hash)}` });

      // Wait for receipt
      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Stake Complete", description: "Your NFT is staked." });

      // On success
      setTxMap((prev) => ({
        ...prev,
        [itemId.toString()]: { loading: false, success: true, error: null },
      }));
      fetchData(true);
    } catch (err: any) {
      // On error
      setTxMap((prev) => ({
        ...prev,
        [itemId.toString()]: { loading: false, success: false, error: err.message || "Failed to stake NFT" },
      }));
      toast({
        title: "Stake Error",
        description: err.message || "Failed to stake NFT",
        variant: "destructive",
      });
    }
  }

  async function handleUnstake(itemId: bigint) {
    if (!nftStakingPool || !walletClient || !userAddress) return;

    // Set tx state to loading
    setTxMap((prev) => ({
      ...prev,
      [itemId.toString()]: { loading: true, success: false, error: null },
    }));

    try {
      toast({ title: "Unstaking...", description: "Sending transaction..." });
      const hash = await walletClient.writeContract({
        address: nftStakingPool.address as `0x\${string}`,
        abi: nftStakingPool.abi,
        functionName: "unstakeNFT",
        args: [itemId],
        account: userAddress as `0x\${string}`,
      });
      toast({ title: "Transaction Submitted", description: `Hash: \${String(hash)}` });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Unstake Complete", description: "Your NFT is now unstaked." });

      // On success
      setTxMap((prev) => ({
        ...prev,
        [itemId.toString()]: { loading: false, success: true, error: null },
      }));
      fetchData(true);
    } catch (err: any) {
      // On error
      setTxMap((prev) => ({
        ...prev,
        [itemId.toString()]: { loading: false, success: false, error: err.message || "Failed to unstake NFT" },
      }));
      toast({
        title: "Unstake Error",
        description: err.message || "Failed to unstake NFT",
        variant: "destructive",
      });
    }
  }

  async function handleClaim(itemId: bigint) {
    if (!nftStakingPool || !walletClient || !userAddress) return;

    // Set tx state to loading
    setTxMap((prev) => ({
      ...prev,
      [itemId.toString()]: { loading: true, success: false, error: null },
    }));

    try {
      toast({ title: "Claiming...", description: "Sending transaction..." });
      const hash = await walletClient.writeContract({
        address: nftStakingPool.address as `0x\${string}`,
        abi: nftStakingPool.abi,
        functionName: "claimStakingRewards",
        args: [itemId],
        account: userAddress as `0x\${string}`,
      });
      toast({ title: "Transaction Submitted", description: `Hash: \${String(hash)}` });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Claim Success", description: "You claimed staking rewards as XP." });

      // On success
      setTxMap((prev) => ({
        ...prev,
        [itemId.toString()]: { loading: false, success: true, error: null },
      }));
      fetchData(true);
    } catch (err: any) {
      // On error
      setTxMap((prev) => ({
        ...prev,
        [itemId.toString()]: { loading: false, success: false, error: err.message || "Failed to claim rewards" },
      }));
      toast({
        title: "Claim Error",
        description: err.message || "Failed to claim rewards",
        variant: "destructive",
      });
    }
  }

  function isStaked(itemId: bigint) {
    const info = stakeInfoMap[itemId.toString()];
    return !!(info && info.staked);
  }

  const userItems = allItems.filter(
    (item) => item.owner.toLowerCase() === userAddress?.toLowerCase()
  );

  return (
    <main className="mx-auto max-w-4xl min-h-screen px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <h1 className="text-center text-4xl font-extrabold text-primary mb-6">
        Stake Your NFTs
      </h1>
      <p className="text-center text-sm text-muted-foreground mb-8">
        Lock your NFTs here to earn staking XP over time.
      </p>

      {loadingItems ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading your NFTs...</span>
        </div>
      ) : userItems.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">You have no NFTs.</p>
      ) : (
        <Card className="border border-border">
          <CardHeader className="bg-accent text-accent-foreground p-4 rounded-t-md">
            <CardTitle>Your NFTs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {userItems.map((item) => {
                const staked = isStaked(item.itemId);
                let displayUrl = item.resourceUrl;
                if (displayUrl.startsWith("ipfs://")) {
                  displayUrl = displayUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
                }

                return (
                  <div key={String(item.itemId)} className="border border-border rounded-md p-2 shadow-sm">
                    <div className="relative h-32 w-full overflow-hidden rounded-md sm:h-36">
                      <Image
                        src={displayUrl}
                        alt={`NFT #\${String(item.itemId)}`}
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
                      <div className="mt-3 flex flex-col gap-2">
                        <Button onClick={() => handleClaim(item.itemId)}>
                          Claim Rewards
                        </Button>
                        <Button variant="outline" onClick={() => handleUnstake(item.itemId)}>
                          Unstake
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <Button onClick={() => handleStake(item.itemId)}>
                          Stake
                        </Button>
                      </div>
                    )}

                    <div className="rounded-md border border-border p-4 mt-2 text-sm">
                      <p className="font-medium">Transaction Status:</p>
                      {txMap[item.itemId.toString()]?.loading && <p className="text-muted-foreground">Pending confirmation...</p>}
                      {txMap[item.itemId.toString()]?.success && <p className="text-green-600">Transaction Confirmed!</p>}
                      {txMap[item.itemId.toString()]?.error && (
                        <p className="font-bold text-orange-600 dark:text-orange-500">
                          Transaction Failed: {txMap[item.itemId.toString()]?.error}
                        </p>
                      )}
                    </div>
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