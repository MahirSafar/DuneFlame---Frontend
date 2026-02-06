"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { setAxiosLocale } from "@/lib/axios";
import { setApiClientLocale, setApiClientCurrency } from "@/lib/api-client";
import { useCurrency } from "@/hooks/use-currency";

/**
 * LocaleHeaderInit Component
 * 
 * Initializes and updates the Accept-Language header and X-Currency header for all API requests
 * whenever the locale or currency changes. This component should be placed in the root layout
 * or a high-level layout component that wraps your entire application.
 * 
 * Usage in your layout:
 * ```tsx
 * import { LocaleHeaderInit } from "@/components/locale-header-init";
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <>
 *       <LocaleHeaderInit />
 *       {children}
 *     </>
 *   );
 * }
 * ```
 */
export function LocaleHeaderInit() {
  const locale = useLocale();
  const { currency } = useCurrency();

  useEffect(() => {
    // Update both axios and apiFetch instances with current locale
    setAxiosLocale(locale);
    setApiClientLocale(locale);

    // Log for debugging
    console.debug(`[LocaleHeaderInit] Updated API locale headers to: ${locale}`);
  }, [locale]);

  useEffect(() => {
    // Update apiFetch with current currency
    setApiClientCurrency(currency);

    // Log for debugging
    console.debug(`[LocaleHeaderInit] Updated API currency header to: ${currency}`);
  }, [currency]);
  // This component doesn't render anything
  return null;
}