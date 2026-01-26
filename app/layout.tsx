import type React from "react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Urbanist, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import AuthInit from "@/components/auth/auth-init"
import AuthProvider from "@/components/auth/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { DarkModeProvider } from "@/lib/dark-mode-context"
import { CurrencyProvider } from "@/lib/currency-context"
import { readCurrencyCookie, type CurrencyType } from "@/lib/currency-utils"
import { Toaster } from "react-hot-toast"

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "DuneFlame - Premium Coffee Marketplace",
  description:
    "Experience the perfect blend of warmth, aroma, and luxury. Premium coffee roasts from around the world.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Read currency from server-side cookies to prevent hydration mismatch
  const cookieStore = await cookies()
  const currencyCookie = cookieStore.get("df_currency")?.value
  const serverCurrency = (currencyCookie === "AED" ? "AED" : "USD") as CurrencyType

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${urbanist.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <DarkModeProvider>
            <CurrencyProvider initialCurrency={serverCurrency}>
              <AuthProvider>
                <AuthInit />
                {children}
                <Analytics />
                <Toaster position="top-right" />
              </AuthProvider>
            </CurrencyProvider>
          </DarkModeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
