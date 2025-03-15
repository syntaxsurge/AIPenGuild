'use client'

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAccount, usePublicClient } from "wagmi";
import { Loader2, Gauge, Crown, PieChart, Folder } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useContract } from "@/hooks/use-contract";

/**
 * A helper to map XP to a user "title."
 */
function getUserTitle(xp: bigint | null): string {
  if (xp === null) return "N/A";
  const numericXp = Number(xp);

  if (numericXp >= 5000) return "Legendary Creator";
  if (numericXp >= 3000) return "Master Collector";
  if (numericXp >= 1000) return "Rising Star";
  if (numericXp >= 200)  return "Enthusiast";
  return "Newcomer";
}

export default function DashboardPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { toast } = useToast();

  const aiExperience = useContract("AIExperience");
  const aiNftExchange = useContract("AINFTExchange");

  const [xp, setXp] = useState<bigint | null>(null);
  const [loadingXp, setLoadingXp] = useState(false);

  const [totalMinted, setTotalMinted] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [totalListed, setTotalListed] = useState(0);
  const [loadingItems, setLoadingItems] = useState(false);

  const loadedRef = useRef(false);

  useEffect(() => {
    if (
      !address ||
      !publicClient ||
      !aiExperience?.address ||
      !aiExperience?.abi ||
      !aiNftExchange?.address ||
      !aiNftExchange?.abi
    ) {
      return;
    }

    if (loadedRef.current) return;
    loadedRef.current = true;

    async function fetchAllData() {
      try {
        setLoadingXp(true);
        setLoadingItems(true);

        // Parallel fetch: XP + total item count
        const [userXp, totalItemId] = await Promise.all([
          publicClient?.readContract({
            address: aiExperience?.address as `0x${string}`,
            abi: aiExperience?.abi,
            functionName: "userExperience",
            args: [address],
          }) as Promise<bigint>,
          publicClient?.readContract({
            address: aiNftExchange?.address as `0x${string}`,
            abi: aiNftExchange?.abi,
            functionName: "getLatestItemId",
            args: [],
          }) as Promise<bigint>,
        ]);

        setXp(userXp);

        const totalId = Number(totalItemId);
        let mintedCount = 0;
        let soldCount = 0;
        let listedCount = 0;

        const itemFetches = [];
        for (let i = 1; i <= totalId; i++) {
          itemFetches.push(
            (async () => {
              try {
                const itemIndex = BigInt(i);

                // ownerOf
                const owner = await publicClient?.readContract({
                  address: aiNftExchange?.address as `0x${string}`,
                  abi: aiNftExchange?.abi,
                  functionName: "ownerOf",
                  args: [itemIndex],
                }) as `0x${string}`;

                // itemData => [itemId, creator, xpValue, isOnSale, salePrice, resourceUrl]
                const data = await publicClient?.readContract({
                  address: aiNftExchange?.address as `0x${string}`,
                  abi: aiNftExchange?.abi,
                  functionName: "itemData",
                  args: [itemIndex],
                }) as [bigint, string, bigint, boolean, bigint, string];

                const creator = data[1];
                const isOnSale = data[3];

                // minted by user?
                if (creator.toLowerCase() === address?.toLowerCase()) {
                  mintedCount++;
                  // if user minted it but doesn't currently own => user sold it
                  if (owner.toLowerCase() !== address.toLowerCase()) {
                    soldCount++;
                  }
                }
                // if user owns & isOnSale => user listed it
                if (owner.toLowerCase() === address?.toLowerCase() && isOnSale) {
                  listedCount++;
                }
              } catch {
                // skip invalid items
              }
            })()
          );
        }

        await Promise.all(itemFetches);

        setTotalMinted(mintedCount);
        setTotalSold(soldCount);
        setTotalListed(listedCount);
      } catch (err) {
        console.error("[Dashboard] Error fetching data:", err);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingXp(false);
        setLoadingItems(false);
      }
    }

    fetchAllData();
  }, [address, publicClient, aiExperience, aiNftExchange, toast]);

  const userTitle = getUserTitle(xp);

  if (!address) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-foreground">
        <h1 className="mb-2 text-4xl font-extrabold text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Please connect your wallet to view your dashboard.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-6 md:px-8 bg-background text-foreground">
      {/* Page Title */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-extrabold text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your personal control center for AIPenGuild.
        </p>
      </div>

      {/* Cards in 2x2 Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* XP Card */}
        <Card className="border border-border shadow-md">
          <CardHeader className="p-4 bg-secondary text-secondary-foreground flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">Experience Points</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            {loadingXp ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading XP...</span>
              </div>
            ) : (
              <span className="text-3xl font-bold">
                {xp !== null ? xp.toString() : "0"}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Title Card */}
        <Card className="border border-border shadow-md">
          <CardHeader className="p-4 bg-secondary text-secondary-foreground flex items-center gap-2">
            <Crown className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">Your Title</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            {loadingXp ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Checking title...</span>
              </div>
            ) : (
              <span className="text-2xl font-bold">
                {userTitle}
              </span>
            )}
          </CardContent>
        </Card>

        {/* NFT Stats Card */}
        <Card className="border border-border shadow-md">
          <CardHeader className="p-4 bg-secondary text-secondary-foreground flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">NFT Stats</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingItems ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading stats...</span>
              </div>
            ) : (
              <div className="space-y-2 text-sm sm:text-base">
                <p>
                  <strong>Minted:</strong> {totalMinted}
                </p>
                <p>
                  <strong>Sold:</strong> {totalSold}
                </p>
                <p>
                  <strong>Listed:</strong> {totalListed}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owned NFTs / CTA Card */}
        <Card className="border border-border shadow-md">
          <CardHeader className="p-4 bg-secondary text-secondary-foreground flex items-center gap-2">
            <Folder className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">Owned NFTs</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              View and manage all the NFTs you own.
            </p>
            <Link href="/my-nfts">
              <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                View Owned NFTs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}