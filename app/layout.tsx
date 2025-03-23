import { GoogleAnalytics } from '@next/third-parties/google'
import localFont from 'next/font/local'

import { Metadata } from 'next'

import { AnimateOnScrollInitializer } from '@/components/AnimateOnScrollInitializer'
import Header from '@/components/layouts/Header'
import PageTopLoader from '@/components/PageTopLoader'
import Providers from '@/providers/Providers'

import '@rainbow-me/rainbowkit/styles.css'

import './globals.css'

const inter = localFont({
  src: [
    { path: '../public/fonts/Inter.ttf', style: 'normal' },
    { path: '../public/fonts/Inter-Italic.ttf', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-inter',
})

const unbounded = localFont({
  src: '../public/fonts/Unbounded.ttf',
  display: 'swap',
  variable: '--font-unbounded',
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
