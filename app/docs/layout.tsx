"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"
import Image from "next/image"

interface NavLink {
  name: string
  href: string
}

const docsNavLinks: NavLink[] = [
  { name: "Overview", href: "/docs/overview" },
  { name: "User Guide", href: "/docs/user-guide" },
  { name: "Developer APIs", href: "/docs/developer-apis" },
  { name: "FAQ", href: "/docs/faq" }
]

export default function DocsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-72 border-r border-border bg-secondary text-secondary-foreground">
        {/* Sidebar branding or banner */}
        <div className="p-6 flex flex-col items-center justify-center gap-3 border-b border-border">
          <Image
            src="/images/docs/docs-banner.png"
            alt="Documentation Banner"
            width={200}
            height={100}
            className="object-contain"
          />
          <h2 className="text-xl font-extrabold">AIPenGuild Docs</h2>
          <p className="text-base text-foreground/90 text-center">
            Explore, integrate, and master
            <br />
            AI-driven NFT experiences
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {docsNavLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`block rounded-md px-3 py-2 text-base font-semibold hover:bg-accent hover:text-accent-foreground transition ${
                  isActive ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>
        {/* Optional image or footer branding */}
        <div className="p-4 border-t border-border text-center text-sm">
          <p className="text-foreground/80">
            Powered by AI &amp; Web3
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10">
        {children}
      </main>
    </div>
  )
}