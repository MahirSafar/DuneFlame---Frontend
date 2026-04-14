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
import { EMPTY_GUID } from "@/lib/cart-store"
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
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product.variants?.[0]?.id || "")
  
  const [selectedRoast, setSelectedRoast] = useState<string>(product.coffeeProfile?.roastLevelNames?.[0] || "")
  const [selectedGrind, setSelectedGrind] = useState<string>(product.coffeeProfile?.grindTypeNames?.[0] || "")

  const selectedVariant = useMemo(() => fullProduct.variants?.find(v => v.id === selectedVariantId) || fullProduct.variants?.[0], [selectedVariantId, fullProduct.variants]);

  useEffect(() => {
    if (!isOpen) return

    // Set default variant if not set
    if (!selectedVariantId && fullProduct.variants?.[0]) {
      setSelectedVariantId(fullProduct.variants[0].id)
    }

    // Check if product data is incomplete (missing IDs)
    const hasIncompleteData = !product.coffeeProfile?.roastLevelIds || product.coffeeProfile?.roastLevelIds.length === 0 || !product.coffeeProfile?.grindTypeIds || product.coffeeProfile?.grindTypeIds.length === 0

    if (hasIncompleteData && product.slug) {
      // Fetch full product details
      import("@/lib/services/products")
        .then(({ getProduct }) => getProduct(product.slug))
        .then((data) => {
          setFullProduct(data)
          if (!selectedVariantId && data.variants?.[0]) {
            setSelectedVariantId(data.variants[0].id)
          }
          // Always set roast and grind from fetched data (user hasn't selected these yet)
          setSelectedRoast(data.coffeeProfile?.roastLevelNames?.[0] || "")
          setSelectedGrind(data.coffeeProfile?.grindTypeNames?.[0] || "")
        })
        .catch((err) => console.error("❌ MODAL: Failed to fetch full product:", err))
    } else {
      // Data is complete, use as-is with unified source
      setFullProduct(product)
      if (!selectedVariantId && product.variants?.[0]) {
        setSelectedVariantId(product.variants[0].id)
      }
      // Always set roast and grind from product data (user hasn't selected these yet)
      setSelectedRoast(product.coffeeProfile?.roastLevelNames?.[0] || "")
      setSelectedGrind(product.coffeeProfile?.grindTypeNames?.[0] || "")
    }
  }, [isOpen, product])

  const mainImageRaw = useMemo(
    () => fullProduct.images?.find((image) => image.isMain)?.imageUrl || fullProduct.images?.[0]?.imageUrl,
    [fullProduct.images],
  )
  const mainImage = mainImageRaw ? getImageUrl(mainImageRaw) : null

  // STRICT PRICE RESOLUTION: Use resolved price from variant based on selectedVariantId
  const currentPrice = selectedVariant?.prices?.find((p: any) => p.currencyCode === currency)?.price ?? selectedVariant?.price ?? 0
  const isPriceAvailable = currentPrice > 0

  const hasValidSelection = Boolean(selectedVariant && selectedRoast && selectedGrind)

  const handleAddToCart = () => {
    if (!hasValidSelection || !selectedVariant) {
      toast.error(t('products.detail.selectWeight'))
      return
    }
    if (!fullProduct || !fullProduct.coffeeProfile?.roastLevelIds || fullProduct.coffeeProfile?.roastLevelIds.length === 0 || !fullProduct.coffeeProfile?.grindTypeIds || fullProduct.coffeeProfile?.grindTypeIds.length === 0) {
      toast.error(t('common.actions.loading'))
      return
    }

    // 1. Use resolved price and productVariantId from strict resolution
    const productVariantId = selectedVariant.id

    // 2. Find Roast ID by Name using API keys
    const roastIndex = fullProduct.coffeeProfile?.roastLevelNames?.indexOf(selectedRoast) ?? -1
    const roastLevelId = roastIndex >= 0 ? fullProduct.coffeeProfile?.roastLevelIds?.[roastIndex] : EMPTY_GUID

    // 3. Find Grind ID by Name using API keys
    const grindIndex = fullProduct.coffeeProfile?.grindTypeNames?.indexOf(selectedGrind) ?? -1
    const grindTypeId = grindIndex >= 0 ? fullProduct.coffeeProfile?.grindTypeIds?.[grindIndex] : EMPTY_GUID


    // 4. Send EVERYTHING to addToCart (including real GUIDs)
    addToCart(fullProduct, 1, {
      productVariantId,
      prices: selectedVariant?.prices || [],
      price: currentPrice,
      sku: selectedVariant?.sku || "",
      attributes: selectedVariant?.options?.map(o => `${o.attributeName}: ${o.value}`) || [],
      roastLevelName: selectedRoast,
      roastLevelId: roastLevelId || EMPTY_GUID,
      grindTypeName: selectedGrind,
      grindTypeId: grindTypeId || EMPTY_GUID,
      imageUrl: mainImageRaw || "",
    })

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select your perfect cup</DialogTitle>
          <DialogDescription>
            Choose weight, roast, and grind to tailor {fullProduct.name} to your brewing ritual.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-[1.05fr_1fr] lg:grid-cols-[1.05fr_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-muted">
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainImage} alt={fullProduct.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl text-muted-foreground">
                <Coffee className="h-14 w-14" />
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

            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t('common.weight')}</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {fullProduct.variants?.map((variant: any) => { const label = variant.options?.find((o: any) => o.attributeName.toLowerCase() === "weight")?.value || variant.sku; return ( <button key={variant.id} onClick={() => setSelectedVariantId(variant.id)} className={cn("flex flex-col items-start rounded-xl border px-3 py-2 text-left transition hover:border-espresso-brown", selectedVariantId === variant.id ? "border-espresso-brown bg-espresso-brown/10" : "border-white/10")} > <span className="font-semibold text-espresso-brown dark:text-espresso-brown">{label}</span> </button> ) })}
              </div>
            </div>

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

            <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-3">
              <div className="text-sm text-muted-foreground">
                {isPriceAvailable ? "Crafted to order. Taxes included." : "Select currency and weight"}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Quick Buy with Express Checkout */}
                <div className="flex-1 sm:flex-none">
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

                {/* Add to Cart Button */}
                <Button
                  size="lg"
                  className="flex-1 sm:flex-none w-full sm:w-auto"
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
              </div>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProductVariantModal
