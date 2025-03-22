import { NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'No prompt provided' }, { status: 400 })
    }

    // Prepend "NFT style," to nudge the model towards producing an NFT-like image
    const finalPrompt = `NFT style, ${prompt}`

    // Run the replicate model black-forest-labs/flux-dev
    const output = await replicate.run('black-forest-labs/flux-dev', {
      input: {
        prompt: finalPrompt,
      },
    })

    // According to Replicate docs, some image-based models return an array of FileOutput
    if (!output || !Array.isArray(output) || output.length === 0) {
      throw new Error('No output returned from the model')
    }

    // The first result is typically our FileOutput. We can get a URL from .url()
    // If the model returns a standard string array, remove .url() usage.
    const fileOutput = output[0]
    let imageUrl = ''
    // Some models return file-based outputs with .url(), others return string URLs directly.
    // Attempt to handle both:
    if (fileOutput && typeof fileOutput.url === 'function') {
      imageUrl = fileOutput.url()
    } else if (typeof fileOutput === 'string') {
      imageUrl = fileOutput
    } else {
      throw new Error('No valid image URL found in the model output')
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      metadata: {
        attributes: [
          { trait_type: 'AI Style', value: 'Generative' },
          {
            trait_type: 'Prompt',
            value: prompt.slice(0, 60),
          },
        ],
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'AI generation failed',
      },
      { status: 500 },
    )
  }
}
