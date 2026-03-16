"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { Leaf, ShoppingCart, Sparkles } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import type { ProductResponse } from "@/lib/services/products"
import { useAddToCart } from "@/hooks/use-add-to-cart"
import { getImageUrl } from "@/lib/utils"
import { useCurrency } from "@/hooks/use-currency"
import { getAvailableWeights, resolvePrice, type ProductWithPricing } from "@/lib/currency-utils"
import { FormattedPrice } from "@/components/currency/formatted-price"
import { EMPTY_GUID } from "@/lib/cart-store"

const formatWeight = (grams?: number) => {
  if (!grams) return "";
  if (grams >= 1000) {
    const kg = grams / 1000;
    return kg === Math.floor(kg) ? `${Math.floor(kg)} kg` : `${kg.toFixed(1)} kg`;
  }
  return `${grams} g`;
}

interface ProductDetailViewProps {
  product: ProductResponse
}

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const { addToCart } = useAddToCart()
  const { currency, currencySymbol } = useCurrency()
  const t = useTranslations('products')
  const locale = useLocale()
  const [quantity, setQuantity] = useState(1)

  // Get translated product name with fallback to default
  const productName = useMemo(() => {
    const translation = product.nameTranslations?.find(tr => tr.languageCode === locale)
      || product.nameTranslations?.find(tr => tr.languageCode === 'en')
    return translation?.name || product.name
  }, [product, locale])

  // Get translated product description with fallback to default
  const productDescription = useMemo(() => {
    const translation = product.descriptionTranslations?.find(tr => tr.languageCode === locale)
      || product.descriptionTranslations?.find(tr => tr.languageCode === 'en')
    return translation?.description || product.description
  }, [product, locale])
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>(
    product.images?.find((image) => image.isMain)?.id || product.images?.[0]?.id,
  )
  const [selectedWeight, setSelectedWeight] = useState<number | undefined>(undefined)
  const [selectedRoast, setSelectedRoast] = useState<string>("")
  const [selectedGrind, setSelectedGrind] = useState<string>("")

  // Initialize defaults when product loads
  useEffect(() => {
    if (product) {
      // Default weight: smallest available or first from availablePrices
      const weights = getAvailableWeights(product as unknown as ProductWithPricing)
      const defaultWeight = weights[0] ?? product.availablePrices?.[0]?.grams
      setSelectedWeight(defaultWeight)
      // Default attributes
      if (product.roastLevelNames?.length) setSelectedRoast(product.roastLevelNames[0])
      if (product.grindTypeNames?.length) setSelectedGrind(product.grindTypeNames[0])
    }
  }, [product])



  // Handler for weight selection (grams-based)
  const handleWeightSelect = (grams: number) => {
    setSelectedWeight(grams)
  }

  const mainImage = useMemo(
    () => {
      const rawUrl =
        product.images?.find((image) => image.id === selectedImageId)?.imageUrl ||
        product.images?.find((image) => image.isMain)?.imageUrl ||
        product.images?.[0]?.imageUrl
      return getImageUrl(rawUrl)
    },
    [product.images, selectedImageId],
  )

  const galleryImages = useMemo(() => product.images?.filter((img) => img.imageUrl) ?? [], [product.images])

  // Resolve current price using backend-compatible helper
  const resolved = useMemo(() => {
    const result = resolvePrice(product as unknown as ProductWithPricing, currency, selectedWeight)
    return result
  }, [product, currency, selectedWeight])

  const selectedRoastIndex = useMemo(
    () => product.roastLevelNames?.indexOf(selectedRoast) ?? -1,
    [product.roastLevelNames, selectedRoast],
  )

  const selectedGrindIndex = useMemo(
    () => product.grindTypeNames?.indexOf(selectedGrind) ?? -1,
    [product.grindTypeNames, selectedGrind],
  )

  const selectedRoastId = useMemo(
    () => (selectedRoastIndex >= 0 ? product.roastLevelIds?.[selectedRoastIndex] : EMPTY_GUID),
    [product.roastLevelIds, selectedRoastIndex],
  )

  const selectedGrindId = useMemo(
    () => (selectedGrindIndex >= 0 ? product.grindTypeIds?.[selectedGrindIndex] : EMPTY_GUID),
    [product.grindTypeIds, selectedGrindIndex],
  )

  const currentPrice = resolved?.price ?? 0
  
  // DEBUG: Log if price resolution failed
  if (!resolved) {
  }

  // Determine productPriceId and labels for add-to-cart
  const selectedEntry = useMemo(() => {
    const legacy = product.availablePrices?.find((p) => p.grams === selectedWeight)
    return {
      productPriceId: resolved?.productPriceId || legacy?.productPriceId || "",
      grams: selectedWeight,
      weightLabel: resolved?.weightLabel || legacy?.weightLabel,
    }
  }, [resolved, selectedWeight, product.availablePrices])

  const handleAddToCart = () => {
    addToCart(product, quantity, {
      productPriceId: selectedEntry.productPriceId, // CRITICAL: Pass the GUID
      price: currentPrice,
      weightLabel: selectedEntry.weightLabel,
      grams: selectedEntry.grams,
      selectedWeight: selectedWeight,  // CRITICAL: Pass selected weight in grams
      roastLevelId: selectedRoastId || EMPTY_GUID,
      roastLevelName: selectedRoast,
      grindTypeId: selectedGrindId || EMPTY_GUID,
      grindTypeName: selectedGrind,
      variantKey: `${product.id}-${selectedEntry.productPriceId}-${selectedRoastId}-${selectedGrindId}`,
    })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="grid gap-10 lg:grid-cols-[1.05fr_1fr]"
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-background via-background/60 to-background/30 shadow-[0_25px_80px_-40px_rgba(0,0,0,0.55)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_30%)]" />
        <div className="absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-secondary/10" />

        {mainImage ? (
          <motion.div
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 w-full aspect-square md:aspect-auto md:h-[600px]"
          >
            <Image
              src={mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="object-cover"
            />
          </motion.div>
        ) : (
          <div className="relative z-10 flex h-full min-h-105 items-center justify-center bg-linear-to-br from-amber-100 to-orange-200 text-8xl dark:from-amber-900 dark:to-orange-900">
            ☕
          </div>
        )}

        // ...removed Artisan Roast badge...
        <div className="absolute right-6 bottom-6 z-20 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white backdrop-blur">
          {product.stockInKg > 0 ? t('detail.inStock') : t('detail.limitedStock')}
        </div>

        {galleryImages.length > 1 && (
          <div className="absolute bottom-6 left-6 right-6 z-20 flex gap-2">
            {galleryImages.map((image) => (
              <motion.button
                key={image.id}
                onClick={() => setSelectedImageId(image.id)}
                whileHover={{ scale: 1.05 }}
                className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                  selectedImageId === image.id ? "border-accent" : "border-white/20 hover:border-white/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getImageUrl(image.imageUrl) || ""} alt="Product thumbnail" className="h-full w-full object-cover" />
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {/* Removed category badge span as requested */}
            <div className="flex items-center gap-2">
              <Leaf size={14} className="text-accent" />
              <span>{product.originName || "DuneFlame Reserve"}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold leading-tight text-primary dark:text-secondary uppercase" style={{ fontSize: "24px" }}>{productName}</h1>
              <p className="mt-2 text-base text-muted-foreground md:text-lg">{productDescription}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="glass rounded-2xl border border-white/5 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('weight')}</p>
            <div className="grid grid-cols-2 gap-2">
              {(getAvailableWeights(product as unknown as ProductWithPricing)).map((grams) => {
                const label = product.availablePrices?.find(p => p.grams === grams)?.weightLabel ?? formatWeight(grams)
                // CRITICAL: Resolve price for THIS currency and weight combination
                const priceForWeight = resolvePrice(product as unknown as ProductWithPricing, currency, grams)?.price ?? 0
                return (
                  <button
                    key={grams}
                    onClick={() => {
                      handleWeightSelect(grams)
                    }}
                    className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left transition hover:border-espresso-brown ${
                      selectedWeight === grams ? "border-espresso-brown bg-espresso-brown/10" : "border-white/10"
                    }`}
                  >
                    <span className="font-semibold text-espresso-brown dark:text-espresso-brown">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="glass rounded-2xl border border-white/5 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('roastLevel')}</p>
            <div className="flex flex-wrap gap-2">
              {(product.roastLevelNames || []).map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedRoast(name)}
                  className={`rounded-full px-3 py-1 text-sm transition border ${
                    selectedRoast === name ? "border-[#2b1b13] bg-[#2b1b13]/10 text-[#2b1b13]" : "border-transparent text-[#2b1b13] dark:text-[#2b1b13]"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('grindType')}</p>
            <div className="flex flex-wrap gap-2">
              {(product.grindTypeNames || []).map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedGrind(name)}
                  className={`rounded-full px-3 py-1 text-sm transition border ${
                    selectedGrind === name ? "border-[#2b1b13] bg-[#2b1b13]/10 text-[#2b1b13]" : "border-transparent text-[#2b1b13] dark:text-[#2b1b13]"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {currentPrice > 0 ? t('craftedForMornings') : t('selectWeightAndCurrency')}
              </p>
              <p className="font-heading text-2xl font-bold text-primary dark:text-secondary">
                {currentPrice > 0 ? (
                  <FormattedPrice amount={currentPrice * quantity} />
                ) : (
                  <span className="text-gray-400 text-lg">—</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-background/60 px-3 py-2 shadow-inner">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="h-10 w-10 rounded-full border border-white/20 bg-white/5 text-lg font-bold transition hover:border-accent hover:bg-accent/10"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-10 text-center text-lg font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="h-10 w-10 rounded-full border border-white/20 bg-white/5 text-lg font-bold transition hover:border-accent hover:bg-accent/10"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stockInKg <= 0 || !selectedWeight || !resolved}
            style={{
              backgroundColor: 'rgb(56, 109, 118)',
              color: '#fff',
              borderRadius: '0.75rem',
              width: '100%',
              padding: '1rem 1.5rem',
              fontSize: '1.125rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1.5rem',
              boxShadow: '0 20px 60px -30px rgba(56,109,118,0.8)',
              transition: 'box-shadow 0.2s, background 0.2s',
            }}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60"
            title={!resolved ? t('priceNotLoaded') : undefined}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgb(40, 80, 87)')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'rgb(56, 109, 118)')}
          >
            <ShoppingCart size={20} />
            {t('addToBasket')}
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
              <Sparkles size={14} className="text-accent" />
              {t('freeShipping')}
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
              <Leaf size={14} className="text-accent" />
              {t('sustainableSourcing')}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.section>
  )
}
