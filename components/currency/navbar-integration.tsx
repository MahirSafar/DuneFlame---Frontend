"use client";

import React from "react";
import { useCurrency } from "@/hooks/use-currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Navbar Integration Example
 * 
 * This is a practical example showing how to integrate the currency switcher
 * into your existing navbar/header component.
 * 
 * Place this in your navigation or adapt the CurrencySwitcher component
 * to your existing navbar structure.
 */

export function NavbarWithCurrency() {
  const { currency, setCurrency } = useCurrency();

  const handleCurrencyChange = (newCurrency: string) => {
    if (newCurrency === "USD" || newCurrency === "AED") {
      setCurrency(newCurrency);
      // Optional: You can add additional logic here such as:
      // - Tracking analytics
      // - Invalidating cache
      // - Showing a toast notification
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-amber-700">DuneFlame</h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-700 hover:text-gray-900">
              Home
            </a>
            <a href="/products" className="text-gray-700 hover:text-gray-900">
              Products
            </a>
            <a href="/about" className="text-gray-700 hover:text-gray-900">
              About
            </a>
            <a href="/contact" className="text-gray-700 hover:text-gray-900">
              Contact
            </a>
          </div>

          {/* Right side: Currency Switcher + Cart */}
          <div className="flex items-center gap-6">
            {/* Currency Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="currency-select" className="text-sm text-gray-700 font-medium">
                Currency:
              </label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger id="currency-select" className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">
                    <span className="flex items-center gap-2">
                      USD ($)
                    </span>
                  </SelectItem>
                  <SelectItem value="AED">
                    <span className="flex items-center gap-2">
                      AED (د.إ)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cart Icon */}
            <button className="text-gray-700 hover:text-gray-900">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 8m10-8l2 8m-6 0h4"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * Compact Currency Selector (for mobile/tablet)
 * 
 * Use this in a mobile menu or as a floating button
 */
export function MobileCurrencySelector() {
  const { currency, setCurrency, currencySymbol } = useCurrency();

  const toggleCurrency = () => {
    const newCurrency = currency === "USD" ? "AED" : "USD";
    setCurrency(newCurrency);
  };

  return (
    <button
      onClick={toggleCurrency}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
    >
      <span className="font-semibold">{currencySymbol}</span>
      <span className="text-sm font-medium">{currency}</span>
    </button>
  );
}

/**
 * Currency Selector in Settings/Account Page
 * 
 * Use this for a dedicated currency settings option
 */
export function CurrencySettings() {
  const { currency, setCurrency } = useCurrency();

  const handleCurrencyChange = (newCurrency: string) => {
    if (newCurrency === "USD" || newCurrency === "AED") {
      setCurrency(newCurrency);
    }
  };

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Currency Preferences</h3>

      <div className="space-y-4">
        <p className="text-gray-600">
          Select your preferred currency for pricing and checkout.
        </p>

        <div className="space-y-3">
          {(["USD", "AED"] as const).map((curr) => (
            <label key={curr} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="currency"
                value={curr}
                checked={currency === curr}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">
                {curr === "USD" ? "US Dollar ($)" : "UAE Dirham (د.إ)"}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-900">
          Your currency preference is saved and will be remembered across visits.
        </div>
      </div>
    </div>
  );
}

/**
 * INTEGRATION EXAMPLES:
 * 
 * 1. In your existing navbar:
 *    Replace your current navbar with NavbarWithCurrency
 * 
 * 2. In a mobile menu:
 *    Use MobileCurrencySelector inside your mobile navigation
 * 
 * 3. In settings/account page:
 *    Use CurrencySettings in your user preferences section
 * 
 * 4. As a floating button:
 *    <div className="fixed bottom-4 right-4">
 *      <MobileCurrencySelector />
 *    </div>
 */
