import { ThemeProvider } from "@/providers/theme-provider";
import { WalletProviders } from "@/providers/wallet-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WalletProviders>{children}</WalletProviders>
    </ThemeProvider>
  );
}
