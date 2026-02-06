/**
 * Currency Utility Functions - Server & Client Compatible
 * 
 * This file contains pure functions and types that can be safely used
 * from both server (middleware, server components) and client contexts.
 * NO "use client" directive - can be imported anywhere.
 */

export type CurrencyType = "USD" | "AED";

export const DEFAULT_CURRENCY: CurrencyType = "AED";
export const CURRENCY_COOKIE_NAME = "df_currency";
export const CURRENCY_STORAGE_KEY = "df_currency";

/**
 * Get the symbol for a given currency
 * Pure function - works on both server and client
 */
export const getCurrencySymbol = (currency: CurrencyType): string => {
  return currency === "USD" ? "$" : "د.إ";
};

/**
 * Read currency value from cookie string
 * Used in middleware and server components
 * 
 * @param cookieHeader Cookie string (e.g., from request headers or document.cookie)
 * @returns Currency type or default
 */
export function readCurrencyCookie(cookieHeader?: string): CurrencyType {
  if (!cookieHeader) return DEFAULT_CURRENCY;

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === CURRENCY_COOKIE_NAME && (value === "USD" || value === "AED")) {
      return value;
    }
  }

  return DEFAULT_CURRENCY;
}

/**
 * Validate if value is a valid currency type
 */
export function isValidCurrency(value: unknown): value is CurrencyType {
  return value === "USD" || value === "AED";
}

/**
 * Get currency name in English
 */
export function getCurrencyName(currency: CurrencyType): string {
  return currency === "USD" ? "US Dollar" : "UAE Dirham";
}

/**
 * Get currency from localStorage (client-side only)
 * Returns stored currency or default (USD)
 * Safe to call - checks for window/localStorage availability
 */
export function getCurrencyFromStorage(): CurrencyType {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored === "USD" || stored === "AED") return stored as CurrencyType;
  }
  return DEFAULT_CURRENCY;
}

/**
 * Get currency code
 */
export function getCurrencyCode(currency: CurrencyType): string {
  return currency === "USD" ? "USD" : "AED";
}

// ---------------- Pricing Helpers (compatible with new backend) ----------------

// Minimal price shape used across responses
export interface PriceVariant {
  grams: number;
  price: number;
  weightLabel?: string;
  currency?: string;
  currencyCode?: string;
  productPriceId?: string;
}

// Product shape tolerant to both legacy and new backend
export type ProductWithPricing = {
  // New backend fields
  activePrice?: PriceVariant;
  otherAvailableCurrencies?: PriceVariant[];
  // Legacy/Current fields
  availablePrices?: PriceVariant[];
};

/**
 * Extract unique, sorted weights from product pricing info
 */
export function getAvailableWeights(product: ProductWithPricing): number[] {
  const weights = new Set<number>();
  if (product.activePrice?.grams) weights.add(product.activePrice.grams);
  (product.otherAvailableCurrencies || []).forEach((p) => {
    if (typeof p.grams === "number") weights.add(p.grams);
  });
  (product.availablePrices || []).forEach((p) => {
    if (typeof p.grams === "number") weights.add(p.grams);
  });
  return Array.from(weights).sort((a, b) => a - b);
}

export interface ResolvedPrice {
  price: number;
  grams: number;
  weightLabel?: string;
  productPriceId?: string;
}

/**
 * Resolve price for selected currency and weight.
 * 
 * STRICT MODE: Returns price ONLY if BOTH currency AND grams match exactly.
 * NO fallbacks - prevents showing wrong-currency prices.
 * 
 * ROBUST: Case-insensitive currency matching + type-safe weight comparison
 * 
 * Returns null if:
 * - Weight doesn't exist for this product
 * - Currency variant not found for this weight
 * - Data is still loading from server
 * 
 * Logs all candidates for debugging.
 */
export function resolvePrice(
  product: ProductWithPricing,
  selectedCurrency: CurrencyType,
  selectedWeight: number | undefined,
): ResolvedPrice | null {
  const w = selectedWeight ?? product.activePrice?.grams;

  if (typeof w !== "number" && !w) {
    console.warn("[resolvePrice] No valid weight selected", { selectedWeight, activeGrams: product.activePrice?.grams });
    return null;
  }

  // Normalize weight to number
  const targetWeight = Number(w);
  if (isNaN(targetWeight) || targetWeight <= 0) {
    console.warn("[resolvePrice] Invalid weight value", { weight: w });
    return null;
  }

  // BUILD: Unified price array from all sources
  const allPrices: PriceVariant[] = [];
  
  if (product.activePrice) {
    allPrices.push(product.activePrice);
  }
  
  if (product.otherAvailableCurrencies?.length) {
    allPrices.push(...product.otherAvailableCurrencies);
  }
  
  if (product.availablePrices?.length) {
    allPrices.push(...product.availablePrices);
  }

  // Normalize selected currency for comparison (case-insensitive)
  const normalizedCurrency = selectedCurrency.trim().toUpperCase();

  

  // STRICT: Search by BOTH currencyCode AND grams - NO FALLBACKS
  // ROBUST: Case-insensitive currency + type-safe weight comparison
  const exactMatch = allPrices.find((p) => {
    // Normalize price currency (handle both fields, case-insensitive)
    const priceCurrency = (p.currency || p.currencyCode || "").trim().toUpperCase();
    
    // Type-safe weight comparison
    const priceGrams = Number(p.grams);
    const gramMatch = !isNaN(priceGrams) && priceGrams === targetWeight;
    
    // Case-insensitive currency match
    const currencyMatch = priceCurrency === normalizedCurrency;
    
    
    
    return gramMatch && currencyMatch;
  });

  if (exactMatch && typeof exactMatch.price === "number") {
    return {
      price: exactMatch.price,
      grams: Number(exactMatch.grams),
      weightLabel: exactMatch.weightLabel,
      productPriceId: exactMatch.productPriceId,
    };
  }

  // NO FALLBACK - Return null if exact match not found
  console.error(`[resolvePrice] ✗ STRICT MODE: No exact currency+weight match. Returning null.`, { 
    requestedCurrency: normalizedCurrency, 
    requestedWeight: targetWeight,
    availableCombos: allPrices.map(p => ({
      currency: (p.currency || p.currencyCode || "N/A").trim().toUpperCase(),
      grams: Number(p.grams),
      price: p.price,
    })),
  });
  
  return null;
}

