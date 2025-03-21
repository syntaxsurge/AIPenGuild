import { XP_TITLES } from '@/lib/experience'
import { NextResponse } from 'next/server'

/**
 * GET /api/v1/gaming/titles
 *
 * Returns an array of XP tier ranges and labels, e.g.:
 * [
 *   { "label": "Newcomer", "min": 0, "max": 99 },
 *   ...
 * ]
 * This one doesn't rely on chain data, so no chainId param is necessary.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    titles: XP_TITLES
  })
}