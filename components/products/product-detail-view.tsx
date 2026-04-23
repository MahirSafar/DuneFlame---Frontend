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
import { FormattedPrice } from "@/components/currency/formatted-price"
import { EMPTY_GUID } from "@/lib/cart-store"
import { ProductQuickBuy } from "@/components/products/product-quick-buy"
import { StripeElementsProvider } from "@/components/payment/stripe-elements-provider"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

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
    const translation = product.translations?.find(tr => tr.languageCode === locale)
      || product.translations?.find(tr => tr.languageCode === 'en')
    return translation?.name || product.name
  }, [product, locale])

  // Get translated product description with fallback to default
  const productDescription = useMemo(() => {
    const translation = product.translations?.find(tr => tr.languageCode === locale)
      || product.translations?.find(tr => tr.languageCode === 'en')
    return translation?.description || product.description
  }, [product, locale])
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>(
    product.images?.find((image) => image.isMain)?.id || product.images?.[0]?.id,
  )
  // Default weight: replace with variant selection
  const variants = useMemo(() => product.variants || [], [product.variants]);
  const defaultVariant = variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?.id || ""
  );

  // Robustly sync selectedVariantId whenever product.variants changes (e.g. after hydration or
  // prop update). Uses the functional updater so selectedVariantId is NOT a dependency, which
  // avoids the circular re-run. Catches both falsy and EMPTY_GUID as "not yet selected".
  useEffect(() => {
    const firstId = product.variants?.[0]?.id;
    if (!firstId) return;
    setSelectedVariantId((current) => {
      const isValid =
        current &&
        current !== EMPTY_GUID &&
        product.variants?.some((v) => v.id === current);
      return isValid ? current : firstId;
    });
  }, [product.variants]);

  const selectedVariant = useMemo(() => variants.find(v => v.id === selectedVariantId) || defaultVariant, [selectedVariantId, variants, defaultVariant]);

  // True when the product has exactly one variant that carries no meaningful label
  // (sku contains "DEFAULT" or no option values defined)
  const isDefaultOnlyVariant = useMemo(() => {
    if (variants.length !== 1) return false;
    const v = variants[0];
    const hasNoOptions = !v.options?.length || v.options.every(o => !o.value || o.value.toLowerCase() === 'default');
    const hasDefaultSku = typeof v.sku === 'string' && v.sku.toUpperCase().includes('DEFAULT');
    return hasNoOptions || hasDefaultSku;
  }, [variants]);
  
  const [selectedRoast, setSelectedRoast] = useState<string>("")
  const [selectedGrind, setSelectedGrind] = useState<string>("")

  // Initialize defaults when product loads
  useEffect(() => {
    if (product) {
      // Default attributes
      if (product.coffeeProfile?.roastLevelNames?.length) setSelectedRoast(product.coffeeProfile.roastLevelNames[0])
      if (product.coffeeProfile?.grindTypeNames?.length) setSelectedGrind(product.coffeeProfile.grindTypeNames[0])
    }
  }, [product])

  const handleVariantSelect = (id: string) => {
    setSelectedVariantId(id)
  }

  const isCoffeeProduct = !!product.coffeeProfile;

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

  const selectedRoastIndex = useMemo(
    () => product.coffeeProfile?.roastLevelNames?.indexOf(selectedRoast) ?? -1,
    [product.coffeeProfile, selectedRoast],
  )

  const selectedGrindIndex = useMemo(
    () => product.coffeeProfile?.grindTypeNames?.indexOf(selectedGrind) ?? -1,
    [product.coffeeProfile, selectedGrind],
  )

  const selectedRoastId = useMemo(
    () => (selectedRoastIndex >= 0 ? product.coffeeProfile?.roastLevelIds?.[selectedRoastIndex] : undefined),
    [product.coffeeProfile, selectedRoastIndex],
  )

  const selectedGrindId = useMemo(
    () => (selectedGrindIndex >= 0 ? product.coffeeProfile?.grindTypeIds?.[selectedGrindIndex] : undefined),
    [product.coffeeProfile, selectedGrindIndex],
  )

  const currentPrice = selectedVariant?.prices?.find((p: any) => p.currencyCode === currency)?.price ?? selectedVariant?.price ?? 0

  const productJsonLd = useMemo(() => {
    const offerCurrency = (currency || "USD").toUpperCase()

    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: productName,
      description: productDescription,
      image: mainImage,
      offers: {
        "@type": "Offer",
        priceCurrency: offerCurrency,
        price: currentPrice,
        availability: (selectedVariant?.stockQuantity ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
      // Reflect currently selected options so rich results stay aligned with UI state.
      additionalProperty: [
        selectedVariant
          ? {
              "@type": "PropertyValue",
              name: "Variant",
              value: selectedVariant.sku,
            }
          : null,
        selectedRoast
          ? {
              "@type": "PropertyValue",
              name: "Roast Level",
              value: selectedRoast,
            }
          : null,
        selectedGrind
          ? {
              "@type": "PropertyValue",
              name: "Grind Type",
              value: selectedGrind,
            }
          : null,
      ].filter(Boolean),
    }
  }, [currency, currentPrice, mainImage, selectedVariant, productDescription, productName, selectedGrind, selectedRoast, selectedVariantId])
  
  const handleAddToCart = () => {
    addToCart(product, quantity, {
      variantId: selectedVariant?.id || "",
      prices: selectedVariant?.prices || [],
      price: currentPrice,
      sku: selectedVariant?.sku || "",
      attributes: selectedVariant?.options?.map(o => `${o.attributeName}: ${o.value}`) || [],
      roastLevelId: selectedRoastId,
      roastLevelName: selectedRoast,
      grindTypeId: selectedGrindId,
      grindTypeName: selectedGrind,
      imageUrl: mainImage || undefined,
    })
  }

  const hasValidSelection = Boolean(selectedVariant)
  const isPriceAvailable = currentPrice > 0

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="grid items-start gap-10 lg:grid-cols-[1.05fr_1fr]"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* LEFT column — image card + specs accordion below (equipment only) */}
      <div className="space-y-4 self-start">
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
              className="relative z-10 w-full aspect-square md:aspect-auto md:h-150"
            >
              <Image
                src={mainImage}
                alt={product.name}
                fill
                quality={60}
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

          <div className="absolute right-6 bottom-6 z-20 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white backdrop-blur">
            {(selectedVariant?.stockQuantity ?? 0) > 0 ? t('detail.inStock') : t('detail.limitedStock')}
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

        {/* Equipment: Technical Specifications accordion — below image, starts collapsed */}
        {!isCoffeeProduct && product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-background/40 backdrop-blur overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="specs" className="border-0">
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Technical Specifications
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-0">
                  <div className="divide-y divide-white/10">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2.5">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">{key}</span>
                        <span className="text-sm font-semibold text-primary dark:text-secondary text-right max-w-[55%]">{value as React.ReactNode}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </div>

      {/* RIGHT column — product info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
        className="space-y-6"
      >
        {/* Brand / origin */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {isCoffeeProduct && product.coffeeProfile?.originName && (
              <div className="flex items-center gap-2">
                <Leaf size={14} className="text-accent" />
                <span>{product.coffeeProfile.originName}</span>
              </div>
            )}
            {product.brandName && (
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide backdrop-blur">
                {product.brandName}
              </span>
            )}
            {!isCoffeeProduct && !product.brandName && (
              <div className="flex items-center gap-2">
                <Leaf size={14} className="text-accent" />
                <span>{product.categoryName || "DuneFlame Equipment"}</span>
              </div>
            )}
          </div>

          {/* Name + Description */}
          <div>
            <h1 className="font-heading font-bold leading-tight text-primary dark:text-secondary uppercase" style={{ fontSize: "24px" }}>{productName}</h1>
            <p className="mt-2 text-base text-muted-foreground md:text-lg">{productDescription}</p>
          </div>

          {/* Equipment: variant / color selector — directly under description */}
          {!isCoffeeProduct && !isDefaultOnlyVariant && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {product.variants?.[0]?.options?.[0]?.attributeName || 'VARIANT'}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants?.map((variant) => {
                  const label = variant.options?.map(o => o.value).join(' / ') || variant.sku;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantSelect(variant.id)}
                      className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left transition hover:border-espresso-brown ${
                        selectedVariantId === variant.id ? "border-espresso-brown bg-espresso-brown/10" : "border-white/10"
                      }`}
                    >
                      <span className="font-semibold text-espresso-brown dark:text-espresso-brown">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Coffee: weight + roast + grind grid */}
        {isCoffeeProduct && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!isDefaultOnlyVariant && (
            <div className="glass rounded-2xl border border-white/5 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('weight')}</p>
              <div className="grid grid-cols-2 gap-2">
                {product.variants?.map((variant) => {
                  const label = variant.options?.find(o => o.attributeName.toLowerCase() === 'weight')?.value || variant.sku;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantSelect(variant.id)}
                      className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left transition hover:border-espresso-brown ${
                        selectedVariantId === variant.id ? "border-espresso-brown bg-espresso-brown/10" : "border-white/10"
                      }`}
                    >
                      <span className="font-semibold text-espresso-brown dark:text-espresso-brown">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {product.coffeeProfile && (
              <div className="glass rounded-2xl border border-white/5 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('roastLevel')}</p>
                <div className="flex flex-wrap gap-2">
                  {(product.coffeeProfile.roastLevelNames || []).map((name) => (
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
                  {(product.coffeeProfile.grindTypeNames || []).map((name) => (
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
            )}
          </div>
        )}

        {/* Coffee: flavour notes */}
        {isCoffeeProduct && product.coffeeProfile?.flavourNotes && product.coffeeProfile.flavourNotes.length > 0 && (
          <div className="glass rounded-2xl border border-white/5 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Flavour Notes</p>
            <div className="flex flex-wrap gap-2">
              {product.coffeeProfile.flavourNotes.map((note) => {
                const label =
                  note.translations?.find((tr) => tr.languageCode === locale)?.name ||
                  note.translations?.find((tr) => tr.languageCode === "en")?.name ||
                  note.name;
                return (
                  <span
                    key={note.id ?? note.name}
                    className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Price */}
        <div>
          <p className="text-sm text-muted-foreground">
            {currentPrice > 0
              ? (isCoffeeProduct ? t('craftedForMornings') : t('detail.taxesIncluded'))
              : t('selectWeightAndCurrency')
            }
          </p>
          <p className="font-heading text-2xl font-bold text-primary dark:text-secondary">
            {currentPrice > 0 ? (
              <FormattedPrice amount={currentPrice * quantity} />
            ) : (
              <span className="text-gray-400 text-lg">—</span>
            )}
          </p>
        </div>

        {/* Quantity */}
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

        {/* Buttons — hidden on mobile (replaced by sticky bar below) */}
        <div className="hidden lg:flex flex-col gap-3">
          <button
            onClick={handleAddToCart}
            disabled={(selectedVariant?.stockQuantity ?? 0) <= 0 || !selectedVariant}
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
              boxShadow: '0 20px 60px -30px rgba(56,109,118,0.8)',
              transition: 'box-shadow 0.2s, background 0.2s',
            }}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60"
            onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgb(40, 80, 87)')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'rgb(56, 109, 118)')}
          >
            <ShoppingCart size={20} />
            {t('addToBasket')}
          </button>

          <div className="w-full">
            <StripeElementsProvider>
              <ProductQuickBuy
                product={product}
                selectedVariantId={selectedVariantId}
                selectedRoast={selectedRoast}
                selectedGrind={selectedGrind}
                quantity={quantity}
                currentPrice={currentPrice}
                isPriceAvailable={isPriceAvailable}
                hasValidSelection={hasValidSelection}
              />
            </StripeElementsProvider>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
            <Sparkles size={14} className="text-accent" />
            {t('freeShipping')}
          </span>
          <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
            <Leaf size={14} className="text-accent" />
            {t('sustainableSourcing')}
          </span>
        </div>

        {/* Mobile: bottom spacer so sticky bar doesn't overlap content */}
        <div className="h-24 lg:hidden" aria-hidden="true" />
      </motion.div>

      {/* Mobile sticky Add to Cart bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg lg:hidden">
        <button
          onClick={handleAddToCart}
          disabled={(selectedVariant?.stockQuantity ?? 0) <= 0 || !selectedVariant}
          style={{
            backgroundColor: 'rgb(56, 109, 118)',
            color: '#fff',
            borderRadius: '0.75rem',
            width: '100%',
            padding: '0.875rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <ShoppingCart size={18} />
          {t('addToBasket')}
          {currentPrice > 0 && (
            <span className="ml-2 opacity-80">· <FormattedPrice amount={currentPrice * quantity} /></span>
          )}
        </button>
      </div>
    </motion.section>
  )
}
