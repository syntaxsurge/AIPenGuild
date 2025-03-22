export interface XPTier {
  label: string
  min: number
  max: number
}

/**
 * Expanded XP ranges and labels to accommodate up to 100 million+ (and beyond) because staking can generate large XP.
 */
export const XP_TITLES: XPTier[] = [
  { label: 'Newcomer', min: 0, max: 99 },
  { label: 'Apprentice', min: 100, max: 999 },
  { label: 'Adept', min: 1000, max: 4999 },
  { label: 'Enthusiast', min: 5000, max: 9999 },
  { label: 'Connoisseur', min: 10000, max: 24999 },
  { label: 'Expert', min: 25000, max: 49999 },
  { label: 'Master', min: 50000, max: 99999 },
  { label: 'Grandmaster', min: 100000, max: 249999 },
  { label: 'Legend', min: 250000, max: 499999 },
  { label: 'Mythical', min: 500000, max: 999999 },
  { label: 'Immortal', min: 1000000, max: 4999999 },
  { label: 'Transcendent', min: 5000000, max: 9999999 },
  { label: 'Ascendant', min: 10000000, max: 24999999 },
  { label: 'Celestial', min: 25000000, max: 49999999 },
  { label: 'Eternal', min: 50000000, max: 99999999 },
  { label: 'Godlike', min: 100000000, max: 499999999 },
  { label: 'Omnipotent', min: 500000000, max: 999999999 },
  { label: 'Infinite', min: 1000000000, max: 4999999999 },
  { label: 'Multiversal', min: 5000000000, max: 99999999999 },
  { label: 'Omniversal', min: 100000000000, max: 999999999999 },
  { label: 'Beyond Reality', min: 1000000000000, max: 9999999999999 },
  { label: 'Singularity', min: 10000000000000, max: 99999999999999 },
  { label: 'Ultimate', min: 100000000000000, max: 999999999999999 },
  { label: 'Absolute', min: 1000000000000000, max: 9999999999999999 },
  { label: 'Infinite Singularity', min: 10000000000000000, max: 99999999999999999 },
  { label: 'Transdimensional', min: 100000000000000000, max: Infinity }
]

/**
 * Given a numerical XP value, returns the corresponding title from XP_TITLES.
 * If XP exceeds the last tier's max, the last label "Transdimensional" is returned as fallback.
 */
export function getUserTitle(xp: number): string {
  for (const tier of XP_TITLES) {
    if (xp >= tier.min && xp <= tier.max) {
      return tier.label
    }
  }
  // Fallback (shouldn't normally happen unless something changes in the array):
  return XP_TITLES[XP_TITLES.length - 1].label
}
