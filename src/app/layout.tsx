// src/app/layout.tsx
"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import BottomNav from "@/components/layout/BottomNav";
import CookieConsent from "@/components/CookieConsent";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";
import { FirebaseAuthProvider } from "@/lib/firebaseAuth"; // ← Our new provider
import { ThemeProvider } from "@/components/ThemeProvider"; // ← Theme provider for dark mode
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Only for preventing SSR flash (optional but nice)
  useEffect(() => {
    setMounted(true);
  }, []);

  const hideNav =
    pathname === "/" ||
    pathname === "/auth" ||
    pathname?.startsWith("/admin");

  // Show nothing or a blank screen until client is mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} bg-background text-foreground`}>
          <main className="min-h-screen" />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning className="bg-[#FFF8F0] dark:bg-gray-950">
      <head>
        {/* CRITICAL SEO FIX: Base meta tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#7C3AED" />
        <meta name="description" content="Nigeria's #1 campus marketplace for students. Book lashes, nails, laundry, and food from verified vendors at Pan-Atlantic University. Fast, safe, and affordable." />
        <meta name="keywords" content="campus marketplace, student services, PAU marketplace, Pan-Atlantic University, student vendors, lashes, nails, laundry, food delivery" />

        {/* Open Graph */}
        <meta property="og:site_name" content="StudEx" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_NG" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@studexng" />

        {/* Mobile */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StudEx" />

        {/* Favicons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        <title>StudEx - Campus Marketplace for Student Services | PAU</title>
      </head>
      <body className={`${inter.className} bg-[#FFF8F0] dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
        <ThemeProvider>
          <FirebaseAuthProvider>
            <main className={hideNav ? "min-h-screen bg-[#FFF8F0] dark:bg-gray-950" : "min-h-screen bg-[#FFF8F0] dark:bg-gray-950 pb-[5.5rem]"}>
              {children}
            </main>

            {!hideNav && (
              <div className="fixed inset-x-0 bottom-0 z-50">
                <BottomNav />
              </div>
            )}

            <CookieConsent />

            <Toaster position="top-center" richColors closeButton />
          </FirebaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}