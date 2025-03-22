"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

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
    <div className="w-full min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-border">
        <div className="p-4 bg-secondary text-secondary-foreground">
          <h2 className="text-lg font-bold">Documentation</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 bg-background">
          {docsNavLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`block px-2 py-1 rounded-md transition ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 sm:px-6 md:px-8">
        {children}
      </main>
    </div>
  )
}