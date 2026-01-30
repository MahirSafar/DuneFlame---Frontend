"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { setAxiosLocale } from "@/lib/axios";
import { setApiClientLocale } from "@/lib/api-client";

/**
 * LocaleHeaderInit Component
 * 
 * Initializes and updates the Accept-Language header for all API requests
 * whenever the locale changes. This component should be placed in the root layout
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

  useEffect(() => {
    // Update both axios and apiFetch instances with current locale
    setAxiosLocale(locale);
    setApiClientLocale(locale);

    // Log for debugging
    console.debug(`[LocaleHeaderInit] Updated API locale headers to: ${locale}`);
  }, [locale]);

  // This component doesn't render anything
  return null;
}
