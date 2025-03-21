import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { moonbaseAlpha } from 'wagmi/chains'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { ABIS } from '@/contracts/abis'

/**
 * GET /api/v1/gaming/user/[address]/xp
 *
 * Returns { success: boolean, address: string, xp: string }
 */
export async function GET(
  _request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const userAddress = params.address.toLowerCase()

    // Setup a public client to read from MoonbaseAlpha by default.
    const publicClient = createPublicClient({
      chain: moonbaseAlpha,
      transport: http()
    })

    const chainId = moonbaseAlpha.id
    const addresses = CONTRACT_ADDRESSES[chainId]

    if (!addresses.UserExperiencePoints) {
      return NextResponse.json(
        {
          success: false,
          error: 'UserExperiencePoints contract not configured for this chain.'
        },
        { status: 500 }
      )
    }

    const userExperiencePoints = {
      address: addresses.UserExperiencePoints as `0x${string}`,
      abi: ABIS.UserExperiencePoints
    }

    // userExperience mapping: user => XP in the contract
    // function userExperience(address user) external view returns (uint256);
    const xpVal = await publicClient.readContract({
      address: userExperiencePoints.address,
      abi: userExperiencePoints.abi,
      functionName: 'userExperience',
      args: [userAddress as `0x${string}`]
    }) as bigint

    return NextResponse.json({
      success: true,
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