"use client"

import toast from "react-hot-toast"
import { useAuthStore } from "@/lib/auth-store"
import { useCartStore, generateVariantKey, EMPTY_GUID } from "@/lib/cart-store"
import { getImageUrl } from "@/lib/utils"

export interface AddToCartProduct {
  id: string
  slug?: string
  name: string
  price?: number
  availablePrices?: Array<{ price: number }>
  images?: { imageUrl: string; isMain: boolean; id?: string }[]
  roastLevelIds?: string[]
  roastLevelNames?: string[]
  grindTypeIds?: string[]
  grindTypeNames?: string[]
}

export interface AddToCartOptions {
  productPriceId?: string  // CRITICAL: The GUID for the selected price/weight
  price?: number
  weightLabel?: string
  grams?: number
  roastLevelId?: string
  roastLevelName?: string
  grindTypeId?: string
  grindTypeName?: string
  variantKey?: string
  imageUrl?: string
  selectedWeight?: number  // CRITICAL: Weight in grams for dynamic pricing
}

export function useAddToCart() {
  const { accessToken } = useAuthStore()
  const { addItem } = useCartStore()

  const addToCart = (product: AddToCartProduct, quantity: number = 1, options: AddToCartOptions = {}) => {
    const isAuthenticated = !!accessToken

    const imageUrl = options.imageUrl
      || getImageUrl(product.images?.find((i) => i.isMain)?.imageUrl || product.images?.[0]?.imageUrl || "")
      || ""

    const explicitPrice = options.price
    const fallbackPrice = Math.min(
      ...(product.availablePrices?.map((p) => p.price) || []),
      Number.isFinite(product.price ?? NaN) ? (product.price as number) : Infinity
    )
    const priceCandidate = Number.isFinite(explicitPrice ?? NaN) ? (explicitPrice as number) : fallbackPrice
    const price = Number.isFinite(priceCandidate) ? priceCandidate : 0

    // Map selected names to IDs using index alignment
    // Ensure we get real IDs or Empty GUID
    const roastIndex = product.roastLevelNames?.indexOf(options.roastLevelName || "") ?? -1
    const roastLevelId =
      options.roastLevelId ||
      (roastIndex >= 0 ? product.roastLevelIds?.[roastIndex] : undefined) ||
      EMPTY_GUID

    const grindIndex = product.grindTypeNames?.indexOf(options.grindTypeName || "") ?? -1
    const grindTypeId =
      options.grindTypeId ||
      (grindIndex >= 0 ? product.grindTypeIds?.[grindIndex] : undefined) ||
      EMPTY_GUID

    // Use shared generateVariantKey helper to ensure consistency with cart-store
    const variantKey = generateVariantKey(
      product.id,
      options.productPriceId,
      roastLevelId,
      grindTypeId
    )

    const cartItemToAdd = {
      id: product.id,
      productPriceId: options.productPriceId || "",
      slug: product.slug ?? "",
      name: product.name,
      price,
      quantity,
      imageUrl,
      variantKey,
      weightLabel: options.weightLabel,
      grams: options.grams,
      roastLevelId: roastLevelId || EMPTY_GUID,
      roastLevelName: options.roastLevelName,
      grindTypeId: grindTypeId || EMPTY_GUID,
      grindTypeName: options.grindTypeName,
      // Selected attributes for display
      selectedWeightLabel: options.weightLabel,
      selectedRoast: options.roastLevelName,
      selectedGrind: options.grindTypeName,
      priceUsed: price,
      // CRITICAL: Include full product data and selected weight for dynamic pricing
      product: product as any,  // Full product data for resolvePrice()
      selectedWeight: options.selectedWeight,  // Weight in grams
    }

    // Debug: show key inputs and the generated variant key
    try {
    } catch {}


    addItem(cartItemToAdd, isAuthenticated)

    toast.success("Added to basket!")
  }

  return { addToCart }
}
