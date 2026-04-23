"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Coffee, ShoppingCart } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAddToCart } from "@/hooks/use-add-to-cart"
import { useCurrency } from "@/hooks/use-currency"
import { FormattedPrice } from "@/components/currency/formatted-price"
import type { ProductResponse } from "@/lib/services/products"
import { cn, getImageUrl } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { ProductQuickBuy } from "@/components/products/product-quick-buy"
import { StripeElementsProvider } from "@/components/payment/stripe-elements-provider"

interface ProductVariantModalProps {
  product: ProductResponse
  isOpen: boolean
  onClose: () => void
}

export function ProductVariantModal({ product, isOpen, onClose }: ProductVariantModalProps) {
  const t = useTranslations()
  const { addToCart } = useAddToCart()
  const { currency, currencySymbol } = useCurrency()

  // State to hold the full product data (with IDs)
  const [fullProduct, setFullProduct] = useState<ProductResponse>(product)
  // Securely initialise to the first variant with a non-empty ID; never fall back to ""
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    return product.variants?.find((v) => v.id && v.id.length > 0)?.id || ""
  })

  const [selectedRoast, setSelectedRoast] = useState<string>(product.coffeeProfile?.roastLevelNames?.[0] || "")
  const [selectedGrind, setSelectedGrind] = useState<string>(product.coffeeProfile?.grindTypeNames?.[0] || "")

  const selectedVariant = useMemo(() => fullProduct.variants?.find(v => v.id === selectedVariantId) || fullProduct.variants?.[0], [selectedVariantId, fullProduct.variants]);

  useEffect(() => {
    if (!isOpen) return

    const isCoffee = !!product.coffeeProfile;

    // Check if product data is incomplete for ANY product type:
    // - missing variants entirely, variant IDs are empty/missing
    // - coffee-specific: missing roast/grind IDs needed for cart
    const hasIncompleteData = (
      !product.variants?.length ||
      !product.variants[0]?.id ||
      product.variants[0].id.length === 0 ||
      (isCoffee && (
        !product.coffeeProfile?.roastLevelIds ||
        product.coffeeProfile?.roastLevelIds.length === 0 ||
        !product.coffeeProfile?.grindTypeIds ||
        product.coffeeProfile?.grindTypeIds.length === 0
      ))
    )

    if (hasIncompleteData && product.slug) {
      // Fetch full product details to get real variant IDs
      import("@/lib/services/products")
        .then(({ getProduct }) => getProduct(product.slug))
        .then((data) => {
          setFullProduct(data)
          // Functional updater: only overwrite if the current value is still empty/invalid
          setSelectedVariantId((prev) => {
            const firstValidId = data.variants?.find((v: any) => v.id && v.id.length > 0)?.id
            return prev && prev.length > 0 ? prev : (firstValidId || "")
          })
          setSelectedRoast(data.coffeeProfile?.roastLevelNames?.[0] || "")
          setSelectedGrind(data.coffeeProfile?.grindTypeNames?.[0] || "")
        })
        .catch((err) => console.error("❌ MODAL: Failed to fetch full product:", err))
    } else {
      // Data is complete, use as-is
      setFullProduct(product)
      // Functional updater: only overwrite if the current value is still empty/invalid
      setSelectedVariantId((prev) => {
        const firstValidId = product.variants?.find((v) => v.id && v.id.length > 0)?.id
        return prev && prev.length > 0 ? prev : (firstValidId || "")
      })
      setSelectedRoast(product.coffeeProfile?.roastLevelNames?.[0] || "")
      setSelectedGrind(product.coffeeProfile?.grindTypeNames?.[0] || "")
    }
  // selectedVariantId intentionally excluded: functional updaters read current state internally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product])

  const mainImageRaw = useMemo(
    () => fullProduct.images?.find((image) => image.isMain)?.imageUrl || fullProduct.images?.[0]?.imageUrl,
    [fullProduct.images],
  )
  const mainImage = mainImageRaw ? getImageUrl(mainImageRaw) : null

  // STRICT PRICE RESOLUTION: Use resolved price from variant based on selectedVariantId
  const currentPrice =
    selectedVariant?.prices?.find((p: any) => p.currencyCode === currency)?.price ??
    selectedVariant?.prices?.[0]?.price ??
    selectedVariant?.price ??
    0;
  const isPriceAvailable = currentPrice > 0

  const isCoffeeProduct = !!fullProduct.coffeeProfile;
  const isEquipment = !isCoffeeProduct;

  // True when the product has exactly one variant with no meaningful label
  // (SKU contains "DEFAULT" or options are empty/default-valued)
  const isDefaultOnlyVariant = useMemo(() => {
    const variants = fullProduct.variants
    if (!variants || variants.length !== 1) return false
    const v = variants[0]
    const hasNoOptions = !v.options?.length || v.options.every((o: any) => !o.value || o.value.toLowerCase() === 'default')
    const hasDefaultSku = typeof v.sku === 'string' && v.sku.toUpperCase().includes('DEFAULT')
    return hasNoOptions || hasDefaultSku
  }, [fullProduct.variants])

  const hasValidSelection = isCoffeeProduct 
    ? Boolean(selectedVariant && selectedRoast && selectedGrind)
    : Boolean(selectedVariant);

  const handleAddToCart = () => {
    if (!hasValidSelection || !selectedVariant) {
      toast.error(isCoffeeProduct ? t('products.detail.selectWeight') : t('common.actions.loading'))
      return
    }
    
    if (isCoffeeProduct && (!fullProduct.coffeeProfile?.roastLevelIds || fullProduct.coffeeProfile?.roastLevelIds.length === 0 || !fullProduct.coffeeProfile?.grindTypeIds || fullProduct.coffeeProfile?.grindTypeIds.length === 0)) {
      toast.error(t('common.actions.loading'))
      return
    }

    // 1. Use resolved price and variantId from strict resolution
    const variantId = selectedVariant.id

    // 2. Find Roast ID by Name using API keys
    const roastIndex = fullProduct.coffeeProfile?.roastLevelNames?.indexOf(selectedRoast) ?? -1
    const roastLevelId = roastIndex >= 0 ? fullProduct.coffeeProfile?.roastLevelIds?.[roastIndex] : undefined

    // 3. Find Grind ID by Name using API keys
    const grindIndex = fullProduct.coffeeProfile?.grindTypeNames?.indexOf(selectedGrind) ?? -1
    const grindTypeId = grindIndex >= 0 ? fullProduct.coffeeProfile?.grindTypeIds?.[grindIndex] : undefined


    // 4. Send EVERYTHING to addToCart (including real GUIDs)
    addToCart(fullProduct, 1, {
      variantId,
      prices: selectedVariant?.prices || [],
      price: currentPrice,
      sku: selectedVariant?.sku || "",
      attributes: selectedVariant?.options?.map(o => `${o.attributeName}: ${o.value}`) || [],
      roastLevelName: isCoffeeProduct ? selectedRoast : undefined,
      roastLevelId: isCoffeeProduct ? roastLevelId : undefined,
      grindTypeName: isCoffeeProduct ? selectedGrind : undefined,
      grindTypeId: isCoffeeProduct ? grindTypeId : undefined,
      imageUrl: mainImageRaw || "",
    })

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCoffeeProduct ? "Select your perfect cup" : `Configure ${fullProduct.name}`}
          </DialogTitle>
          <DialogDescription>
            {isCoffeeProduct
              ? `Choose weight, roast, and grind to tailor ${fullProduct.name} to your brewing ritual.`
              : `Select the variant that fits your needs for ${fullProduct.name}.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-[1.05fr_1fr] lg:grid-cols-[1.05fr_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-muted">
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainImage} alt={fullProduct.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl text-muted-foreground">
                {isCoffeeProduct ? <Coffee className="h-14 w-14" /> : <span className="text-6xl">⚙️</span>}
              </div>
            )}
            {isCoffeeProduct && fullProduct.coffeeProfile?.originName && (
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-accent/90 text-white text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded">
                  {fullProduct.coffeeProfile.originName}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {fullProduct.coffeeProfile?.originName && <Badge variant="outline">{fullProduct.coffeeProfile?.originName}</Badge>}
                {/* Removed category badge as requested */}
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-primary dark:text-secondary uppercase">{fullProduct.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">{fullProduct.description}</p>
              <p className="font-heading text-xl sm:text-2xl font-semibold text-primary dark:text-secondary">
                {isPriceAvailable ? (
                  <FormattedPrice amount={currentPrice} />
                ) : (
                  <span className="text-muted-foreground text-xl">{t('common.actions.loadingPrice')}</span>
                )}
              </p>
            </div>

            {!(isEquipment && isDefaultOnlyVariant) && (
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {isCoffeeProduct
                  ? t('common.weight')
                  : (fullProduct.variants?.[0]?.options?.[0]?.attributeName || 'VARIANT')
                }
              </Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {fullProduct.variants?.map((variant: any) => {
                  const optionLabel = variant.options?.map((o: any) => o.value).filter((v: string) => v && v.toLowerCase() !== 'default').join(', ')
                  const label = optionLabel || variant.weightLabel || `Option ${variant.id.substring(0, 4)}`;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={cn("flex flex-col items-start rounded-xl border px-3 py-2 text-left transition hover:border-espresso-brown",
                        selectedVariantId === variant.id ? "border-espresso-brown bg-espresso-brown/10" : "border-white/10"
                      )}
                    >
                      <span className="font-semibold text-espresso-brown dark:text-espresso-brown">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {isCoffeeProduct && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t('common.roast')}</Label>
                <Select value={selectedRoast} onValueChange={setSelectedRoast}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('products.detail.selectRoast')} />
                  </SelectTrigger>
                  <SelectContent>
                    {fullProduct.coffeeProfile?.roastLevelNames?.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t('common.grind')}</Label>
                <Select value={selectedGrind} onValueChange={setSelectedGrind}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('products.detail.selectGrind')} />
                  </SelectTrigger>
                  <SelectContent>
                    {fullProduct.coffeeProfile?.grindTypeNames?.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-col gap-3 w-full">
              <div className="text-sm text-muted-foreground">
                {isPriceAvailable
                  ? (isCoffeeProduct ? "Crafted to order. Taxes included." : "Taxes included. Ready to ship.")
                  : (isCoffeeProduct ? "Select currency and weight" : "Select a variant")
                }
              </div>

              <div className="flex flex-col gap-3 w-full">
                {/* Add to Cart Button */}
                <Button
                  size="lg"
                  className="w-full py-3"
                  style={{
                    backgroundColor: 'rgb(56, 109, 118)',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgb(40, 80, 87)')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = 'rgb(56, 109, 118)')}
                  onClick={handleAddToCart}
                  disabled={!hasValidSelection || !isPriceAvailable}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isPriceAvailable ? (
                    t('common.actions.addToCart')
                  ) : (
                    t('products.detail.selectWeight')
                  )}
                </Button>

                {/* Quick Buy with Express Checkout — visible on all breakpoints */}
                <div className="w-full">
                  <StripeElementsProvider>
                    <ProductQuickBuy
                      product={fullProduct}
                      selectedVariantId={selectedVariantId}
                      selectedRoast={selectedRoast}
                      selectedGrind={selectedGrind}
                      currentPrice={currentPrice}
                      isPriceAvailable={isPriceAvailable}
                      hasValidSelection={hasValidSelection}
                      onSuccess={() => onClose()}
                    />
                  </StripeElementsProvider>
                </div>
              </div>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProductVariantModal
