"use client";

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
  owner?: string;
}

export default function DashboardPage() {
  const { address } = useAccount();
  const { toast } = useToast();
  const publicClient = usePublicClient();

  const aiExperience = useContract("AIExperience");
  const aiNftExchange = useContract("AINFTExchange");

  const [xp, setXp] = useState<bigint | null>(null);
  const [loadingXp, setLoadingXp] = useState(false);

  const [totalMinted, setTotalMinted] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [totalListed, setTotalListed] = useState(0);
  const [loadingItems, setLoadingItems] = useState(false);

  // We unify fetching both XP and minted/sold items in a single effect
  // so they can load in parallel. We'll run this once when we have
  // address + contracts.
  const loadedRef = useRef(false);

  useEffect(() => {
    // If any are missing, just skip or return
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

        // We'll fetch XP and item stats in parallel
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

        setXp(userXp); // user XP

        // fetch minted/sold/listed
        const totalId = Number(totalItemId);
        let minted = 0;
        let sold = 0;
        let listed = 0;

        const itemPromises = [];
        for (let i = 1; i <= totalId; i++) {
          itemPromises.push(
            (async () => {
              try {
                const itemIndex = BigInt(i);

                // get owner
                const owner = await publicClient?.readContract({
                  address: aiNftExchange?.address as `0x${string}`,
                  abi: aiNftExchange?.abi,
                  functionName: "ownerOf",
                  args: [itemIndex],
                }) as `0x${string}`;

                // get itemData => [itemId, creator, xpValue, isOnSale, salePrice, resourceUrl]
                const data = await publicClient?.readContract({
                  address: aiNftExchange?.address as `0x${string}`,
                  abi: aiNftExchange?.abi,
                  functionName: "itemData",
                  args: [itemIndex],
                }) as [bigint, string, bigint, boolean, bigint, string];

                const item: AIItem = {
                  itemId: data[0],
                  creator: data[1],
                  xpValue: data[2],
                  isOnSale: data[3],
                  salePrice: data[4],
                  resourceUrl: data[5],
                  owner,
                };

                // check if minted by user => item.creator
                if (
                  item.creator?.toLowerCase() === address?.toLowerCase()
                ) {
                  minted++;
                  // if minted by user but user no longer owns => user sold it
                  if (item.owner?.toLowerCase() !== address?.toLowerCase()) {
                    sold++;
                  }
                }
                // if user owns the item AND it's on sale
                if (
                  item.owner?.toLowerCase() === address?.toLowerCase() &&
                  item.isOnSale
                ) {
                  listed++;
                }
              } catch {
                // skip invalid items
              }
            })()
          );
        }

        await Promise.all(itemPromises);

        setTotalMinted(minted);
        setTotalSold(sold);
        setTotalListed(listed);
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
  }, [address, aiExperience, aiNftExchange, publicClient, toast]);

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
          {/* XP Card */}
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
                  {xp !== null ? xp.toString() : "0"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Minted & Sold */}
          <Card className="border border-border bg-background shadow-sm">
            <CardHeader className="p-4 bg-accent text-accent-foreground">
              <CardTitle className="text-base font-semibold">Your Minted & Sold NFTs</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loadingItems ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading minted & sold...
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

          {/* Listed */}
          <Card className="border border-border bg-background shadow-sm">
            <CardHeader className="p-4 bg-accent text-accent-foreground">
              <CardTitle className="text-base font-semibold">Your Listed NFTs</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loadingItems ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading listed NFTs...
                </div>
              ) : (
                <p className="text-lg font-bold text-primary">{totalListed}</p>
              )}
            </CardContent>
          </Card>

          {/* My NFTs link */}
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