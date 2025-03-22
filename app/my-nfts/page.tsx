'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { Loader2 } from 'lucide-react'
import { parseEther } from 'viem'
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { NFTCard } from '@/components/ui/NFTCard'
import { TransactionButton } from '@/components/ui/TransactionButton'
import { TransactionStatus } from '@/components/ui/TransactionStatus'
import { useNativeCurrencySymbol } from '@/hooks/use-native-currency-symbol'
import { useContract } from '@/hooks/use-smart-contract'
import { useToast } from '@/hooks/use-toast-notifications'
import { useTransactionState } from '@/hooks/use-transaction-state'
import { fetchAllNFTs, NFTItem } from '@/lib/nft-data'
import { fetchNftMetadata, ParsedNftMetadata } from '@/lib/nft-metadata'

export default function MyNFTsPage() {
  const { address: wagmiAddress } = useAccount()
  const currencySymbol = useNativeCurrencySymbol()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId() || 1287
  const { toast } = useToast()

  const nftMarketplaceHub = useContract('NFTMarketplaceHub')
  const nftStakingPool = useContract('NFTStakingPool')
  const nftMintingPlatform = useContract('NFTMintingPlatform')

  // Single transaction state for listing/unlisting
  const listTx = useTransactionState()
  const unlistTx = useTransactionState()

  const [price, setPrice] = useState('')
  const [userNFTs, setUserNFTs] = useState<NFTItem[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)
  const [loadingNFTs, setLoadingNFTs] = useState(false)
  const [metadataMap, setMetadataMap] = useState<Record<string, ParsedNftMetadata>>({})

  const fetchedRef = useRef(false)

  // Main loader for user's NFTs
  async function loadMyNFTs() {
    if (!wagmiAddress) return
    if (!nftMarketplaceHub || !nftMarketplaceHub.address) return
    if (!nftMintingPlatform || !nftMintingPlatform.address) return
    if (!nftStakingPool || !nftStakingPool.address) return
    if (!publicClient) return
    if (fetchedRef.current) return

    fetchedRef.current = true
    setLoadingNFTs(true)

    try {
      // fetch all minted items
      const allItems = await fetchAllNFTs(
        publicClient,
        nftMintingPlatform,
        nftMarketplaceHub,
        nftStakingPool,
      )
      // filter for items that belong to or are staked by user
      const myItems = allItems.filter((item) => {
        const staked =
          item.stakeInfo?.staked &&
          item.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase()
        const owned = item.owner.toLowerCase() === wagmiAddress.toLowerCase()
        return staked || owned
      })

      // fetch metadata for each item
      const newMap: Record<string, ParsedNftMetadata> = {}
      for (const item of myItems) {
        try {
          const parsed = await fetchNftMetadata(item.resourceUrl)
          newMap[String(item.itemId)] = parsed
        } catch {
          newMap[String(item.itemId)] = {
            imageUrl: item.resourceUrl,
            name: '',
            description: '',
            attributes: {},
          }
        }
      }

      setMetadataMap(newMap)
      setUserNFTs(myItems)
    } catch (err) {
      console.error('Error in loadMyNFTs:', err)
      toast({
        title: 'Error',
        description: 'Unable to fetch your NFTs. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoadingNFTs(false)
    }
  }

  useEffect(() => {
    if (!wagmiAddress) {
      setUserNFTs([])
      fetchedRef.current = false
      return
    }
    loadMyNFTs()
  }, [wagmiAddress, nftMarketplaceHub, nftMintingPlatform, nftStakingPool, publicClient])

  /**
   * Ensure the marketplace contract is approved (setApprovalForAll) to handle the user's NFTs.
   */
  async function ensureMarketplaceIsApproved() {
    if (!wagmiAddress || !walletClient || !nftMintingPlatform || !nftMarketplaceHub) return
    if (!publicClient) return

    const minimalABI = [
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

    const isApproved = (await publicClient.readContract({
      address: nftMintingPlatform.address as `0x${string}`,
      abi: minimalABI,
      functionName: 'isApprovedForAll',
      args: [wagmiAddress, nftMarketplaceHub.address],
    })) as boolean

    if (!isApproved) {
      toast({
        title: 'Marketplace Approval',
        description: 'Approving the Marketplace to transfer your NFTs...',
      })

      const hash = await walletClient.writeContract({
        address: nftMintingPlatform.address as `0x${string}`,
        abi: minimalABI,
        functionName: 'setApprovalForAll',
        args: [nftMarketplaceHub.address, true],
        account: wagmiAddress,
      })

      toast({
        title: 'Approval Transaction Sent',
        description: `Tx Hash: ${String(hash)}`,
      })

      await publicClient.waitForTransactionReceipt({ hash })
      toast({
        title: 'Marketplace Approved',
        description: 'You can now list your NFTs in the Marketplace.',
      })
    }
  }

  async function handleListNFT() {
    if (!selectedNFT || !price) {
      toast({
        title: 'Error',
        description: 'Select an NFT and enter a price',
        variant: 'destructive',
      })
      return
    }

    try {
      if (!nftMarketplaceHub?.address) {
        throw new Error('NFTMarketplaceHub contract not found.')
      }
      listTx.start()
      await ensureMarketplaceIsApproved()

      const abiListNFT = {
        name: 'listNFTItem',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'itemId', type: 'uint256' },
          { name: 'price', type: 'uint256' },
        ],
        outputs: [],
      }
      const hash = await walletClient?.writeContract({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: [abiListNFT],
        functionName: 'listNFTItem',
        args: [selectedNFT.itemId, parseEther(price)],
      })
      if (!hash) {
        throw new Error('Write failed. No transaction hash returned.')
      }
      listTx.start(hash)

      toast({
        title: 'Transaction Pending',
        description: 'Your list transaction is being confirmed...',
      })
      await publicClient?.waitForTransactionReceipt({ hash })

      listTx.success(hash)
      toast({
        title: 'Transaction Successful!',
        description: 'Your NFT has been listed for sale.',
      })

      if (selectedNFT) {
        try {
          const bigPrice = parseEther(price)
          setUserNFTs((prev) =>
            prev.map((n) =>
              n.itemId === selectedNFT.itemId ? { ...n, isOnSale: true, salePrice: bigPrice } : n,
            ),
          )
        } catch {
          // parse error ignored
        }
      }
    } catch (err: any) {
      listTx.fail(err.message || 'An error occurred while listing the NFT')
      toast({
        title: 'Error',
        description: err.message || 'An error occurred while listing the NFT',
        variant: 'destructive',
      })
    }
  }

  async function handleUnlistNFT() {
    if (!selectedNFT || !selectedNFT.isOnSale) {
      toast({
        title: 'Error',
        description: 'No NFT selected or it is not listed.',
        variant: 'destructive',
      })
      return
    }
    try {
      if (!nftMarketplaceHub?.address) {
        throw new Error('NFTMarketplaceHub contract not found.')
      }
      unlistTx.start()
      const abiUnlistNFT = {
        name: 'unlistNFTItem',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'itemId', type: 'uint256' }],
        outputs: [],
      }
      const hash = await walletClient?.writeContract({
        address: nftMarketplaceHub.address as `0x${string}`,
        abi: [abiUnlistNFT],
        functionName: 'unlistNFTItem',
        args: [selectedNFT.itemId],
      })
      if (!hash) {
        throw new Error('Write failed. No transaction hash returned.')
      }
      unlistTx.start(hash)

      toast({
        title: 'Transaction Pending',
        description: 'Your unlist transaction is being confirmed...',
      })
      await publicClient?.waitForTransactionReceipt({ hash })

      unlistTx.success(hash)
      toast({
        title: 'Transaction Successful!',
        description: 'Your NFT has been unlisted.',
      })

      if (selectedNFT) {
        setUserNFTs((prev) =>
          prev.map((n) =>
            n.itemId === selectedNFT.itemId ? { ...n, isOnSale: false, salePrice: 0n } : n,
          ),
        )
      }
    } catch (err: any) {
      unlistTx.fail(err.message || 'An error occurred while unlisting the NFT')
      toast({
        title: 'Error',
        description: err.message || 'An error occurred while unlisting the NFT',
        variant: 'destructive',
      })
    }
  }

  if (!wagmiAddress) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-foreground'>
        <h1 className='mb-2 text-4xl font-extrabold text-primary'>My NFTs</h1>
        <p className='text-sm text-muted-foreground'>
          Please connect your wallet to view your NFTs.
        </p>
      </main>
    )
  }

  return (
    <main className='md:px=8 min-h-screen w-full bg-background px-4 py-12 text-foreground sm:px-6'>
      <h1 className='mb-6 text-center text-4xl font-extrabold text-primary'>My NFTs</h1>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* Left Card: NFT Grid */}
        <Card className='rounded-lg border border-border shadow-xl'>
          <CardHeader className='rounded-t-lg bg-accent p-4 text-accent-foreground'>
            <CardTitle className='text-lg font-semibold'>Your NFTs</CardTitle>
          </CardHeader>
          <CardContent className='p-6'>
            {loadingNFTs ? (
              <div className='flex items-center justify-center gap-2'>
                <Loader2 className='h-5 w-5 animate-spin' />
                <span className='text-sm'>Loading NFTs...</span>
              </div>
            ) : userNFTs.length === 0 ? (
              <p className='text-sm text-muted-foreground'>You have no NFTs in your wallet.</p>
            ) : (
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
                {userNFTs.map((nft) => {
                  const itemIdStr = String(nft.itemId)
                  const meta = metadataMap[itemIdStr]
                  const isSelected = selectedNFT?.itemId === nft.itemId

                  return (
                    <NFTCard
                      key={itemIdStr}
                      item={nft}
                      metadata={meta}
                      selected={isSelected}
                      onClick={(clickedNft) => {
                        setSelectedNFT(clickedNft)
                      }}
                    />
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Card: Details */}
        <Card className='rounded-lg border border-border shadow-xl'>
          <CardHeader className='rounded-t-lg bg-accent p-4 text-accent-foreground'>
            <CardTitle className='text-lg font-semibold'>
              {selectedNFT ? `Details for NFT #${String(selectedNFT.itemId)}` : 'Select an NFT'}
            </CardTitle>
          </CardHeader>
          <CardContent className='p-6'>
            {!selectedNFT ? (
              <p className='text-sm text-muted-foreground'>
                Click one of your NFTs on the left to view details.
              </p>
            ) : (
              <>
                {/* Image */}
                <div className='relative mb-4 h-64 w-full overflow-hidden rounded-md border border-border bg-secondary'>
                  {(() => {
                    const itemIdStr = String(selectedNFT.itemId)
                    const meta = metadataMap[itemIdStr] || {
                      imageUrl: selectedNFT.resourceUrl,
                      name: '',
                      description: '',
                      attributes: {},
                    }
                    return (
                      <Image
                        src={meta.imageUrl}
                        alt={`NFT #${String(selectedNFT.itemId)}`}
                        fill
                        sizes='(max-width: 768px) 100vw,
                               (max-width: 1200px) 50vw,
                               33vw'
                        className='object-contain'
                      />
                    )
                  })()}
                </div>

                {(() => {
                  const itemIdStr = String(selectedNFT.itemId)
                  const meta = metadataMap[itemIdStr] || {
                    imageUrl: selectedNFT.resourceUrl,
                    name: '',
                    description: '',
                    attributes: {},
                  }
                  return (
                    <>
                      <div className='flex flex-col gap-1 text-sm'>
                        <strong>Name:</strong>
                        <span>{meta.name || `NFT #${String(selectedNFT.itemId)}`}</span>
                      </div>
                      <div className='mt-2 flex flex-col gap-1 text-sm'>
                        <strong>Description:</strong>
                        <span className='whitespace-pre-wrap text-muted-foreground'>
                          {meta.description || 'No description'}
                        </span>
                      </div>
                      {Object.keys(meta.attributes).length > 0 && (
                        <div className='mt-2'>
                          <strong className='text-sm'>Attributes:</strong>
                          <div className='mt-1 rounded-md border border-border bg-secondary p-3 text-sm'>
                            <pre className='whitespace-pre-wrap break-all text-muted-foreground'>
                              {JSON.stringify(meta.attributes, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                <hr className='my-4 border-border' />
                <p className='mb-1 text-sm'>
                  <strong>XP Value:</strong> {selectedNFT.xpValue.toString()}
                </p>
                <p className='mb-1 text-sm'>
                  <strong>Creator:</strong> {selectedNFT.creator.slice(0, 6)}...
                  {selectedNFT.creator.slice(-4)}
                </p>
                <p className='mb-1 break-all text-sm'>
                  <strong>Resource URL:</strong> {selectedNFT.resourceUrl}
                </p>
                <p className='mb-1 text-sm'>
                  <strong>Is On Sale:</strong> {selectedNFT.isOnSale ? 'Yes' : 'No'}
                </p>
                {selectedNFT.isOnSale && (
                  <p className='mb-1 text-sm'>
                    <strong>Price:</strong> {(Number(selectedNFT.salePrice) / 1e18).toFixed(4)}{' '}
                    {currencySymbol}
                  </p>
                )}
                {selectedNFT.stakeInfo?.staked &&
                  selectedNFT.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase() && (
                    <p className='mb-1 text-sm text-green-600'>
                      <strong>Staked:</strong> This NFT is currently staked.
                    </p>
                  )}

                <form onSubmit={(e) => e.preventDefault()} className='mt-4 space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>Sale Price ({currencySymbol})</label>
                    <Input
                      type='number'
                      step='0.001'
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder='0.1'
                      className='mt-1'
                      disabled={
                        selectedNFT.stakeInfo?.staked &&
                        selectedNFT.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase()
                      }
                    />
                  </div>
                  {selectedNFT.stakeInfo?.staked &&
                  selectedNFT.stakeInfo.staker.toLowerCase() === wagmiAddress.toLowerCase() ? (
                    <p className='text-sm font-semibold text-orange-600'>
                      This NFT is currently staked. Unstake before listing.
                    </p>
                  ) : (
                    <TransactionButton
                      isLoading={listTx.isProcessing}
                      loadingText='Processing...'
                      onClick={handleListNFT}
                      disabled={!price}
                      className='w-full'
                    >
                      List for Sale
                    </TransactionButton>
                  )}
                  <TransactionStatus
                    isLoading={listTx.isProcessing}
                    isSuccess={listTx.isSuccess}
                    errorMessage={listTx.error || null}
                    txHash={listTx.txHash || undefined}
                    chainId={chainId}
                  />
                </form>

                {selectedNFT.isOnSale && (
                  <>
                    <TransactionButton
                      isLoading={unlistTx.isProcessing}
                      loadingText='Processing...'
                      onClick={handleUnlistNFT}
                      variant='outline'
                      className='mt-3 w-full'
                    >
                      Unlist NFT
                    </TransactionButton>

                    <TransactionStatus
                      isLoading={unlistTx.isProcessing}
                      isSuccess={unlistTx.isSuccess}
                      errorMessage={unlistTx.error || null}
                      txHash={unlistTx.txHash || undefined}
                      chainId={chainId}
                      className='mt-2'
                    />
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
