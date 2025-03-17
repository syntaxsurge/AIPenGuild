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
  { label: "Newcomer",      min: 0,       max: 99 },
  { label: "Apprentice",    min: 100,     max: 999 },
  { label: "Adept",         min: 1000,    max: 4999 },
  { label: "Enthusiast",    min: 5000,    max: 9999 },
  { label: "Connoisseur",   min: 10000,   max: 24999 },
  { label: "Expert",        min: 25000,   max: 49999 },
  { label: "Master",        min: 50000,   max: 99999 },
  { label: "Grandmaster",   min: 100000,  max: 249999 },
  { label: "Legend",        min: 250000,  max: 499999 },
  { label: "Mythical",      min: 500000,  max: 999999 },
  { label: "Immortal",      min: 1000000, max: Infinity }
]

/**
 * Given a numerical XP value, returns the corresponding title from XP_TITLES.
 */
export function getUserTitle(xp: number): string {
  // Loop through XP_TITLES
  for (const tier of XP_TITLES) {
    if (xp >= tier.min && xp <= tier.max) {
      return tier.label
    }
  }
  // Fallback if none match
  return "Immortal"
}