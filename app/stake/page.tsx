'use client'

import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TransactionButton } from '@/components/ui/TransactionButton'
import { TransactionStatus } from '@/components/ui/TransactionStatus'
import { useContract } from '@/hooks/use-smart-contract'
import { useToast } from '@/hooks/use-toast-notifications'
import { useTransactionState } from '@/hooks/use-transaction-state'
import { transformIpfsUriToHttp } from '@/lib/ipfs'
import { fetchAllNFTs, NFTItem } from '@/lib/nft-data'
import { fetchNftMetadata, ParsedNftMetadata } from '@/lib/nft-metadata'
import { cn } from '@/lib/utils'

export default function StakePage() {
  const { address: userAddress } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { toast } = useToast()
  const chainId = useChainId() || 1287

  const nftMarketplaceHub = useContract('NFTMarketplaceHub')
  const nftMintingPlatform = useContract('NFTMintingPlatform')
  const nftStakingPool = useContract('NFTStakingPool')

  // XP rate
  const [xpPerSecond, setXpPerSecond] = useState<bigint>(1n)
  const [hasFetchedXpRate, setHasFetchedXpRate] = useState(false)

  // Data
  const [allItems, setAllItems] = useState<NFTItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)

  // We'll keep separate transaction states for each action
  const stakeTx = useTransactionState()
  const claimTx = useTransactionState()
  const unstakeTx = useTransactionState()

  const [metadataMap, setMetadataMap] = useState<Record<string, ParsedNftMetadata>>({})
  const [currentTime, setCurrentTime] = useState<number>(Math.floor(Date.now() / 1000))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // 1) fetch xpPerSecond once
  useEffect(() => {
    async function loadXpRate() {
      if (hasFetchedXpRate) return
      if (!publicClient || !nftStakingPool?.address || !nftStakingPool?.abi) return
      try {
        const val = await publicClient.readContract({
          address: nftStakingPool.address as `0x${string}`,
          abi: nftStakingPool.abi,
          functionName: 'xpPerSecond',
          args: [],
        })
        if (typeof val === 'bigint') {
          setXpPerSecond(val)
        }
        setHasFetchedXpRate(true)
      } catch (err) {
        console.error('Failed to read xpPerSecond:', err)
      }
    }
    loadXpRate()
  }, [publicClient, nftStakingPool, hasFetchedXpRate])

  async function fetchAllData(forceReload?: boolean) {
    if (
      !userAddress ||
      !publicClient ||
      !nftMintingPlatform ||
      !nftMarketplaceHub ||
      !nftStakingPool
    )
      return
    if (!forceReload && fetched) return

    setFetched(true)
    setLoadingItems(true)
    try {
      const nfts = await fetchAllNFTs(
        publicClient,
        nftMintingPlatform,
        nftMarketplaceHub,
        nftStakingPool,
      )
      setAllItems(nfts)

      // Preload metadata for user items only
      const userNfts = nfts.filter((item) => {
        const staked =
          item.stakeInfo?.staked &&
          item.stakeInfo.staker.toLowerCase() === userAddress.toLowerCase()
        const owned = item.owner.toLowerCase() === userAddress.toLowerCase()
        return staked || owned
      })
      const newMap = { ...metadataMap }
      for (const item of userNfts) {
        const itemIdStr = String(item.itemId)
        if (!newMap[itemIdStr]) {
          try {
            const meta = await fetchNftMetadata(item.resourceUrl)
            newMap[itemIdStr] = meta
          } catch {
            newMap[itemIdStr] = {
              imageUrl: transformIpfsUriToHttp(item.resourceUrl),
              name: '',
              description: '',
              attributes: {},
            }
          }
        }
      }
      setMetadataMap(newMap)
    } catch (err) {
      console.error('Error loading items via fetchAllNFTs:', err)
      toast({
        title: 'Error',
        description: 'Unable to fetch your NFTs. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoadingItems(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [userAddress, nftStakingPool, nftMarketplaceHub, nftMintingPlatform, publicClient])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  function userItems() {
    if (!userAddress) return []
    return allItems.filter((item) => {
      const staked =
        item.stakeInfo?.staked && item.stakeInfo.staker.toLowerCase() === userAddress.toLowerCase()
      const owned = item.owner.toLowerCase() === userAddress.toLowerCase()
      return staked || owned
    })
  }

  function computeUnclaimedXP(item: NFTItem): bigint {
    if (!xpPerSecond) return 0n
    if (!item.stakeInfo?.staked) return 0n
    if (item.stakeInfo.staker.toLowerCase() !== userAddress?.toLowerCase()) return 0n

    const diff = BigInt(currentTime) - item.stakeInfo.lastClaimed
    return diff > 0 ? diff * xpPerSecond : 0n
  }

  async function ensureApprovalForAll() {
    if (!userAddress || !walletClient || !nftMintingPlatform || !nftStakingPool) return

    try {
      const isApproved = (await publicClient?.readContract({
        address: nftMintingPlatform.address as `0x${string}`,
        abi: [
          {
            name: 'isApprovedForAll',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'operator', type: 'address' },
            ],
            outputs: [{ name: '', type: 'bool' }],
          },
        ],
        functionName: 'isApprovedForAll',
        args: [userAddress, nftStakingPool.address as `0x${string}`],
      })) as boolean

      if (!isApproved) {
        toast({
          title: 'Approval Required',
          description: 'Approving staking contract...',
        })
        const minimalABI = [
          {
            name: 'setApprovalForAll',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'operator', type: 'address' },
              { name: 'approved', type: 'bool' },
            ],
            outputs: [],
          },
        ]
        const hash = await walletClient.writeContract({
          address: nftMintingPlatform.address as `0x${string}`,
          abi: minimalABI,
          functionName: 'setApprovalForAll',
          args: [nftStakingPool.address as `0x${string}`, true],
          account: userAddress,
        })
        toast({
          title: 'Approval Tx Sent',
          description: `Hash: ${String(hash)}`,
        })
        await publicClient?.waitForTransactionReceipt({ hash })
        toast({
          title: 'Approved!',
          description: 'Staking contract can now manage your NFTs.',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Approval Failed',
        description: err.message || 'Could not set approval for all.',
        variant: 'destructive',
      })
      throw err
    }
  }

  async function handleStake(item: NFTItem) {
    if (!nftStakingPool || !walletClient || !userAddress || !publicClient) return
    if (item.isOnSale) {
      toast({
        title: 'Cannot Stake',
        description: 'This NFT is currently listed for sale. Please unlist it first.',
        variant: 'destructive',
      })
      return
    }

    stakeTx.start()
    try {
      await ensureApprovalForAll()
      toast({ title: 'Staking...', description: 'Sending transaction...' })
      const hash = await walletClient.writeContract({
        address: nftStakingPool.address as `0x${string}`,
        abi: nftStakingPool.abi,
        functionName: 'stakeNFT',
        args: [item.itemId],
        account: userAddress,
      })
      stakeTx.start(hash)

      toast({ title: 'Transaction Submitted', description: `Tx Hash: ${String(hash)}` })
      await publicClient.waitForTransactionReceipt({ hash })

      toast({ title: 'Stake Complete', description: 'Your NFT is now staked.' })
      stakeTx.success(hash)
      fetchAllData(true)
    } catch (err: any) {
      stakeTx.fail(err.message || 'Failed to stake NFT')
      toast({
        title: 'Stake Error',
        description: err.message || 'Failed to stake NFT',
        variant: 'destructive',
      })
    }
  }

  async function handleClaim(item: NFTItem) {
    if (!nftStakingPool || !walletClient || !userAddress || !publicClient) return

    claimTx.start()
    try {
      toast({ title: 'Claiming...', description: 'Sending transaction...' })
      const hash = await walletClient.writeContract({
        address: nftStakingPool.address as `0x${string}`,
        abi: nftStakingPool.abi,
        functionName: 'claimStakingRewards',
        args: [item.itemId],
        account: userAddress,
      })
      claimTx.start(hash)

      toast({ title: 'Transaction Submitted', description: `Tx Hash: ${String(hash)}` })
      await publicClient.waitForTransactionReceipt({ hash })

      toast({ title: 'Claim Success', description: 'You claimed staking rewards as XP.' })
      claimTx.success(hash)
      fetchAllData(true)
    } catch (err: any) {
      claimTx.fail(err.message || 'Failed to claim rewards')
      toast({
        title: 'Claim Error',
        description: err.message || 'Failed to claim rewards',
        variant: 'destructive',
      })
    }
  }

  async function handleUnstake(item: NFTItem) {
    if (!nftStakingPool || !walletClient || !userAddress || !publicClient) return

    unstakeTx.start()
    try {
      toast({ title: 'Unstaking...', description: 'Sending transaction...' })
      const hash = await walletClient.writeContract({
        address: nftStakingPool.address as `0x${string}`,
        abi: nftStakingPool.abi,
        functionName: 'unstakeNFT',
        args: [item.itemId],
        account: userAddress,
      })
      unstakeTx.start(hash)

      toast({ title: 'Transaction Submitted', description: `Tx Hash: ${String(hash)}` })
      await publicClient.waitForTransactionReceipt({ hash })

      toast({ title: 'Unstake Complete', description: 'Your NFT has been unstaked.' })
      unstakeTx.success(hash)
      fetchAllData(true)
    } catch (err: any) {
      unstakeTx.fail(err.message || 'Failed to unstake NFT')
      toast({
        title: 'Unstake Error',
        description: err.message || 'Failed to unstake NFT',
        variant: 'destructive',
      })
    }
  }

  if (!userAddress) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center bg-background p-8 text-foreground'>
        <h1 className='mb-2 text-4xl font-extrabold text-primary'>Stake NFTs</h1>
        <p className='text-sm text-muted-foreground'>Please connect your wallet.</p>
      </main>
    )
  }

  const stakedCount = userItems().filter((i) => i.stakeInfo?.staked).length
  const notStakedCount = userItems().length - stakedCount
  const totalUnclaimed = userItems().reduce((acc, item) => acc + computeUnclaimedXP(item), 0n)

  return (
    <main className='mx-auto min-h-screen w-full bg-background px-4 py-12 text-foreground sm:px-6 md:px-8'>
      <div className='mb-6 text-center'>
        <h1 className='text-4xl font-extrabold text-primary'>Stake Your NFTs</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Enjoy extra XP rewards by staking your NFTs on AIPenGuild.
        </p>
      </div>

      <Card className='mb-6 rounded-lg border border-border shadow-sm'>
        <CardHeader className='rounded-t-lg bg-secondary p-4 text-secondary-foreground'>
          <CardTitle className='text-base font-semibold'>Staking Overview</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 p-6 text-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Total NFTs (recognized):</span>
            <span className='font-semibold'>{userItems().length}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Staked NFTs:</span>
            <span className='font-semibold'>{stakedCount}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Not Staked:</span>
            <span className='font-semibold'>{notStakedCount}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Staking Rate (XP/sec):</span>
            <span className='font-semibold'>{xpPerSecond.toString()}</span>
          </div>
          <hr className='my-3 border-border' />
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Total Unclaimed XP:</span>
            <span className='text-2xl font-extrabold text-primary'>
              {totalUnclaimed.toString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* Owned/Staked NFTs */}
        <Card className='rounded-lg border border-border shadow-sm'>
          <CardHeader className='rounded-t-lg bg-accent p-4 text-accent-foreground'>
            <CardTitle className='text-base font-semibold'>Your NFTs</CardTitle>
          </CardHeader>
          <CardContent className='p-4'>
            {loadingItems ? (
              <div className='flex items-center justify-center gap-2 py-4'>
                <Loader2 className='h-5 w-5 animate-spin' />
                <span className='text-sm'>Loading NFTs...</span>
              </div>
            ) : userItems().length === 0 ? (
              <p className='text-sm text-muted-foreground'>You have no NFTs in your wallet.</p>
            ) : (
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                {userItems().map((nft) => {
                  const itemIdStr = String(nft.itemId)
                  const meta = metadataMap[itemIdStr] || {
                    imageUrl: transformIpfsUriToHttp(nft.resourceUrl),
                    name: '',
                    description: '',
                    attributes: {},
                  }
                  let label = ''
                  if (nft.stakeInfo?.staked) {
                    label = '(STAKED)'
                  } else if (nft.isOnSale) {
                    label = '(LISTED)'
                  }
                  const selected = selectedNFT?.itemId === nft.itemId

                  return (
                    <div
                      key={String(nft.itemId)}
                      onClick={() => setSelectedNFT(nft)}
                      className={cn(
                        'cursor-pointer rounded-md border p-2 transition hover:shadow',
                        selected ? 'border-primary' : 'border-border',
                      )}
                    >
                      <div className='relative h-24 w-full overflow-hidden rounded bg-secondary sm:h-28'>
                        <Image
                          src={meta.imageUrl}
                          alt={`NFT #${String(nft.itemId)}`}
                          fill
                          sizes='(max-width: 768px) 100vw,
                                 (max-width: 1200px) 50vw,
                                 33vw'
                          className='object-cover'
                        />
                      </div>
                      <p className='mt-1 line-clamp-1 text-xs font-semibold text-foreground'>
                        {meta.name ? meta.name : `NFT #${String(nft.itemId)}`} {label}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected NFT */}
        <Card className='rounded-lg border border-border shadow-sm'>
          <CardHeader className='rounded-t-lg bg-secondary p-4 text-secondary-foreground'>
            <CardTitle className='text-base font-semibold'>
              {selectedNFT ? `NFT #${String(selectedNFT.itemId)}` : 'Select an NFT'}
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4'>
            {!selectedNFT ? (
              <p className='text-sm text-muted-foreground'>
                Please select an NFT from the left panel.
              </p>
            ) : (
              <div className='space-y-4'>
                {(() => {
                  const itemIdStr = String(selectedNFT.itemId)
                  const meta = metadataMap[itemIdStr] || {
                    imageUrl: transformIpfsUriToHttp(selectedNFT.resourceUrl),
                    name: '',
                    description: '',
                    attributes: {},
                  }
                  return (
                    <div className='relative h-96 w-full overflow-hidden rounded-md border border-border bg-secondary'>
                      <Image
                        src={meta.imageUrl}
                        alt={`NFT #${String(selectedNFT.itemId)}`}
                        fill
                        sizes='(max-width: 768px) 100vw,
                               (max-width: 1200px) 50vw,
                               33vw'
                        className='object-contain'
                      />
                    </div>
                  )
                })()}

                {selectedNFT.stakeInfo?.staked ? (
                  <div className='text-sm'>
                    <span className='font-bold text-green-600'>Staked</span> since{' '}
                    <span className='font-bold text-foreground'>
                      {new Date(
                        Number(selectedNFT.stakeInfo?.startTimestamp) * 1000,
                      ).toLocaleString()}
                    </span>
                    .
                    <div className='mt-2 text-muted-foreground'>
                      <span>Unclaimed XP:&nbsp;</span>
                      <span className='text-2xl font-extrabold text-primary'>
                        {computeUnclaimedXP(selectedNFT).toString()}
                      </span>
                    </div>
                    <TransactionButton
                      isLoading={claimTx.isProcessing}
                      loadingText='Processing...'
                      onClick={() => handleClaim(selectedNFT)}
                      className='mt-3 w-full'
                    >
                      Claim NFT Rewards
                    </TransactionButton>
                    <TransactionStatus
                      isLoading={claimTx.isProcessing}
                      isSuccess={claimTx.isSuccess}
                      errorMessage={claimTx.error || undefined}
                      txHash={claimTx.txHash || undefined}
                      chainId={chainId}
                      className='mt-2'
                    />
                    <TransactionButton
                      isLoading={unstakeTx.isProcessing}
                      loadingText='Processing...'
                      onClick={() => handleUnstake(selectedNFT)}
                      variant='outline'
                      className='mt-3 w-full'
                    >
                      Unstake NFT
                    </TransactionButton>
                    <TransactionStatus
                      isLoading={unstakeTx.isProcessing}
                      isSuccess={unstakeTx.isSuccess}
                      errorMessage={unstakeTx.error || undefined}
                      txHash={unstakeTx.txHash || undefined}
                      chainId={chainId}
                      className='mt-2'
                    />
                  </div>
                ) : selectedNFT.isOnSale ? (
                  <p className='text-sm font-bold text-orange-500'>
                    This NFT is currently listed for sale. Please unlist it first if you want to
                    stake.
                  </p>
                ) : (
                  <div className='text-sm text-muted-foreground'>
                    <p className='font-bold text-orange-600'>Not Staked</p>
                    <TransactionButton
                      isLoading={stakeTx.isProcessing}
                      loadingText='Processing...'
                      onClick={() => handleStake(selectedNFT)}
                      className='mt-2 w-full'
                    >
                      Stake NFT
                    </TransactionButton>
                    <TransactionStatus
                      isLoading={stakeTx.isProcessing}
                      isSuccess={stakeTx.isSuccess}
                      errorMessage={stakeTx.error || undefined}
                      txHash={stakeTx.txHash || undefined}
                      chainId={chainId}
                      className='mt-2'
                    />
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
