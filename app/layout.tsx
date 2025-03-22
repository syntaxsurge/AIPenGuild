import { AnimateOnScrollInitializer } from "@/components/animate-on-scroll-initializer"
import Header from "@/components/layouts/header"
import PageTopLoader from "@/components/page-top-loader"
import Providers from "@/providers"
import { GoogleAnalytics } from "@next/third-parties/google"
import "@rainbow-me/rainbowkit/styles.css"
import type { Metadata } from "next"
import { Inter, Unbounded } from "next/font/google"
import "./globals.css"

/**
 * Load two fonts:
 * - Unbounded (for headings) to reflect Polkadot brand style.
 * - Inter (for body text) as a clean, readable base.
 */
const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  display: "swap"
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
})

export const metadata: Metadata = {
  title: "AIPenGuild",
  description: "AIPenGuild: The cutting-edge AI-driven NFT marketplace",
  icons: {
    icon: 'images/favicon.ico'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Attach font variables to the <html> element
    <html lang="en" className={`${unbounded.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className={`bg-background text-foreground custom-selection antialiased ${inter.className}`}>
        <Providers>
          <AnimateOnScrollInitializer />
          <PageTopLoader />
          <Header />
          <main className="flex flex-col gap-2 pt-[120px] min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
    </html>
  )
}