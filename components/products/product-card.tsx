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

  // Determine product type
  const isCoffee = !!product.coffeeProfile;
  const isEquipment = !isCoffee;

  // Universal product URL (uses /product/ route)
  const productUrl = product.slug
    ? `/product/${product.slug}`
    : `/product/${product.id}`;

  // Brand Name (1st in hierarchy)
  const brandName = product.brandName || (isCoffee ? product.coffeeProfile?.originName : product.categoryName) || "DuneFlame";

  // Price (4th in hierarchy)
  // Scan ALL variants for a valid price (full fallback chain).
  // This handles: (a) no Currency header → backend omits prices[] but keeps price field,
  // (b) currency mismatch after hydration, (c) first variant having price:0.
  const displayPrice = (() => {
    if (!product.variants?.length) return (product as any).basePrice ?? (product as any).price ?? 0;
    // 1. Currency-specific price from any variant
    for (const v of product.variants) {
      const p = v.prices?.find((px: any) => px.currencyCode === currency)?.price;
      if (p && p > 0) return p;
    }
    // 2. First available price from any variant's prices array
    for (const v of product.variants) {
      const p = v.prices?.[0]?.price;
      if (p && p > 0) return p;
    }
    // 3. Base price field from any variant
    for (const v of product.variants) {
      if (v.price > 0) return v.price;
    }
    // 4. Top-level basePrice / price fallback
    return (product as any).basePrice ?? (product as any).price ?? 0;
  })();

  // Mid-section content (3rd in hierarchy)
  // If Equipment: truncated description (ONE line)
  // If Coffee: Flavour Notes tags
  let midSectionContent = "";
  if (isEquipment) {
    // Show truncated description for equipment
    midSectionContent = product.description || "Premium Equipment";
  } else if (isCoffee && product.coffeeProfile?.flavourNotes?.length) {
    // Show flavour notes for coffee
    midSectionContent = product.coffeeProfile.flavourNotes
      .map(note => {
        const translation = note.translations?.find(tr => tr.languageCode === locale)
          || note.translations?.find(tr => tr.languageCode === 'en');
        return translation?.name || note.name;
      })
      .join(", ");
  } else {
    midSectionContent = t('products.card.signature');
  }

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
          className="flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

          <div className="p-4 flex flex-col flex-1">
            {/* 1st: Brand Name */}
            <p className="text-xs text-espresso-brown font-semibold uppercase tracking-wider font-heading mb-1">
              {brandName}
            </p>

            {/* 2nd: Product Name */}
            <h3 className="text-lg font-bold text-primary dark:text-secondary text-balance group-hover:text-accent transition-smooth uppercase truncate mb-2" title={product.name}>
              {product.name}
            </h3>

            {/* 3rd: Mid-section (Description for Equipment OR Flavour Notes for Coffee) - ONE line truncation */}
            <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-smooth line-clamp-1">
              {midSectionContent}
            </p>

            {/* 4th: Price — rendered unconditionally; dash shown only when truly unavailable */}
            <div className="flex items-center justify-between mt-auto pt-3">
              <span className="text-lg font-heading text-primary dark:text-secondary">
                {displayPrice > 0 ? (
                  <FormattedPrice amount={displayPrice} />
                ) : (
                  <span className="text-muted-foreground text-base">—</span>
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
