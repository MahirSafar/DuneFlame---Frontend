import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Urbanist, Inter, Noto_Sans_Arabic } from "next/font/google"
import "./globals.css"
import { notFound } from "next/navigation"
import { locales, type Locale } from "@/i18n/routing"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import AuthInit from "@/components/auth/auth-init"
import AuthProvider from "@/components/auth/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { CurrencyProvider } from "@/lib/currency-context"
import { ToasterWrapper } from "@/components/toaster-wrapper"
import { LocaleHeaderInit } from "@/components/locale-header-init"
import PaymentScriptInit from "@/components/payment-script-init"
import GoogleSDKScript from "@/components/GoogleSDKScript"
import { cookies } from "next/headers"
import type { CurrencyType } from "@/lib/currency-utils"

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

// Arabic font for better text rendering in RTL
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const messages = (await import(`../../messages/${locale}.json`)).default
  const homeMetadata = messages.metadata?.home || {
    title: "DuneFlame - Premium Coffee Marketplace",
    description:
      "Experience the perfect blend of warmth, aroma, and luxury. Premium coffee roasts from around the world.",
  }

  return {
    title: { template: '%s - Duneflame', default: 'Duneflame - Premium Coffee Marketplace' },
    description: homeMetadata.description,
    generator: "v0.app",
    metadataBase: new URL("https://duneflame.com"),
    alternates: {
      languages: {
        en: "https://duneflame.com/en",
        ar: "https://duneflame.com/ar",
      },
    },
    icons: {
      icon: [
        {
          url: "/logo.svg",
          sizes: "192x192",
          type: "image/svg+xml",
        },
        {
          url: "/logo.svg",
          sizes: "512x512",
          type: "image/svg+xml",
        },
      ],
      apple: "/logo.svg",
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // Fetch messages for next-intl
  const messages = await getMessages()

  // Read currency from server-side cookies to prevent hydration mismatch
  const cookieStore = await cookies()
  const currencyCookie = cookieStore.get("df_currency")?.value
  const serverCurrency = (currencyCookie === "AED" ? "AED" : "USD") as CurrencyType

  // Determine text direction based on locale
  const direction = locale === "ar" ? "rtl" : "ltr"
  const isArabic = locale === "ar"

  return (
    <html
      lang={locale}
      dir={direction}
      suppressHydrationWarning
      className={isArabic ? notoSansArabic.variable : ""}
    >
      <head>
        {/* Preload critical image domain to reduce LCP delay */}
        <link rel="preconnect" href="https://storage.googleapis.com" />
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />
        
        {/* External Payment & Auth Scripts - Load lazily so they don't block user experience */}
        {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
          <Script
            src="https://js.stripe.com/v3/"
            strategy="lazyOnload"
            crossOrigin="anonymous"
          />
        )}
        
        <GoogleSDKScript />

        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/logo.svg" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <meta name="theme-color" content="#2b1b13" />
      </head>
      <body
        className={`${urbanist.variable} ${inter.variable} ${notoSansArabic.variable} ${
          isArabic ? "font-arabic" : "font-sans"
        } antialiased bg-background text-foreground`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <CurrencyProvider initialCurrency={serverCurrency}>
              <AuthProvider>
                <LocaleHeaderInit />
                <AuthInit />
                <PaymentScriptInit />
                {children}
                <ToasterWrapper />
              </AuthProvider>
            </CurrencyProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
