"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import type { ProductResponse } from "@/lib/services/products"
import { getImageUrl } from "@/lib/utils"
import ProductVariantModal from "./product-variant-modal"
import { useCurrency } from "@/hooks/use-currency"
import { resolvePrice, getAvailableWeights, type ProductWithPricing } from "@/lib/currency-utils"
import { FormattedPrice } from "@/components/currency/formatted-price"

interface ProductCardProps {
  product: ProductResponse
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { currency, currencySymbol } = useCurrency()

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
  
  const roastLevel = product.roastLevelNames?.[0] || "Signature"
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
        <div className="relative h-48 overflow-hidden bg-muted">
          {hasImage && mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImage}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 flex items-center justify-center group-hover:scale-105 transition-all duration-500 ease-in-out">
              <div className="text-6xl group-hover:animate-float">☕</div>
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent z-10 group-hover:from-black/40 transition-all duration-500 ease-in-out" />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs text-accent font-semibold uppercase tracking-wider">{origin}</p>
              <h3 className="text-lg font-bold text-primary dark:text-secondary text-balance group-hover:text-accent transition-smooth">
                {product.name}
              </h3>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 group-hover:text-muted-foreground/80 transition-smooth">
            {roastLevel} Roast
          </p>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary dark:text-secondary">
              {isPriceAvailable ? (
                <FormattedPrice amount={displayPrice} />
              ) : (
                <span className="text-muted-foreground text-base">Loading price...</span>
              )}
            </span>
            <span className="text-sm font-semibold text-accent opacity-0 translate-x-2 transition-smooth group-hover:opacity-100 group-hover:translate-x-0">
              View details →
            </span>
          </div>
        </div>
      </Link>

      <button
        onClick={openModal}
        aria-label="Add to cart"
        className="absolute top-3 right-3 z-10 p-2 bg-background/70 backdrop-blur rounded-full border border-white/10 hover:border-accent transition-smooth hover:scale-110"
      >
        <ShoppingCart size={18} className="text-foreground" />
      </button>

      <div className="flex items-center justify-between px-4 pb-4 pt-2">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Signature pick</span>
        <button
          onClick={openModal}
          className="p-2 bg-gradient-warm-btn text-accent-foreground rounded-lg transition-smooth scale-100 hover:scale-110 hover:shadow-lg"
        >
          <ShoppingCart size={18} />
        </button>
      </div>

      <ProductVariantModal product={product} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </article>
  )
}
