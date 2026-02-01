"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Eye } from "lucide-react"
import type { ProductResponse } from "@/lib/services/products"
import { useLocale } from "next-intl"
import { getImageUrl } from "@/lib/utils"
import ProductVariantModal from "./product-variant-modal"
import { useCurrency } from "@/hooks/use-currency"
import { resolvePrice, getAvailableWeights, type ProductWithPricing } from "@/lib/currency-utils"
import { FormattedPrice } from "@/components/currency/formatted-price"
import { useTranslations } from "next-intl"

interface ProductCardProps {
  product: ProductResponse
}

export default function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale();
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { currency, currencySymbol } = useCurrency()
  const t = useTranslations()

  const rawMainImage = product.images?.find((i) => i.isMain)?.imageUrl || product.images?.[0]?.imageUrl
  const mainImage = rawMainImage ? getImageUrl(rawMainImage) : null
  const hasImage = Boolean(mainImage)

  const productUrl = product.slug ? `/product/${product.slug}` : `/product/${product.id}`
  const defaultWeight = useMemo(() => {
    const weights = getAvailableWeights(product as unknown as ProductWithPricing)
    if (weights.length) return weights[0]
    return product.availablePrices?.[0]?.grams
  }, [product])

  const resolved = useMemo(() => {
    const result = resolvePrice(product as unknown as ProductWithPricing, currency, defaultWeight ?? undefined);
    if (!result) {
      console.warn(`[ProductCard] No price resolved for product "${product.name}" (ID: ${product.id}, currency: ${currency}, weight: ${defaultWeight})`);
    }
    return result;
  }, [product, currency, defaultWeight])
  
  // Bulletproof: Always have a valid number for display
  const displayPrice = resolved?.price ?? 0;
  const isPriceAvailable = displayPrice > 0;
  
  let flavorNotes = t('products.card.signature');
  if (Array.isArray(product.flavourNotes) && product.flavourNotes.length > 0) {
    // Try to get translation for current locale, fallback to English, then fallback to name
    flavorNotes = product.flavourNotes
      .map(note => {
        const translation = note.translations?.find(tr => tr.languageCode === locale)
          || note.translations?.find(tr => tr.languageCode === 'en');
        return translation?.name || note.name;
      })
      .join(", ");
  }
  const origin = product.originName || product.categoryName || "DuneFlame"

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsModalOpen(true)
  }

  return (
    <article className="group relative glass rounded-xl overflow-hidden card-float card-depth cursor-pointer transition-all duration-500 ease-in-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:glow-accent">
        <Link
          href={productUrl}
          className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="relative h-64 overflow-hidden bg-muted rounded-t-xl">
            {hasImage && mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 flex items-center justify-center group-hover:scale-110 transition-all duration-500 ease-in-out">
                <div className="text-6xl group-hover:animate-float">☕</div>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent z-10 group-hover:from-black/50 transition-all duration-500 ease-in-out" />
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-espresso-brown font-semibold uppercase tracking-wider font-heading">{origin}</p>
                <h3 className="text-lg font-bold text-primary dark:text-secondary text-balance group-hover:text-accent transition-smooth uppercase">
                  {product.name}
                </h3>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 group-hover:text-muted-foreground/80 transition-smooth whitespace-nowrap overflow-hidden text-ellipsis">
              {flavorNotes}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-lg font-heading text-primary dark:text-secondary">
                {isPriceAvailable ? (
                  <FormattedPrice amount={displayPrice} />
                ) : (
                  <span className="text-muted-foreground text-base">{t('common.actions.loadingPrice')}</span>
                )}
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-center justify-between px-4 pb-4 pt-2">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Signature pick</span>
        </div>

        {/* Quick View Button - At bottom of card */}
        <button
          onClick={openModal}
          className="absolute bottom-0 left-0 right-0 z-20 py-2 px-4 font-heading flex items-center justify-center gap-2 transition-all duration-300 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 rounded-b-xl uppercase"
          style={{ backgroundColor: "#2b1b13", color: "white" }}
        >
          <Eye size={16} />
          QUICK VIEW
        </button>

        <ProductVariantModal product={product} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </article>
    )
}
