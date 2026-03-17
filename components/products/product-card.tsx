"use client"

import Image from "next/image"
import { useMemo, useState, useRef, useEffect } from "react"
import { Link } from "@/i18n/routing"
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
  priority?: boolean
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const locale = useLocale();
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLElement>(null)
  const { currency, currencySymbol } = useCurrency()
  const t = useTranslations()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Kart tam olaraq (75% ekranda olanda) ishe dushsun
        if (entry.isIntersecting) {
          setIsVisible(true)
        } else {
          setIsVisible(false)
        }
      },
      { threshold: 0.75 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  const rawMainImage = product.images?.find((i) => i.isMain)?.imageUrl || product.images?.[0]?.imageUrl
  const mainImage = rawMainImage ? getImageUrl(rawMainImage) : null
  const hasImage = Boolean(mainImage)

  const productUrl = product.slug ? `/coffee/${product.slug}` : `/coffee/${product.id}`
  const defaultWeight = useMemo(() => {
    const weights = getAvailableWeights(product as unknown as ProductWithPricing)
    if (weights.length) return weights[0]
    return product.availablePrices?.[0]?.grams
  }, [product])

  const resolved = useMemo(() => {
    const result = resolvePrice(product as unknown as ProductWithPricing, currency, defaultWeight ?? undefined);
    if (!result) {
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
    <article
      ref={cardRef}
      className={`group relative glass rounded-xl overflow-hidden card-float card-depth cursor-pointer transform-gpu will-change-transform transition-all duration-500 ease-in-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:glow-accent ${
        isVisible ? "mobile-visible" : ""
      }`}
    >
        <Link
          href={productUrl}
          className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="relative h-64 overflow-hidden bg-muted rounded-t-xl transform-gpu">
            {hasImage && mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                quality={60}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="absolute inset-0 h-full w-full object-cover transform-gpu will-change-transform transition-transform duration-500 ease-in-out group-hover:scale-110"
                priority={priority}
                fetchPriority={priority ? "high" : "auto"}
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 flex items-center justify-center transform-gpu will-change-transform group-hover:scale-110 transition-all duration-500 ease-in-out">
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
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t('products.card.signaturePick')}</span>
        </div>

        {/* Quick View Button - At bottom of card */}
        <button
          onClick={openModal}
          className={`absolute bottom-0 left-0 right-0 z-20 py-2 px-4 font-heading flex flex-row items-center justify-center gap-2 transition-all duration-700 ease-in-out rounded-b-xl uppercase ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1/2"
          } lg:opacity-0 lg:translate-y-full lg:group-hover:opacity-100 lg:group-hover:translate-y-0`}
          style={{ backgroundColor: "#2b1b13", color: "white" }}
        >
          <Eye size={16} />
          {t('products.card.quickView')}
        </button>

        <ProductVariantModal product={product} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </article>
    )
}
