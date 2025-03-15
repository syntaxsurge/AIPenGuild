'use client'

import React, { useState, useEffect, useRef } from "react";
import { useAccount, usePublicClient } from "wagmi";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useContract } from "@/hooks/use-contract";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AIItem {
  itemId: bigint;
  creator: string;
  xpValue: bigint;
  isOnSale: boolean;
  salePrice: bigint;
  resourceUrl: string;
  owner: string; // Guaranteed to exist
}

export default function DashboardPage() {
  const { address } = useAccount();
  const { toast } = useToast();
  const publicClient = usePublicClient();

  const aiExperience = useContract("AIExperience");
  const aiNftExchange = useContract("AINFTExchange");

  const [xp, setXp] = useState<bigint | null>(null);
  const [loadingXp, setLoadingXp] = useState(true);

  const [totalMinted, setTotalMinted] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [totalListed, setTotalListed] = useState(0);
  const [loadingItems, setLoadingItems] = useState(true);

  const fetchedItemsRef = useRef(false);

  useEffect(() => {
    // 1) Fetch XP from AIExperience
    async function fetchXp() {
      if (!address || !aiExperience?.address || !aiExperience?.abi || !publicClient) {
        setLoadingXp(false);
        return;
      }
      try {
        setLoadingXp(true);
        const userXp = await publicClient.readContract({
          address: aiExperience.address as `0x${string}`,
          abi: aiExperience.abi,
          functionName: "userExperience",
          args: [address]
        }) as bigint;
        setXp(userXp);
      } catch (err) {
        console.error("[Dashboard] Error fetching user XP:", err);
        toast({
          title: "Error",
          description: "Failed to fetch XP. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoadingXp(false);
      }
    }

    fetchXp();
  }, [address, aiExperience, publicClient, toast]);

  // 2) Summaries from AINFTExchange:
  // We'll check how many the user minted, how many they sold, and how many they've currently listed.
  useEffect(() => {
    async function fetchItemStats() {
      if (!address || !aiNftExchange?.address || !aiNftExchange?.abi || !publicClient) {
        setLoadingItems(false);
        return;
      }
      try {
        if (fetchedItemsRef.current) return;
        fetchedItemsRef.current = true;
        setLoadingItems(true);

        // get total itemId
        const latestItemId = await publicClient.readContract({
          address: aiNftExchange.address as `0x\${string}`,
          abi: aiNftExchange.abi,
          functionName: "getLatestItemId",
          args: []
        }) as bigint;
        const total = Number(latestItemId);

        let minted = 0;
        let sold = 0;
        let listed = 0;

        for (let i = 1; i <= total; i++) {
          try {
            const itemIndex = BigInt(i);
            const data = await publicClient.readContract({
              address: aiNftExchange.address as `0x${string}`,
              abi: aiNftExchange.abi,
              functionName: "itemData",
              args: [itemIndex]
            }) as [bigint, string, bigint, boolean, bigint, string];

            const owner = await publicClient.readContract({
              address: aiNftExchange.address as `0x${string}`,
              abi: aiNftExchange.abi,
              functionName: "ownerOf",
              args: [itemIndex]
            }) as `0x${string}`;

            const item: AIItem = {
              itemId: data[0],
              creator: data[1],
              xpValue: data[2],
              isOnSale: data[3],
              salePrice: data[4],
              resourceUrl: data[5],
              owner
            };

            // minted by user
            if (item.creator.toLowerCase() === address.toLowerCase()) {
              minted++;
              // if minted by user but does not belong to user => user sold it
              if (item.owner.toLowerCase() !== address.toLowerCase()) {
                sold++;
              }
            }
            // if user is the owner & the item is for sale => user has it listed
            if (
              item.owner.toLowerCase() === address.toLowerCase() &&
              item.isOnSale
            ) {
              listed++;
            }
          } catch (_err) {
            // skip
          }
        }

        setTotalMinted(minted);
        setTotalSold(sold);
        setTotalListed(listed);
      } catch (err) {
        console.error("[Dashboard] Error fetching item stats:", err);
        toast({
          title: "Error",
          description: "Failed to fetch item stats. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoadingItems(false);
      }
    }

    fetchItemStats();
  }, [address, aiNftExchange, publicClient, toast]);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-6 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <h1 className="mb-6 text-center text-4xl font-extrabold text-primary">Dashboard</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Your personal control center for AIPenGuild.
      </p>

      {!address ? (
        <p className="text-center text-sm text-muted-foreground">
          Please connect your wallet to view your dashboard.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Card: XP */}
          <Card className="border border-border bg-background shadow-sm">
            <CardHeader className="p-4 bg-accent text-accent-foreground">
              <CardTitle className="text-base font-semibold">Your Experience Points (XP)</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loadingXp ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading XP...
                </div>
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {xp ? xp.toString() : "0"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Minted & Sold */}
          <Card className="border border-border bg-background shadow-sm">
            <CardHeader className="p-4 bg-accent text-accent-foreground">
              <CardTitle className="text-base font-semibold">Your Minted & Sold NFTs</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loadingItems ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating stats...
                </div>
              ) : (
                <div className="space-y-1">
                  <p>
                    <strong>Minted:</strong> {totalMinted}
                  </p>
                  <p>
                    <strong>Sold:</strong> {totalSold}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Listed NFTs */}
          <Card className="border border-border bg-background shadow-sm">
            <CardHeader className="p-4 bg-accent text-accent-foreground">
              <CardTitle className="text-base font-semibold">Your Listed NFTs</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loadingItems ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking listings...
                </div>
              ) : (
                <p className="text-lg font-bold text-primary">{totalListed}</p>
              )}
            </CardContent>
          </Card>

          {/* Card: My NFTs link */}
          <Card className="border border-border bg-background shadow-sm">
            <CardHeader className="p-4 bg-accent text-accent-foreground">
              <CardTitle className="text-base font-semibold">View Owned NFTs</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Link href="/my-nfts">
                <Button variant="outline" className="w-full">
                  Go to My NFTs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}