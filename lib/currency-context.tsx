"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  CurrencyType,
  DEFAULT_CURRENCY,
  CURRENCY_STORAGE_KEY,
  CURRENCY_COOKIE_NAME,
  getCurrencySymbol,
} from "@/lib/currency-utils";

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Helper function to set currency cookie
const setCurrencyCookie = (currency: CurrencyType) => {
  if (typeof document !== "undefined") {
    // Set cookie with 1 year expiration
    const date = new Date();
    date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${CURRENCY_COOKIE_NAME}=${currency}; ${expires}; path=/; SameSite=Lax`;
  }
};

// Helper function to get currency cookie
const getCurrencyCookie = (): CurrencyType | null => {
  if (typeof document === "undefined") return null;
  
  const nameEQ = `${CURRENCY_COOKIE_NAME}=`;
  const cookies = document.cookie.split(";");
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.startsWith(nameEQ)) {
      const value = cookie.substring(nameEQ.length);
      return (value === "USD" || value === "AED") ? value : null;
    }
  }
  return null;
};

// Helper function to get initial currency from storage or cookie
const getInitialCurrency = (): CurrencyType => {
  // First, try to get from localStorage
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored === "USD" || stored === "AED") {
      return stored;
    }
  }
  
  // Then, try to get from cookie
  const fromCookie = getCurrencyCookie();
  if (fromCookie) {
    return fromCookie;
  }
  
  // Default to USD
  return DEFAULT_CURRENCY;
};

interface CurrencyProviderProps {
  children: ReactNode;
  initialCurrency?: CurrencyType;
}

export function CurrencyProvider({ children, initialCurrency }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<CurrencyType>(initialCurrency || DEFAULT_CURRENCY);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from storage on mount
  useEffect(() => {
    const initial = getInitialCurrency();
    setCurrencyState(initial);
    setIsHydrated(true);
  }, []);

  const setCurrency = (newCurrency: CurrencyType) => {
    // Update state
    setCurrencyState(newCurrency);
    
    // Persist to localStorage
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    }
    
    // Persist to cookie
    setCurrencyCookie(newCurrency);
    
    // Update the X-Currency header for future requests
    // This will be picked up by the axios interceptor
    if (typeof window !== "undefined") {
      // Dispatch custom event so axios interceptor can pick up the change
      window.dispatchEvent(
        new CustomEvent("currencyChanged", { detail: { currency: newCurrency } })
      );
    }
  };

  const value: CurrencyContextType = {
    currency: isHydrated ? currency : DEFAULT_CURRENCY,
    setCurrency,
    currencySymbol: getCurrencySymbol(isHydrated ? currency : DEFAULT_CURRENCY),
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

// Re-export from utils for backward compatibility
export { readCurrencyCookie, DEFAULT_CURRENCY } from "@/lib/currency-utils";
export type { CurrencyType } from "@/lib/currency-utils";
