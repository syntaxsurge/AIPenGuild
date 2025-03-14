"use client"
import React from "react"

const minterData = [
  {
    id: 1,
    name: "Benjie Manalo",
    avatar: "/avatars/minter1.png",
    change: 2.9,
    itemsSold: 32,
    volume: 5.7
  },
  {
    id: 2,
    name: "Lia Mercado",
    avatar: "/avatars/minter2.png",
    change: 2.1,
    itemsSold: 24,
    volume: 4.1
  },
  {
    id: 3,
    name: "Rafael Torres",
    avatar: "/avatars/minter3.png",
    change: 1.4,
    itemsSold: 15,
    volume: 3.0
  }
]

export default function MinterStatsPage() {
  return (
    <main className="min-h-screen px-4 py-10 md:px-8 bg-white dark:bg-gray-900 text-foreground">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-extrabold text-center text-primary">Minter Stats</h1>
        <p className="mx-auto mb-10 max-w-xl text-center text-sm text-muted-foreground">
          Discover who’s minting the most AI NFTs on AIPenGuild. These prolific minters
          continually explore new frontiers and expand the creative ecosystem.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {minterData.map((item) => (
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
                    +{item.change}% minted
                  </p>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p><strong>AI NFTs Minted:</strong> {item.itemsSold}</p>
                <p><strong>Volume:</strong> {item.volume} WND</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}