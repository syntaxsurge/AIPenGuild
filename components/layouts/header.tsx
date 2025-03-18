'use client'

import { ThemeToggleButton } from "@/components/theme-toggle-button"
import WalletConnectButton from "@/components/wallet-connect-button"
import { IconChevronDown, IconMenu2 } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useAccount } from "wagmi"

function Header() {
  const [open, setOpen] = useState(false)
  const toggleOpen = () => setOpen(prev => !prev)
  const { isDisconnected } = useAccount()

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] border-b border-border bg-background">
      {/* Main Nav Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between md:px-20">
        <div className="flex items-center justify-between px-4 py-4 md:py-3 md:px-0">
          <Logo />
          <IconMenu2
            onClick={toggleOpen}
            className="ml-auto block h-5 w-5 cursor-pointer md:hidden"
          />
        </div>

        {/* Desktop Nav */}
        <div
          className={`${open ? "block" : "hidden"} border-t border-border md:border-none md:block`}
        >
          <div className="flex flex-col gap-4 px-4 py-4 text-sm uppercase md:flex-row md:items-center md:justify-end md:py-0">
            {/* HOME Menu (with dropdown linking to specific sections) */}
            <div className="group relative">
              <button className="flex items-center gap-1 hover:underline">
                HOME
                <IconChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 hidden min-w-[180px] pt-2 group-hover:block">
                <div className="rounded-md border border-border bg-background p-2 shadow-lg">
                  {/* Link directly to home, or to #anchors on the home page */}
                  <Link href="/" className="block rounded-sm px-4 py-2 hover:bg-muted">
                    MAIN
                  </Link>
                  <Link
                    href="/#introduction"
                    className="block rounded-sm px-4 py-2 hover:bg-muted"
                  >
                    INTRODUCTION
                  </Link>
                  <Link
                    href="/#featured"
                    className="block rounded-sm px-4 py-2 hover:bg-muted"
                  >
                    FEATURED
                  </Link>
                  <Link
                    href="/#faq"
                    className="block rounded-sm px-4 py-2 hover:bg-muted"
                  >
                    FAQ
                  </Link>
                  <Link
                    href="/#why-aipenguild"
                    className="block rounded-sm px-4 py-2 hover:bg-muted"
                  >
                    WHY AIPENGUILD
                  </Link>
                  <Link
                    href="/#test-networks"
                    className="block rounded-sm px-4 py-2 hover:bg-muted"
                  >
                    SUPPORTED NETWORKS
                  </Link>
                </div>
              </div>
            </div>

            {/* STATS dropdown: Leaderboard, Dashboard */}
            <div className="group relative">
              <button className="flex items-center gap-1 hover:underline">
                STATS
                <IconChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 hidden min-w-[180px] pt-2 group-hover:block">
                <div className="rounded-md border border-border bg-background p-2 shadow-lg">
                  <Link href="/leaderboard" className="block rounded-sm px-4 py-2 hover:bg-muted">
                    LEADERBOARD
                  </Link>
                  <Link href="/dashboard" className="block rounded-sm px-4 py-2 hover:bg-muted">
                    DASHBOARD
                  </Link>
                </div>
              </div>
            </div>

            {/* MARKETPLACE / Explore dropdown */}
            <div className="group relative">
              <button className="flex items-center gap-1 hover:underline">
                EXPLORE
                <IconChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 hidden min-w-[180px] pt-2 group-hover:block">
                <div className="rounded-md border border-border bg-background p-2 shadow-lg">
                  <Link href="/mint" className="block rounded-sm px-4 py-2 hover:bg-muted">
                    CREATE AI NFT
                  </Link>
                  <Link href="/my-nfts" className="block rounded-sm px-4 py-2 hover:bg-muted">
                    MY NFTS
                  </Link>
                  <Link href="/marketplace" className="block rounded-sm px-4 py-2 hover:bg-muted">
                    MARKETPLACE
                  </Link>
                  <Link href="/stake" className="block rounded-sm px-4 py-2 hover:bg-muted">
                    STAKE NFTS
                  </Link>
                </div>
              </div>
            </div>

            {/* Admin link (only if connected and you're the owner;
                but for now we simply hide if disconnected) */}
            {!isDisconnected && (
              <Link href="/admin" className="hover:underline">
                ADMIN
              </Link>
            )}

            {/* Connect Wallet, Theme Toggle */}
            <div className="flex flex-col items-start gap-4 md:ml-6 md:flex-row md:items-center">
              <div className="flex items-center justify-center gap-3">
                <ThemeToggleButton />
              </div>
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <Image src="/images/aipenguild-logo.png" alt="AIPenGuild Logo" width={40} height={40} />
      <span className="text-lg font-bold text-primary hover:opacity-90 md:text-xl">
        AIPenGuild
      </span>
    </Link>
  )
}