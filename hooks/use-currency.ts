"use client";

import { useCurrency as useContextCurrency } from "@/lib/currency-context";
import { CurrencyType } from "@/lib/currency-utils";
import { useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import instance from "@/lib/axios";
import { setApiClientCurrency } from "@/lib/api-client";

/**
 * Custom hook for currency management
 * 
 * Usage:
 * const { currency, setCurrency, currencySymbol } = useCurrency();
 * 
 * When setCurrency is called, it will:
 * 1. Update the currency context
 * 2. Persist to localStorage and cookies
 * 3. Update the X-Currency header for future requests via axios instance AND apiFetch
 * 4. Refresh Server Components to fetch new data with updated currency
 */
export function useCurrency() {
  const router = useRouter();
  const { currency, setCurrency: setContextCurrency, currencySymbol } = useContextCurrency();

  const setCurrency = useCallback(
    async (newCurrency: CurrencyType) => {
      // Update context (this persists to localStorage and cookies)
      setContextCurrency(newCurrency);

      // Update axios instance headers for all future requests
      // This ensures the X-Currency header is sent with correct value
      if (instance.defaults.headers.common) {
        instance.defaults.headers.common["X-Currency"] = newCurrency;
      }

      // Update apiFetch currency for all future requests
      // This ensures apiFetch (fetch-based) requests also send the currency header
      setApiClientCurrency(newCurrency);

      // Refresh server components to fetch data with new currency
      // This ensures Server Components receive updated data based on new currency
      router.refresh();
    },
    [setContextCurrency, router]
  );

  return {
    currency,
    setCurrency,
    currencySymbol,
  };
}

export type { CurrencyType };
