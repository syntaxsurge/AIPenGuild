import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { moonbaseAlpha, moonbeam } from 'wagmi/chains'
import { westendAssetHub } from '@/providers/rainbowkit-wallet-provider'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { ABIS } from '@/contracts/abis'

/**
 * GET /api/v1/gaming/user/[address]/xp?chainId=...
 *
 * Returns { success: boolean, chainId: number, address: string, xp: string }
 */
export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    // 1) Parse chainId from query param
    const { searchParams } = new URL(request.url)
    let chainIdParam = searchParams.get('chainId')
    let chainId = chainIdParam ? parseInt(chainIdParam, 10) : 1287
    if (!chainId || !CONTRACT_ADDRESSES[chainId]) {
      chainId = 1287 // fallback
    }

    // 2) Determine chain object
    let chainObj = moonbaseAlpha
    if (chainId === 420420421) {
      chainObj = westendAssetHub
    } else if (chainId === 1284 || chainId === 1285) {
      chainObj = moonbeam
    } else if (chainId !== 1287) {
      chainObj = moonbaseAlpha
    }

    // 3) Initialize public client
    const publicClient = createPublicClient({
      chain: chainObj,
      transport: http()
    })

    // 4) Retrieve addresses
    const addresses = CONTRACT_ADDRESSES[chainId]
    if (!addresses.UserExperiencePoints) {
      return NextResponse.json(
        {
          success: false,
          error: `UserExperiencePoints contract not configured for chainId ${chainId}.`
        },
        { status: 500 }
      )
    }

    const userAddress = params.address.toLowerCase()
    const userExperiencePoints = {
      address: addresses.UserExperiencePoints as `0x${string}`,
      abi: ABIS.UserExperiencePoints
    }

    // 5) Read user XP
    const xpVal = await publicClient.readContract({
      address: userExperiencePoints.address,
      abi: userExperiencePoints.abi,
      functionName: 'userExperience',
      args: [userAddress as `0x${string}`]
    }) as bigint

    return NextResponse.json({
      success: true,
      chainId,
      address: userAddress,
      xp: xpVal.toString()
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to read user XP.'
      },
      { status: 500 }
    )
  }
}