import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    if (!prompt) {
      return NextResponse.json({ success: false, error: "No prompt provided" }, { status: 400 })
    }
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ success: false, error: "OPENAI_API_KEY not configured" }, { status: 500 })
    }
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI-based NFT story generator." },
          { role: "user", content: `Craft a short, imaginative NFT storyline. ${prompt}` }
        ],
        max_tokens: 150
      })
    })
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ success: false, error: err }, { status: 500 })
    }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ""
    return NextResponse.json({
      success: true,
      story: content
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Error generating NFT metadata" }, { status: 500 })
  }
}