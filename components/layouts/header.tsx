"use client"
import ConnectWalletBtn from "@/components/connect-wallet-btn"
import { ThemeToggle } from "@/components/theme-toggle"
import { IconMenu2, IconChevronDown } from "@tabler/icons-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

function Header() {
  const [open, setOpen] = useState(false)
  const toggleOpen = () => setOpen(prev => !prev)

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
        <div className={`${open ? "block" : "hidden"} border-t border-border md:border-none md:block`}>
          <div className="flex flex-col gap-4 px-4 py-4 text-sm uppercase md:flex-row md:items-center md:justify-end md:py-0">
            <Link href="/" className="hover:underline">
              Home
            </Link>

            {/* Rankings dropdown */}
            <div className="group relative">
              <button className="flex items-center gap-1 hover:underline">
                Ranking
                <IconChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 hidden min-w-[180px] pt-2 group-hover:block">
                <div className="rounded-md border border-border bg-background p-2 shadow-lg">
                  <Link href="/ranking/creator" className="block rounded-sm px-4 py-2 hover:bg-muted">
                    Creator Highlights
                  </Link>
                  <Link href="/ranking/minter" className="block rounded-sm px-4 py-2 hover:bg-muted">
                    Minter Stats
                  </Link>
                </div>
              </div>
            </div>

            {/* Marketplace dropdown */}
            <div className="group relative">
              <button className="flex items-center gap-1 hover:underline">
                Marketplace
                <IconChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 hidden min-w-[180px] pt-2 group-hover:block">
                <div className="rounded-md border border-border bg-background p-2 shadow-lg">
                  <Link href="/marketplace" className="block rounded-sm px-4 py-2 hover:bg-muted">
                    Explore
                  </Link>
                  <Link href="/my-nfts" className="block rounded-sm px-4 py-2 hover:bg-muted">
                    My NFTs
                  </Link>
                  <Link href="/mint" className="block rounded-sm px-4 py-2 hover:bg-muted">
                    Create AI NFT
                  </Link>
                </div>
              </div>
            </div>

            {/* Connect Wallet, Theme Toggle */}
            <div className="flex flex-col items-start gap-4 md:ml-6 md:flex-row md:items-center">
              <div className="flex items-center justify-center gap-3">
                <ThemeToggle />
              </div>
              <ConnectWalletBtn />
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
      <Image src="/AIPenGuild-logo.png" alt="AIPenGuild Logo" width={40} height={40} />
      <span className="text-lg font-bold text-primary hover:opacity-90 md:text-xl">
        AIPenGuild
      </span>
    </Link>
  )
}