"use client"
import React from "react"

const creatorData = [
  {
    id: 1,
    name: "Juan dela Cruz",
    avatar: "/avatars/creator1.png",
    change: 2.12,
    itemsSold: 860,
    volume: 21.3
  },
  {
    id: 2,
    name: "Marites Santos",
    avatar: "/avatars/creator2.png",
    change: 1.77,
    itemsSold: 512,
    volume: 18.9
  },
  {
    id: 3,
    name: "Aling Nena",
    avatar: "/avatars/creator3.png",
    change: 1.25,
    itemsSold: 370,
    volume: 12.4
  }
]

export default function CreatorHighlightPage() {
  return (
    <main className="min-h-screen px-4 py-10 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-extrabold text-center text-primary">Creator Highlights</h1>
        <p className="mx-auto mb-10 max-w-xl text-center text-sm text-muted-foreground">
          Meet the top AI-driven NFT creators blazing the trail in AIPenGuild. These trailblazers
          push the boundaries of generative art, bridging tech and creativity in new frontiers.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {creatorData.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-background p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-highlight">
                    +{item.change}% this week
                  </p>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p><strong>AI Items Sold:</strong> {item.itemsSold}</p>
                <p><strong>Volume:</strong> {item.volume} WND</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}