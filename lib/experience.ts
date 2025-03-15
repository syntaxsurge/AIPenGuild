export interface XPTier {
  label: string
  min: number
  max: number
}

/**
 * This array defines the XP ranges for each title.
 * 'max' can be Infinity for an open-ended upper bound.
 */
export const XP_TITLES: XPTier[] = [
  { label: "Explorer",    min: 1,   max: 99 },
  { label: "Enthusiast",  min: 100, max: 299 },
  { label: "Connoisseur", min: 300, max: 499 },
  { label: "Master",      min: 500, max: Infinity }
]

/**
 * Given a numerical XP value, returns the corresponding title from XP_TITLES.
 */
export function getUserTitle(xp: number): string {
  if (xp <= 0) {
    return "Newcomer"
  }
  // Find the first matching tier
  for (const tier of XP_TITLES) {
    if (xp >= tier.min && xp <= tier.max) {
      return tier.label
    }
  }
  // Fallback if none match, though Infinity should cover upper XP
  return "Legend"
}