/**
 * Common definitions for NFT categories and rarities, plus any future expansions.
 */

/** Standard categories used for AI NFT generation. */
export const NFT_CATEGORIES = ['Character', 'GameItem', 'Powerup'] as const
export type NFTCategory = (typeof NFT_CATEGORIES)[number]

/** Standard rarities used in our AI NFT system. */
export const NFT_RARITIES = ['Common', 'Uncommon', 'Rare', 'Legendary'] as const
export type NFTRarity = (typeof NFT_RARITIES)[number]

/**
 * Example mapping of category -> relevant numeric attributes we might filter by in the marketplace.
 * Feel free to expand or modify this object with additional attributes for each category.
 */
export const CATEGORY_ATTRIBUTE_CONFIG: Record<NFTCategory, string[]> = {
  Character: ['strength', 'agility'],
  GameItem: ['power', 'durability'],
  Powerup: ['duration'],
}
