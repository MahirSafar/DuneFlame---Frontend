"use client";

import React, { useState, useEffect } from "react";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * CurrencySwitcher Component
 * 
 * Usage example showing how to use the useCurrency hook to switch currencies
 * Can be placed in header, navbar, or settings page
 */
export function CurrencySwitcher() {
  const { currency, setCurrency, currencySymbol } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleCurrencyChange = (newCurrency: string) => {
    if (newCurrency === "USD" || newCurrency === "AED") {
      setCurrency(newCurrency);
      // Optionally, trigger data refetch here
      // Example using Next.js router:
      // router.refresh(); // For server component refresh
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Currency:</span>
      <Select value={currency} onValueChange={handleCurrencyChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USD">USD ($)</SelectItem>
          <SelectItem value="AED">AED (د.إ)</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-sm font-semibold">{currencySymbol}</span>
    </div>
  );
}

/**
 * Currency Toggle (Simple Button Version)
 * 
 * Alternative for simple toggle between two currencies
 */
export function CurrencyToggle() {
  const { currency, setCurrency, currencySymbol } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleCurrency = () => {
    const newCurrency = currency === "USD" ? "AED" : "USD";
    setCurrency(newCurrency);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleCurrency}
      className="flex items-center gap-2"
    >
      <span>{currencySymbol}</span>
      <span>{currency}</span>
    </Button>
  );
}

/**
 * Price Display Component
 * 
 * Example of how to use currency in product displays
 */
interface PriceDisplayProps {
  amount: number;
  showCode?: boolean;
}

export function PriceDisplay({ amount, showCode = false }: PriceDisplayProps) {
  const { currency, currencySymbol } = useCurrency();

  return (
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-semibold">{currencySymbol}</span>
      <span className="text-2xl font-bold">{amount.toFixed(2)}</span>
      {showCode && <span className="text-sm text-gray-600">{currency}</span>}
    </div>
  );
}

/**
 * Currency Context Info Component
 * 
 * Debug component to display current currency context
 */
export function CurrencyInfo() {
  const { currency, currencySymbol } = useCurrency();

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <p className="text-sm">
        <strong>Current Currency:</strong> {currency}
      </p>
      <p className="text-sm">
        <strong>Symbol:</strong> {currencySymbol}
      </p>
      <p className="text-xs text-gray-600 mt-2">
        Currency is stored in localStorage and cookies for persistence
      </p>
    </div>
  );
}
