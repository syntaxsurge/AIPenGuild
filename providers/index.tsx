import { GlobalThemeProvider } from "@/providers/global-theme-provider";
import { RainbowKitWalletProvider } from "@/providers/rainbowkit-wallet-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GlobalThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RainbowKitWalletProvider>{children}</RainbowKitWalletProvider>
    </GlobalThemeProvider>
  );
}