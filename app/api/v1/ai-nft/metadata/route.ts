import { NextResponse } from 'next/server'

import OpenAI from 'openai'
import Replicate from 'replicate'

import { NFT_CATEGORIES, NFTCategory } from '@/lib/metadata-constants'

/**
 * All attribute sets or structure definitions were originally in this file, now we only keep
 * the logic and import the shared categories from `metadata-constants.ts`.
 */

// We'll define a dynamic requirement type, to keep things flexible
interface Requirements {
  requiredKeys: string[]
  systemRanges?: Record<string, { min: number; max: number }>
}

// Example category-specific config from the old code. You can expand or adapt if needed.
const CATEGORIES_CONFIG: Record<NFTCategory, Requirements> = {
  Character: {
    requiredKeys: [
      'strength',
      'agility',
      'specialEffect',
      'rarity',
      'name',
      'finalReplicatePrompt',
    ],
    systemRanges: {
      strength: { min: 1, max: 100 },
      agility: { min: 1, max: 100 },
    },
  },
  GameItem: {
    requiredKeys: ['durability', 'power', 'rarity', 'name', 'finalReplicatePrompt'],
    systemRanges: {
      durability: { min: 1, max: 100 },
      power: { min: 1, max: 100 },
    },
  },
  Powerup: {
    requiredKeys: ['boostType', 'duration', 'rarity', 'name', 'finalReplicatePrompt'],
    systemRanges: {
      duration: { min: 1, max: 300 },
    },
  },
}

// Base prompt text, mapped by category
const BASE_CATEGORY_PROMPT: Record<NFTCategory, string> = {
  Character: `Focus on illustrating a single character, no large environment. Ensure it's a fantasy or stylized figure.`,
  GameItem: `Focus on illustrating a single game item or object (e.g., swords, shields, potions, etc.), with no living creatures or people included.`,
  Powerup: `Focus on illustrating a single power-up or buff item, like a glowing potion, magical effect, or special icon.`,
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
})

export async function POST(request: Request) {
  try {
    const { prompt, category } = (await request.json()) as { prompt?: string; category?: string }

    if (!prompt || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing prompt or category' },
        { status: 400 },
      )
    }
    if (!NFT_CATEGORIES.includes(category as NFTCategory)) {
      return NextResponse.json(
        { success: false, error: `Unsupported category: ${category}` },
        { status: 400 },
      )
    }

    const typedCategory = category as NFTCategory
    const config = CATEGORIES_CONFIG[typedCategory]
    const requiredKeys = config.requiredKeys
    const systemRanges = config.systemRanges || {}
    const basePromptForCategory = BASE_CATEGORY_PROMPT[typedCategory]

    let success = false
    let attempt = 0
    let rawContent = ''
    let attributesJson: any = {}

    const systemInstruction = `
You are an assistant that outputs valid JSON for a gaming NFT.
You MUST produce a JSON with EXACT keys [${requiredKeys.join(', ')}].
- "finalReplicatePrompt": A refined/beautified prompt for an image generation service.
   Must strongly focus on the category: "${typedCategory}"
   Use the base directive:
   "${basePromptForCategory}"
   Then incorporate any relevant parts of user input if they match. Otherwise, ignore contradictory elements.

Rarity distribution rule (roughly):
  - 60% => "Common"
  - 25% => "Uncommon"
  - 10% => "Rare"
  - 5%  => "Legendary"

Also numeric attributes:
${Object.keys(systemRanges)
  .map((key) => {
    const r = systemRanges[key]
    return `Key "${key}" must be an integer from ${r.min} to ${r.max}.`
  })
  .join('\n')}

Return only JSON. No code fences, no extra keys.
`

    while (attempt < 5 && !success) {
      attempt++

      const userMessage = `
User selected category: ${typedCategory}.
User's raw input: "${prompt}".

Generate the required JSON.
Example structure:
{
  "durability": 73,
  "power": 40,
  "rarity": "Common",
  "name": "Steel Longsword",
  "finalReplicatePrompt": "A stylized sword item..."
}
Obey the category, numeric ranges, and no extra keys!
`
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
      })

      if (!completion.choices?.length) {
        continue
      }
      rawContent = completion.choices[0].message?.content?.trim() || '{}'

      try {
        const parsed = JSON.parse(rawContent)

        const keys = Object.keys(parsed).sort()
        const requiredSorted = [...requiredKeys].sort()
        if (keys.length !== requiredSorted.length) {
          continue
        }

        let allMatch = true
        for (let i = 0; i < requiredSorted.length; i++) {
          if (keys[i] !== requiredSorted[i]) {
            allMatch = false
            break
          }
        }
        if (!allMatch) {
          continue
        }

        let outOfRange = false
        for (const srKey of Object.keys(systemRanges)) {
          if (typeof parsed[srKey] === 'number') {
            const { min, max } = systemRanges[srKey]
            if (parsed[srKey] < min || parsed[srKey] > max) {
              outOfRange = true
              break
            }
          } else {
            outOfRange = true
            break
          }
        }
        if (outOfRange) {
          continue
        }

        if (
          typeof parsed.finalReplicatePrompt !== 'string' ||
          !parsed.finalReplicatePrompt.trim()
        ) {
          continue
        }

        attributesJson = parsed
        success = true
      } catch {
        continue
      }
    }

    if (!success) {
      throw new Error(
        `Failed to get correct JSON after 5 attempts.\nLast LLM output:\n${rawContent}`,
      )
    }

    // We have finalReplicatePrompt, let's feed that to replicate
    const replicatePrompt = attributesJson.finalReplicatePrompt
    const replicateOutput = await replicate.run('black-forest-labs/flux-dev', {
      input: {
        prompt: replicatePrompt,
      },
    })
    if (!Array.isArray(replicateOutput) || replicateOutput.length === 0) {
      throw new Error('No output from replicate model')
    }

    let imageUrl = ''
    const fileOutput = replicateOutput[0]
    if (fileOutput && typeof fileOutput.url === 'function') {
      imageUrl = fileOutput.url()
    } else if (typeof fileOutput === 'string') {
      imageUrl = fileOutput
    } else {
      throw new Error('No valid image URL found from replicate model')
    }

    const finalName = attributesJson.name || 'Unnamed NFT'
    const { finalReplicatePrompt, ...restAttrs } = attributesJson

    const metadata = {
      name: finalName,
      image: imageUrl,
      attributes: {
        category,
        ...restAttrs,
      },
    }

    return NextResponse.json({ success: true, metadata })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'LLM/AI generation error',
      },
      { status: 500 },
    )
  }
}
