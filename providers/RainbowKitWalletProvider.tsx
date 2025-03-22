'use client'

import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
  getDefaultWallets,
} from '@rainbow-me/rainbowkit'
import { ledgerWallet, trustWallet } from '@rainbow-me/rainbowkit/wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { moonbaseAlpha } from 'viem/chains'
import { WagmiProvider } from 'wagmi'
import { customMoonbeamChain, westendAssetHubChain } from '@/lib/chain-utils'

/**
 * We build a config for Wagmi + RainbowKit that includes the
 * custom chain definitions we imported from chain-utils.
 */
const { wallets } = getDefaultWallets()

const config = getDefaultConfig({
  appName: 'AIPenGuild.com',
  projectId: '455a9939d641d79b258424737e7f9205',
  chains: [westendAssetHubChain, customMoonbeamChain, moonbaseAlpha],
  wallets: [
    ...wallets,
    {
      groupName: 'Other',
      wallets: [trustWallet, ledgerWallet],
    },
  ],
  ssr: true,
})

const queryClient = new QueryClient()

export function RainbowKitWalletProvider({ children }: { children: any }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={0}
          showRecentTransactions={true}
          theme={darkTheme({
            accentColor: '#7856ff',
            accentColorForeground: 'white',
            borderRadius: 'none',
          })}
          locale='en-US'
        >
          {mounted && children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
