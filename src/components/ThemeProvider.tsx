// src/components/ThemeProvider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

/**
 * Theme Provider Component
 *
 * Wraps the app with next-themes provider for dark mode support.
 *
 * Features:
 * - Automatic system theme detection
 * - localStorage persistence
 * - No flash on page load
 * - Support for light/dark/system modes
 *
 * Usage in layout.tsx:
 * <ThemeProvider>
 *   {children}
 * </ThemeProvider>
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
