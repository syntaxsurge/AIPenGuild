import { NextResponse } from 'next/server'

import { getContractConfig, getPublicClientForChainId, parseChainIdParam } from '@/lib/chain-utils'

/**
 * GET /api/v1/gaming/user/[address]/xp?chainId=...
 * Returns { success: boolean, chainId, address, xp }
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // parse address from path
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    // The last segment is "xp" -> we want the second to last, "[address]"
    // e.g. /api/v1/gaming/user/0x1234abcd/xp
    if (segments.length < 7) {
      return NextResponse.json(
        { success: false, error: 'No address found in path' },
        { status: 400 },
      )
    }
    const address = segments[segments.length - 2]
    const userAddress = address.toLowerCase()

    // parse chainId
    const chainId = parseChainIdParam(url.searchParams.get('chainId'))

    // Build public client
    const publicClient = getPublicClientForChainId(chainId)
    // get XP contract config
    const xpConfig = getContractConfig(chainId, 'UserExperiencePoints')

    // read user XP
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
