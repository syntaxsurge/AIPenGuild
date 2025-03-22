'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface NavLink {
  name: string
  href: string
}

const docsNavLinks: NavLink[] = [
  { name: 'Overview', href: '/docs/overview' },
  { name: 'User Guide', href: '/docs/user-guide' },
  { name: 'Developer APIs', href: '/docs/developer-apis' },
  { name: 'Technical Architecture', href: '/docs/technical-architecture' },
  { name: 'FAQ', href: '/docs/faq' },
]

export default function DocsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className='flex min-h-screen w-full bg-background text-foreground'>
      {/* Sidebar */}
      <aside className='hidden border-r border-border bg-secondary text-secondary-foreground md:flex md:w-72 md:flex-col'>
        {/* Sidebar branding or banner */}
        <div className='flex flex-col items-center justify-center gap-3 border-b border-border p-6'>
          <Image
            src='/images/aipenguild-logo.png'
            alt='AIPenGuild Logo'
            width={200}
            height={100}
            className='object-contain'
          />
          <h2 className='text-xl font-extrabold'>AIPenGuild Docs</h2>
          <p className='text-center text-base text-foreground/90'>
            Explore, integrate, and master
            <br />
            AI-driven NFT experiences
          </p>
        </div>
        <nav className='flex-1 space-y-1 p-4'>
          {docsNavLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`block rounded-md px-3 py-2 text-base font-semibold transition hover:bg-accent hover:text-accent-foreground ${
                  isActive ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>
        {/* Optional image or footer branding */}
        <div className='border-t border-border p-4 text-center text-sm'>
          <p className='text-foreground/80'>Powered by AI &amp; Web3</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 p-4 sm:p-8 lg:p-10'>{children}</main>
    </div>
  )
}
