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

// ---------------- Pricing Helpers (compatible with variant engine) ----------------

// Minimal price shape used across responses
export interface PriceVariant {
  price: number;
  currencyCode?: string;
  variantId?: string;
}

// Product shape tolerant to both legacy and new backend
export type ProductWithPricing = {
  variants?: Array<{
    id: string;
    sku: string;
    price: number;
    prices?: { currencyCode: string; price: number }[];
    options?: { attributeName: string; value: string }[];
  }>;
};

/**
 * Extract unique option values for a given attribute name from product variants
 */
export function getAvailableWeights(product: ProductWithPricing): string[] {
  const values = new Set<string>();
  (product.variants || []).forEach((v) => {
    const weight = v.options?.find(o => o.attributeName.toLowerCase() === 'weight');
    if (weight) values.add(weight.value);
  });
  return Array.from(values);
}

export interface ResolvedPrice {
  price: number;
  variantId?: string;
  sku?: string;
}

/**
 * Resolve price for selected currency and variant.
 * 
 * Uses the new variant engine: iterates product.variants[].prices[] to find
 * currency-specific pricing. Falls back to variant.price (base AED price).
 */
export function resolvePrice(product: any, selectedCurrency?: string, selectedVariantId?: string): ResolvedPrice | null {
  const variants = product?.variants;
  if (!variants?.length) return null;

  // If a specific variant is selected, find it
  if (selectedVariantId) {
    const variant = variants.find((v: any) => v.id === selectedVariantId);
    if (variant) {
      const currencyPrice = selectedCurrency
        ? variant.prices?.find((p: any) => p.currencyCode === selectedCurrency)?.price
        : undefined;
      return {
        price: currencyPrice ?? variant.price ?? 0,
        variantId: variant.id,
        sku: variant.sku,
      };
    }
  }

  // Fallback: first variant
  const firstVariant = variants[0];
  if (firstVariant) {
    const currencyPrice = selectedCurrency
      ? firstVariant.prices?.find((p: any) => p.currencyCode === selectedCurrency)?.price
      : undefined;
    return {
      price: currencyPrice ?? firstVariant.price ?? 0,
      variantId: firstVariant.id,
      sku: firstVariant.sku,
    };
  }

  return null;
}