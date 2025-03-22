import { GlobalThemeProvider } from "@/providers/GlobalThemeProvider";
import { RainbowKitWalletProvider } from "@/providers/RainbowKitWalletProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GlobalThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RainbowKitWalletProvider>{children}</RainbowKitWalletProvider>
    </GlobalThemeProvider>
  );
}