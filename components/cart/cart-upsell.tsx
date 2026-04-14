"use client"

import { useCartRecommendation } from "@/hooks/use-cart-recommendation"
import { useCartStore, type CartItem, EMPTY_GUID } from "@/lib/cart-store"
import { useAuthStore } from "@/lib/auth-store"
import { Progress } from "@/components/ui/progress"
import { FormattedPrice } from "@/components/currency/formatted-price"
import { useCurrency } from "@/lib/currency-context"
import { Plus, CheckCircle2 } from "lucide-react"
import { getImageUrl } from "@/lib/utils"
import { useEffect } from "react"

export function CartUpsell({ countryCode }: { countryCode?: string } = {}) {
  const { data, isLoading, fetchRecommendation } = useCartRecommendation(countryCode)
  const addItem = useCartStore((state) => state.addItem)
  const items = useCartStore((state) => state.items) // Səbətdəki məhsulları izləyirik
  const isAuthenticated = !!useAuthStore((state) => state.accessToken)
  const { currency } = useCurrency()

  // Guard: Hide immediately if country is chosen and not UAE
  if (countryCode && countryCode !== "AE") {
    return null;
  }

  // Loading animasiyasını gizlədirik ki, >200 olanda ekranda ağ flash yaranmasın
  if (isLoading && !data) {
    return null; 
  }

  if (!data) {
    return null;
  }

  const { targetThreshold, currentSubtotal, gapAmount, recommendation } = data
  const isFreeShippingMet = currentSubtotal >= targetThreshold
  const progressPercent = isFreeShippingMet ? 100 : Math.min((currentSubtotal / targetThreshold) * 100, 100)

  const recommendationDisplayPrice = recommendation?.availablePrices?.[currency.toUpperCase()] ?? recommendation?.availablePrices?.[currency.toLowerCase()] ?? recommendation?.price ?? 0;

  // Əgər limit keçilibsə və biz "Təbriklər" mesajını göstərmək istəmiriksə, bunu `return null` edə bilərik.
  // Amma hələlik göstəririk:
  if (isFreeShippingMet) {
      return (
        <div className="glass rounded-xl p-4 flex items-center gap-2 mb-6 border border-green-100 bg-green-50/30">
           <CheckCircle2 className="w-5 h-5 text-green-500" />
           <span className="text-green-700 font-medium text-sm">Congratulations! You qualify for Free Shipping!</span>
        </div>
      );
  }

  const handleAddField = () => {
    if (recommendation) {
      const numericWeight = parseInt(recommendation.weightLabel.replace(/\D/g, '')) || 250;
      
      const mappedPrices = recommendation.availablePrices 
        ? Object.entries(recommendation.availablePrices).map(([cur, pr]) => ({
            currencyCode: cur.toUpperCase(),
            price: pr,
            grams: numericWeight,
            weightLabel: recommendation.weightLabel,
            productVariantId: recommendation.productVariantId
          }))
        : [];

      addItem(
        {
          id: recommendation.productId,
          productVariantId: recommendation.productVariantId,
          slug: recommendation.slug,
          name: recommendation.name,
          price: recommendation.price,
          prices: mappedPrices,
          quantity: 1,
          imageUrl: recommendation.imageUrl,
          sku: "",
          attributes: [recommendation.weightLabel || "250g"],
          roastLevelId: EMPTY_GUID,
          roastLevelName: "Original",
          grindTypeId: EMPTY_GUID,
          grindTypeName: "Whole Bean",
        } as unknown as CartItem,
        isAuthenticated
      )
      fetchRecommendation() // Səbətə atandan sonra yenidən hesabla
    }
  }

  return (
    <div className="glass rounded-xl p-4 md:p-5 flex flex-col gap-3 md:gap-4 mb-6 relative overflow-hidden border border-border bg-linear-to-b from-white/60 to-transparent">
      
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex justify-between items-start text-sm font-semibold mb-1">
          <p className="text-primary leading-snug pr-2">
            You are <span className="text-accent font-bold whitespace-nowrap mx-1"><FormattedPrice amount={gapAmount} /></span> away from Free Shipping!
          </p>
          <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
            {progressPercent.toFixed(0)}%
          </span>
        </div>

        <Progress 
           value={progressPercent} 
           className="h-2 rounded-full mx-1 bg-gray-200" 
        />
      </div>

      {recommendation && (
        <div className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-primary/10 shadow-sm mt-1 transition-smooth">
          <div className="flex items-center gap-3 w-full min-w-0">
            {recommendation.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageUrl(recommendation.imageUrl) || ""}
                alt={recommendation.name}
                className="w-12 h-12 object-cover rounded shadow-sm border border-black/5 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-accent/10 rounded flex items-center justify-center shrink-0 text-xl shadow-sm">
                ☕
              </div>
            )}
            
          <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-semibold text-primary truncate">
                {recommendation.name}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <span>{recommendation.weightLabel}</span>
                <span className="px-1">•</span>
                <FormattedPrice amount={recommendationDisplayPrice} className="font-bold text-accent" />
              </div>
            </div>
          </div>

          <button
            onClick={handleAddField}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] sm:text-xs font-semibold rounded-md transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      )}
    </div>
  )
}