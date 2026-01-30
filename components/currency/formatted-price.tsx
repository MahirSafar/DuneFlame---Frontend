"use client";

import { useCurrency } from "@/hooks/use-currency";

interface FormattedPriceProps {
  amount: number;
  showCode?: boolean;
  className?: string;
}

/**
 * FormattedPrice - Centralized currency-aware price display
 * Automatically uses the selected currency symbol and proper formatting
 */
export function FormattedPrice({ amount, showCode = false, className = "" }: FormattedPriceProps) {
  const { currency, currencySymbol } = useCurrency();

  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className={`text-espresso-brown ${className}`}>
      {currencySymbol}
      {formatted}
      {showCode && <span className="text-sm text-muted-foreground ml-1">{currency}</span>}
    </span>
  );
}
