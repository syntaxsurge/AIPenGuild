import { GoogleAnalytics } from "@next/third-parties/google"
import type { Metadata } from "next"
import Header from "@/components/layouts/header"
import localFont from "next/font/local"
import Providers from "@/providers"
import "@rainbow-me/rainbowkit/styles.css"
import "./globals.css"
import TopLoader from "@/components/top-loader"
import { AOSInit } from "@/components/aos"

const brandFont = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Bold.ttf", weight: "700" },
    { path: "./fonts/IBMPlexMono-ExtraLight.ttf", weight: "200" },
    { path: "./fonts/IBMPlexMono-Light.ttf", weight: "300" },
    { path: "./fonts/IBMPlexMono-Medium.ttf", weight: "500" },
    { path: "./fonts/IBMPlexMono-Regular.ttf", weight: "400" },
    { path: "./fonts/IBMPlexMono-SemiBold.ttf", weight: "600" },
    { path: "./fonts/IBMPlexMono-Thin.ttf", weight: "100" }
  ],
  display: "swap",
  variable: "--font-ibm-plex-mono"
})

export const metadata: Metadata = {
  title: "AIPenGuild",
  description: "AIPenGuild: The cutting-edge AI-driven NFT marketplace"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${brandFont.className} ${brandFont.variable} custom-selection antialiased`}>
        <Providers>
          <AOSInit />
          <TopLoader />
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