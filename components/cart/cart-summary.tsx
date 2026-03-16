"use client"

import { Link } from "@/i18n/routing"
import { Trash2 } from "lucide-react"
import { useEffect } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useCartStore } from "@/lib/cart-store"
import { useCurrency } from "@/lib/currency-context"
import { getImageUrl } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"
import { setApiClientLocale } from "@/lib/api-client"
import { FormattedPrice } from "@/components/currency/formatted-price"
import { CartExpressCheckout } from "@/components/cart/cart-express-checkout"
import { StripeElementsProvider } from "@/components/payment/stripe-elements-provider"

export default function CartSummary() {
  const t = useTranslations()
  const locale = useLocale()
  const { accessToken } = useAuthStore()
  const { currency } = useCurrency()
  const { items, removeItem, updateQuantity, total, getItemPrice } = useCartStore()
  const isAuthenticated = !!accessToken

  // Force re-render when currency changes to update all prices dynamically
  useEffect(() => {
    // This dependency ensures all price calculations update when currency changes
  }, [currency])

  // Ensure locale is set in API client before fetching products
  useEffect(() => {
    setApiClientLocale(locale)
  }, [locale])

  // Refresh product names when locale changes
  useEffect(() => {
    const refreshProductNames = async () => {
      if (items.length === 0) {
        return
      }

      // Note: Product translation disabled due to endpoint availability issues
      // Using product names from cart store data
    }

    refreshProductNames()
  }, [locale])

  if (items.length === 0) {
    return (
      <div className="glass rounded-xl p-12 text-center">
        <p className="text-muted-foreground text-lg mb-6">{t('cart.empty')}</p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg transition-smooth"
        >
          {t('cart.continueShoppping')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-3 md:space-y-4">
        {items.map((item, index) => (
          <Link
            key={`${item.variantKey || item.id}-${index}`}
            href={`/product/${item.slug || item.id}`}
            className="glass rounded-xl p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 group hover:shadow-lg transition-smooth"
          >
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getImageUrl(item.imageUrl) || ""}
                  alt={item.name}
                  className="w-16 md:w-20 h-16 md:h-20 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-16 md:w-20 h-16 md:h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                  ☕
                </div>
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="font-semibold text-primary group-hover:text-accent transition-smooth text-sm md:text-base truncate">
                  {item.name}
                </h3>
                {/* Display the dynamic price in current currency */}
                <FormattedPrice amount={getItemPrice(item, currency)} className="text-xs md:text-sm font-medium text-accent" />
                
                {/* Selected Attributes Display - FORCED */}
                <div className="text-xs text-muted-foreground mt-1 md:mt-2 flex flex-wrap gap-1 md:gap-2">
                  {item.selectedWeightLabel && (
                    <span className="bg-gray-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded border border-gray-200 text-xs">
                      {t('common.weight')}: {item.selectedWeightLabel}
                    </span>
                  )}
                  {item.selectedRoast && (
                    <span className="bg-gray-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded border border-gray-200 text-xs">
                      {t('common.roast')}: {item.selectedRoast}
                    </span>
                  )}
                  {item.selectedGrind && (
                    <span className="bg-gray-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded border border-gray-200 text-xs">
                      {t('common.grind')}: {item.selectedGrind}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 md:ml-auto" onClick={(e) => e.preventDefault()}>
              <div className="flex items-center border border-border rounded-lg text-sm">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    updateQuantity(item.variantKey || item.id, Math.max(1, item.quantity - 1), isAuthenticated)
                  }}
                  className="p-1 md:p-1.5 hover:bg-accent/10 transition-smooth"
                >
                  −
                </button>
                <span className="px-2 md:px-3 font-semibold text-xs md:text-base">{item.quantity}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    updateQuantity(item.variantKey || item.id, item.quantity + 1, isAuthenticated)
                  }}
                  className="p-1 md:p-1.5 hover:bg-accent/10 transition-smooth"
                >
                  +
                </button>
              </div>

              <span className="w-16 md:w-20 text-right font-semibold text-primary text-sm md:text-base">
                <FormattedPrice amount={getItemPrice(item, currency) * item.quantity} />
              </span>

              <button
                onClick={(e) => {
                  e.preventDefault()
                  // Use cartItemId (backend item id) for DELETE /basket/{itemId};
                  // fallback to variantKey/id for local-only items
                  const idToRemove = item.cartItemId || item.variantKey || item.id
                  removeItem(idToRemove, isAuthenticated)
                }}
                className="p-1.5 md:p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-smooth"
              >
                <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
              </button>
            </div>
          </Link>
        ))}
      </div>

      <div className="glass rounded-xl p-3 md:p-6 space-y-3 md:space-y-4">
        <div className="border-border pt-3 md:pt-4 flex flex-col md:flex-row md:justify-end md:gap-4 gap-2 font-bold text-sm md:text-lg" style={{ color: '#2b1b13' }}>
          <span>{t('cart.total')}</span>
          <FormattedPrice amount={total(currency)} />
        </div>

        {/* Express Checkout - Apple Pay / Google Pay */}
        <StripeElementsProvider>
          <CartExpressCheckout className="mb-4" />
        </StripeElementsProvider>

        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <Link
            href="/products"
            className="flex-1 px-3 md:px-6 py-2 md:py-3 border border-border hover:bg-muted rounded-lg transition-smooth text-center font-semibold text-xs md:text-base"
          >
            {t('cart.continueShoppping')}
          </Link>

          <Link
            href="/checkout"
            className="flex-1 px-3 md:px-6 py-2 md:py-3 text-accent-foreground font-bold rounded-lg transition-smooth flex items-center justify-center text-xs md:text-base"
            style={{ backgroundColor: '#2b1b13' }}
          >
            {t('cart.checkout')}
          </Link>
        </div>
      </div>
    </div>
  )
}
