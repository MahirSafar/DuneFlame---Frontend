import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/axios";
import { useCartStore } from "@/lib/cart-store";
import { useCurrency } from "@/lib/currency-context";

export interface RecommendationResponse {
  targetThreshold: number;
  currentSubtotal: number;
  gapAmount: number;
  recommendation?: {
    productId: string;
    productVariantId: string;
    name: string;
    slug: string;
    imageUrl: string;
    price: number;
    currencyCode: string;
    weightLabel: string;
    availablePrices?: Record<string, number>;
  };
}

export function useCartRecommendation(countryCode?: string) {
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.total);
  const { currency } = useCurrency();
  
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendation = useCallback(async () => {
    // Hide if country is defined and is NOT United Arab Emirates
    if (countryCode && countryCode !== "AE") {
      setData(null);
      return;
    }

    // If cart is empty, return early with null data
    if (items.length === 0) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const currentTotal = total(currency);
    const excludedIds = items.map((item) => item.variantId);

    try {
      const response = await apiFetch<RecommendationResponse>(`/basket/recommendation/stateless`, { 
        method: "POST",
        body: JSON.stringify({ currentSubtotal: currentTotal, excludedProductVariantIds: excludedIds })
      });
      
      // If 204 No Content, response is undefined/empty string
      if (response) {
        setData(response);
      } else {
        setData(null);
      }
    } catch (err: any) {
      setError(err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [items, total, currency, countryCode]);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  return {
    data,
    isLoading,
    isError: error,
    fetchRecommendation,
  };
}