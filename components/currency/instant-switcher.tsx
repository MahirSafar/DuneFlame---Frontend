"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCurrency } from "@/hooks/use-currency";
import { CurrencyType } from "@/lib/currency-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

/**
 * Dropdown Currency Switcher
 * 
 * Features:
 * - Clean dropdown menu interface
 * - Shows current currency
 * - Easy currency switching between USD and AED
 */
export function InstantCurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleCurrencyChange = (newCurrency: CurrencyType) => {
    if (newCurrency !== currency) {
      setCurrency(newCurrency);
    }
  };

  const currencyLabels: Record<CurrencyType, string> = {
    USD: "$ USD",
    AED: "د.إ AED"
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-white hover:text-white text-xs font-medium"
          style={{ backgroundColor: "#2b1b13", borderColor: "#2b1b13" }}
          aria-label="Select currency"
        >
          {currencyLabels[currency]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuCheckboxItem
          checked={currency === "USD"}
          onCheckedChange={() => handleCurrencyChange("USD")}
          className="cursor-pointer"
        >
          $ USD
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={currency === "AED"}
          onCheckedChange={() => handleCurrencyChange("AED")}
          className="cursor-pointer"
        >
          د.إ AED
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Compact version for mobile devices
 * Shows only currency symbols with animated background pill
 */
export function InstantCurrencySwitcherCompact() {
  const { currency, setCurrency } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleCurrencyChange = (newCurrency: CurrencyType) => {
    if (newCurrency !== currency) {
      setCurrency(newCurrency);
    }
  };

  const isUSDActive = currency === "USD";
  const isAEDActive = currency === "AED";

  return (
    <div className="relative inline-flex gap-0.5 bg-gray-100 rounded-full p-0.5">
      {/* Animated background pill */}
      <motion.div
        layoutId="active-pill-compact"
        className="absolute inset-y-0.5 rounded-full shadow-sm"
        initial={false}
        transition={{
          type: "spring",
          bounce: 0.2,
          duration: 0.6,
        }}
        style={{
          backgroundColor: '#4B2E2B',
          left: isUSDActive ? "2px" : "calc(50% + 1px)",
          right: isUSDActive ? "calc(50% + 1px)" : "2px",
        }}
      />

      {/* USD Button */}
      <motion.button
        onClick={() => handleCurrencyChange("USD")}
        aria-pressed={isUSDActive}
        aria-label="USD"
        title="United States Dollar"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative px-2.5 py-1 rounded-full font-semibold text-xs
          transition-colors duration-200 z-10
          ${
            isUSDActive
              ? "text-white"
              : "text-white"
          }
        `}
      >
        $
      </motion.button>

      {/* AED Button */}
      <motion.button
        onClick={() => handleCurrencyChange("AED")}
        aria-pressed={isAEDActive}
        aria-label="AED"
        title="United Arab Emirates Dirham"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative px-2.5 py-1 rounded-full font-semibold text-xs
          transition-colors duration-200 z-10
          ${
            isAEDActive
              ? "text-white"
              : "text-white"
          }
        `}
      >
        د.إ
      </motion.button>
    </div>
  );
}

/**
 * Mobile Compact Instant Switcher
 * Smaller version for mobile devices
 */
export function InstantCurrencySwitcherMobile() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="inline-flex gap-0.5 bg-gray-100 rounded-full p-0.5">
      <button
        onClick={() => setCurrency("USD")}
        className={`
          px-2 py-1 rounded-full font-semibold text-xs transition-all duration-200
          ${
            currency === "USD"
              ? "text-white"
              : "text-white"
          }
        `}
        style={currency === "USD" ? { backgroundColor: '#4B2E2B' } : {}}
      >
        $
      </button>

      <button
        onClick={() => setCurrency("AED")}
        className={`
          px-2 py-1 rounded-full font-semibold text-xs transition-all duration-200
          ${
            currency === "AED"
              ? "text-white"
              : "text-white"
          }
        `}
        style={currency === "AED" ? { backgroundColor: '#4B2E2B' } : {}}
      >
        د.إ
      </button>
    </div>
  );
}

/**
 * USAGE IN NAVBAR:
 * 
 * import { InstantCurrencySwitcher } from "@/components/currency/instant-switcher";
 * 
 * export function Navbar() {
 *   return (
 *     <nav className="flex justify-between items-center">
 *       <h1>DuneFlame</h1>
 *       <InstantCurrencySwitcher />
 *     </nav>
 *   );
 * }
 */
