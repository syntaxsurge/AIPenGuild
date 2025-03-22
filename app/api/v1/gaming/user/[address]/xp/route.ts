import { NextResponse } from 'next/server'
import { getContractConfig, getPublicClientForChainId, parseChainIdParam } from '@/lib/chain-utils'

/**
 * GET /api/v1/gaming/user/[address]/xp?chainId=...
 *
 * Returns { success: boolean, chainId, address, xp }
 */
export async function GET(request: Request, { params }: { params: { address: string } }) {
  try {
    const url = new URL(request.url)
    const chainId = parseChainIdParam(url.searchParams.get('chainId'))

    // Build public client
    const publicClient = getPublicClientForChainId(chainId)

    // Get XP contract config
    const xpConfig = getContractConfig(chainId, 'UserExperiencePoints')

    const userAddress = params.address.toLowerCase()

    // read user XP from contract
    const xpVal = (await publicClient.readContract({
      address: xpConfig.address as `0x${string}`,
      abi: xpConfig.abi,
      functionName: 'userExperience',
      args: [userAddress as `0x${string}`],
    })) as bigint

    return NextResponse.json({
      success: true,
      chainId,
      address: userAddress,
      xp: xpVal.toString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to read user XP.',
      },
      { status: 500 },
    )
  }
}
