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
import { resolvePrice, getAvailableWeights, type ProductWithPricing } from "@/lib/currency-utils"
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
  const [selectedWeight, setSelectedWeight] = useState<number | undefined>()
  
  // Initialize from unified source instead of only availablePrices
  const initialAllPrices = [
    (product as any).activePrice,
    ...((product as any).otherAvailableCurrencies || []),
    ...(product.availablePrices || []),
  ].filter(Boolean)
  const initialPrice = initialAllPrices[0]
  
  const [selectedWeightId, setSelectedWeightId] = useState<string>(initialPrice?.productPriceId || "")
  const [selectedWeightLabel, setSelectedWeightLabel] = useState<string>(initialPrice?.weightLabel || "")
  const [selectedRoast, setSelectedRoast] = useState<string>(product.roastLevelNames?.[0] || "")
  const [selectedGrind, setSelectedGrind] = useState<string>(product.grindTypeNames?.[0] || "")



  useEffect(() => {
    if (!isOpen) return


    // Set default weight ONLY on first open (when selectedWeight is undefined)
    const availableWeights = getAvailableWeights(fullProduct as unknown as ProductWithPricing)
    if (availableWeights.length > 0 && selectedWeight === undefined) {
      const defaultWeightNum = Number(availableWeights[0])
      setSelectedWeight(defaultWeightNum)
      
      // Also set default ID and Label from unified source
      const allPrices = [
        (fullProduct as any).activePrice,
        ...((fullProduct as any).otherAvailableCurrencies || []),
        ...(fullProduct.availablePrices || []),
      ].filter(Boolean)
      const defaultWeightObj = allPrices.find((p) => Number(p.grams) === defaultWeightNum)
      if (defaultWeightObj) {
        setSelectedWeightId(defaultWeightObj.productPriceId || "")
        setSelectedWeightLabel(defaultWeightObj.weightLabel || `${defaultWeightNum}g`)
      }
    }

    // Check if product data is incomplete (missing IDs)
    const hasIncompleteData = !product.roastLevelIds || product.roastLevelIds.length === 0 || !product.grindTypeIds || product.grindTypeIds.length === 0

    if (hasIncompleteData && product.slug) {
      // Fetch full product details
      import("@/lib/services/products")
        .then(({ getProduct }) => getProduct(product.slug))
        .then((data) => {
          setFullProduct(data)
          // Only reset weight if it hasn't been set yet
          const weights = getAvailableWeights(data as unknown as ProductWithPricing)
          if (weights.length > 0 && selectedWeight === undefined) {
            const firstWeight = Number(weights[0])
            setSelectedWeight(firstWeight)
            
            // Use unified price source
            const dataAllPrices = [
              (data as any).activePrice,
              ...((data as any).otherAvailableCurrencies || []),
              ...(data.availablePrices || []),
            ].filter(Boolean)
            const firstWeightObj = dataAllPrices.find((p) => Number(p.grams) === firstWeight)
            if (firstWeightObj) {
              setSelectedWeightId(firstWeightObj.productPriceId || "")
              setSelectedWeightLabel(firstWeightObj.weightLabel || `${firstWeight}g`)
            }
          }
          // Always set roast and grind from fetched data (user hasn't selected these yet)
          setSelectedRoast(data.roastLevelNames?.[0] || "")
          setSelectedGrind(data.grindTypeNames?.[0] || "")
        })
        .catch((err) => console.error("❌ MODAL: Failed to fetch full product:", err))
    } else {
      // Data is complete, use as-is with unified source
      setFullProduct(product)
      const weights = getAvailableWeights(product as unknown as ProductWithPricing)
      if (weights.length > 0 && selectedWeight === undefined) {
        const firstWeight = Number(weights[0])
        setSelectedWeight(firstWeight)
        
        // Use unified price source
        const productAllPrices = [
          (product as any).activePrice,
          ...((product as any).otherAvailableCurrencies || []),
          ...(product.availablePrices || []),
        ].filter(Boolean)
        const firstWeightObj = productAllPrices.find((p) => Number(p.grams) === firstWeight)
        if (firstWeightObj) {
          setSelectedWeightId(firstWeightObj.productPriceId || "")
          setSelectedWeightLabel(firstWeightObj.weightLabel || `${firstWeight}g`)
        }
      }
      // Always set roast and grind from product data (user hasn't selected these yet)
      setSelectedRoast(product.roastLevelNames?.[0] || "")
      setSelectedGrind(product.grindTypeNames?.[0] || "")
    }
  }, [isOpen, product])

  const mainImageRaw = useMemo(
    () => fullProduct.images?.find((image) => image.isMain)?.imageUrl || fullProduct.images?.[0]?.imageUrl,
    [fullProduct.images],
  )
  const mainImage = mainImageRaw ? getImageUrl(mainImageRaw) : null

  // UNIFIED PRICE SOURCE: Combine all price variants from all sources (just like resolvePrice does)
  const allPriceVariants = useMemo(() => {
    const combined = [
      (fullProduct as any).activePrice,
      ...((fullProduct as any).otherAvailableCurrencies || []),
      ...(fullProduct.availablePrices || []),
    ].filter(Boolean)
    
    return combined
  }, [fullProduct])

  // STRICT PRICE RESOLUTION: Use resolvePrice with currency + weight
  const resolved = useMemo(() => {
    const result = resolvePrice(fullProduct as unknown as ProductWithPricing, currency, selectedWeight)
    return result
  }, [fullProduct, currency, selectedWeight])

  const currentPrice = resolved?.price ?? 0
  const isPriceAvailable = currentPrice > 0

  // Compute display price based on current selected weight (fallback for old logic)
  const selectedWeightObj = useMemo(
    () => fullProduct.availablePrices?.find((option) => option.productPriceId === selectedWeightId),
    [fullProduct.availablePrices, selectedWeightId],
  )

  const hasValidSelection = Boolean(resolved && selectedRoast && selectedGrind)

  const handleAddToCart = () => {
    if (!hasValidSelection || !resolved) {
      toast.error(t('products.detail.selectWeight'))
      return
    }
    if (!fullProduct || !fullProduct.roastLevelIds || fullProduct.roastLevelIds.length === 0 || !fullProduct.grindTypeIds || fullProduct.grindTypeIds.length === 0) {
      toast.error(t('common.actions.loading'))
      return
    }

    // 1. Use resolved price and productPriceId from strict resolution
    const productPriceId = resolved.productPriceId || selectedWeightId

    // 2. Find Roast ID by Name using API keys
    const roastIndex = fullProduct.roastLevelNames?.indexOf(selectedRoast) ?? -1
    const roastLevelId = roastIndex >= 0 ? fullProduct.roastLevelIds?.[roastIndex] : EMPTY_GUID

    // 3. Find Grind ID by Name using API keys
    const grindIndex = fullProduct.grindTypeNames?.indexOf(selectedGrind) ?? -1
    const grindTypeId = grindIndex >= 0 ? fullProduct.grindTypeIds?.[grindIndex] : EMPTY_GUID


    // 4. Send EVERYTHING to addToCart (including real GUIDs)
    addToCart(fullProduct, 1, {
      productPriceId,
      price: currentPrice,
      weightLabel: resolved.weightLabel || `${resolved.grams}g`,
      grams: resolved.grams,
      selectedWeight: resolved.grams,
      roastLevelName: selectedRoast,
      roastLevelId: roastLevelId || EMPTY_GUID,
      grindTypeName: selectedGrind,
      grindTypeId: grindTypeId || EMPTY_GUID,
      variantKey: `${fullProduct.id}-${productPriceId}-${roastLevelId}-${grindTypeId}`,
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
                {fullProduct.originName && <Badge variant="outline">{fullProduct.originName}</Badge>}
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
                {getAvailableWeights(fullProduct as unknown as ProductWithPricing).map((grams) => {
                  // Resolve price for this specific weight
                  const weightResolved = resolvePrice(fullProduct as unknown as ProductWithPricing, currency, grams)
                  const weightPrice = weightResolved?.price ?? 0
                  const weightLabel = weightResolved?.weightLabel || `${grams}g`
                  
                  // STRICT Type-safe comparison for active state - FORCE Number on both sides
                  const gramsNum = Number(grams)
                  const selectedNum = Number(selectedWeight)
                  const isActive = selectedNum === gramsNum
                  
                  
                  return (
                    <button
                      key={grams}
                      type="button"
                      onClick={() => {
                        const numWeight = Number(grams)
                        
                        setSelectedWeight(numWeight)
                        
                        // Use unified price source instead of only availablePrices
                        const weightObj = allPriceVariants.find((p) => Number(p.grams) === numWeight)
                        
                        if (weightObj) {
                          setSelectedWeightLabel(weightObj.weightLabel || `${numWeight}g`)
                          setSelectedWeightId(weightObj.productPriceId || "")
                        } else {
                          console.error("[Modal] Available variants:", allPriceVariants.map(p => ({ 
                            grams: p.grams, 
                            gramsType: typeof p.grams,
                            numGrams: Number(p.grams),
                            matches: Number(p.grams) === numWeight,
                            currency: p.currency || p.currencyCode,
                          })))
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-xs transform-gpu will-change-transform transition-all duration-200 hover:border-accent hover:scale-[1.02]",
                        isActive 
                          ? "border-accent bg-accent/10 shadow-md scale-[1.02]" 
                          : "border-border bg-background",
                      )}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded-full border-2 transition-colors flex items-center justify-center",
                        isActive ? "border-accent bg-accent" : "border-muted-foreground"
                      )}>
                        {isActive && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-semibold">{weightLabel}</span>
                      </div>
                    </button>
                  )
                })}
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
                    {fullProduct.roastLevelNames?.map((name) => (
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
                    {fullProduct.grindTypeNames?.map((name) => (
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
                      selectedWeight={selectedWeight}
                      selectedWeightId={selectedWeightId}
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
