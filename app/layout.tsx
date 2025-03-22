import { GoogleAnalytics } from '@next/third-parties/google'
import { AnimateOnScrollInitializer } from '@/components/AnimateOnScrollInitializer'
import PageTopLoader from '@/components/PageTopLoader'
import Header from '@/components/layouts/Header'
import Providers from '@/providers/Providers'
import '@rainbow-me/rainbowkit/styles.css'
import type { Metadata } from 'next'
import { Inter, Unbounded } from 'next/font/google'
import './globals.css'

/**
 * Load two fonts:
 * - Unbounded (for headings) to reflect Polkadot brand style.
 * - Inter (for body text) as a clean, readable base.
 */
const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AIPenGuild',
  description: 'AIPenGuild: The cutting-edge AI-driven NFT marketplace',
  icons: {
    icon: 'images/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Attach font variables to the <html> element
    <html lang='en' className={`${unbounded.variable} ${inter.variable}`} suppressHydrationWarning>
      <body
        className={`custom-selection bg-background text-foreground antialiased ${inter.className}`}
      >
        <Providers>
          <AnimateOnScrollInitializer />
          <PageTopLoader />
          <Header />
          <main className='flex min-h-screen flex-col gap-2 pt-[80px]'>{children}</main>
        </Providers>
      </body>
      <GoogleAnalytics gaId='G-XXXXXXXXXX' />
    </html>
  )
}
