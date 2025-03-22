'use client'

import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from 'next-themes'

export function GlobalThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
