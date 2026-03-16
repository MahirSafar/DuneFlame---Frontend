"use client";

import React, { useEffect, useState } from "react";
import { useCurrency } from "@/hooks/use-currency";
import { CurrencySwitcher, CurrencyToggle, PriceDisplay } from "@/components/currency/currency-switcher";

/**
 * Example Layout Component showcasing Currency System Integration
 * 
 * This component demonstrates:
 * 1. Using the useCurrency hook
 * 2. Displaying currency information
 * 3. Re-fetching data when currency changes
 * 4. Displaying prices with correct currency
 */
export function ExampleCurrencyLayout() {
  const { currency, setCurrency, currencySymbol } = useCurrency();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products when currency changes
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Example API call - the X-Currency header is automatically added by axios interceptor
        // const response = await axios.get('/products')
        // setProducts(response.data)

        // Mock data for demo:
        setProducts([
          {
            id: 1,
            name: "Premium Arabica",
            price: 45.99,
            activePrice: currency === "USD" ? 45.99 : 168.81,
          },
          {
            id: 2,
            name: "Ethiopian Blend",
            price: 38.5,
            activePrice: currency === "USD" ? 38.5 : 141.35,
          },
          {
            id: 3,
            name: "Colombian Roast",
            price: 52.0,
            activePrice: currency === "USD" ? 52.0 : 190.96,
          },
        ]);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [currency]); // Re-fetch when currency changes

  const handleCurrencyChange = async (newCurrency: "USD" | "AED") => {
    setCurrency(newCurrency);
    // Data will be refetched automatically due to useEffect dependency
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <header className="mb-8 pb-6 border-b">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">DuneFlame Premium Coffee</h1>
          <CurrencySwitcher />
        </div>
        <p className="text-gray-600">
          Current Currency: <strong>{currency}</strong> ({currencySymbol})
        </p>
      </header>

      {/* Alternative: Simple Toggle Button */}
      <div className="mb-6">
        <label className="text-sm text-gray-700 mr-3">Quick Toggle:</label>
        <CurrencyToggle />
      </div>

      {/* Status Section */}
      <section className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold mb-2">System Status</h2>
        <p className="text-sm text-gray-700">
          Currency is stored in localStorage and cookies. When you switch currency:
        </p>
        <ul className="text-sm text-gray-700 mt-2 ml-4 list-disc">
          <li>Context state updates immediately</li>
          <li>localStorage gets updated</li>
          <li>Cookie gets set (1 year expiration)</li>
          <li>X-Currency header sent with all API requests</li>
          <li>Products are re-fetched with new currency</li>
        </ul>
      </section>

      {/* Products Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Our Products</h2>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="bg-gray-100 h-40" />

                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>

                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 mb-1">Price</p>
                    <PriceDisplay amount={product.activePrice} showCode={true} />
                  </div>

                  <button className="w-full bg-amber-600 text-white py-2 rounded hover:bg-amber-700 transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Debug Info */}
      <section className="mt-12 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-3">Debug Information</h3>
        <div className="space-y-2 text-sm font-mono">
          <p>Currency: {currency}</p>
          <p>Symbol: {currencySymbol}</p>
          <p>
            Stored in localStorage: <code>df_currency</code>
          </p>
          <p>
            Cookie name: <code>df_currency</code>
          </p>
          <p>
            API Header: <code>X-Currency: {currency}</code>
          </p>
        </div>
      </section>

      {/* Storage Inspector */}
      <section className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="font-semibold mb-3 text-amber-900">Storage Inspector</h3>
        <details className="text-sm cursor-pointer">
          <summary className="font-medium text-amber-900">
            Open browser DevTools to inspect:
          </summary>
          <ul className="mt-2 ml-4 space-y-1 text-amber-800 list-disc">
            <li>
              localStorage → key: <code>df_currency</code> → value: {currency}
            </li>
            <li>
              Application → Cookies → <code>df_currency</code> = {currency}
            </li>
            <li>
              Network → any request → Headers → <code>X-Currency</code> = {currency}
            </li>
          </ul>
        </details>
      </section>
    </div>
  );
}

/**
 * USAGE EXAMPLE IN A ROUTE:
 * 
 * app/example/page.tsx:
 * ----------------------
 * import { ExampleCurrencyLayout } from "@/components/currency/example-layout"
 * 
 * export default function ExamplePage() {
 *   return <ExampleCurrencyLayout />
 * }
 */
