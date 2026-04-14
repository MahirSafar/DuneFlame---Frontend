"use client"

import toast from "react-hot-toast"
import { useAuthStore } from "@/lib/auth-store"
import { useCartStore, generateVariantKey, EMPTY_GUID } from "@/lib/cart-store"
import { getImageUrl } from "@/lib/utils"

export interface AddToCartProduct {
  id: string
  slug?: string
  name: string
  images?: { imageUrl: string; isMain: boolean; id?: string }[]
  variants?: Array<{ id: string; price: number; stockQuantity: number | null }>
  coffeeProfile?: any
}

export interface AddToCartOptions {
  productVariantId: string
  price: number
  prices?: { currencyCode: string; price: number }[]
  sku: string
  attributes: string[]
  roastLevelName?: string
  grindTypeName?: string
  roastLevelId?: string
  grindTypeId?: string
  imageUrl?: string
}

export function useAddToCart() {
  const { accessToken } = useAuthStore()
  const { addItem } = useCartStore()

  const addToCart = (product: AddToCartProduct, quantity: number = 1, options: AddToCartOptions) => {
    const isAuthenticated = !!accessToken

    const imageUrl = options.imageUrl
      || getImageUrl(product.images?.find((i) => i.isMain)?.imageUrl || product.images?.[0]?.imageUrl || "")
      || ""

    // Use shared generateVariantKey helper to ensure consistency with cart-store
    const variantKey = generateVariantKey(
      product.id,
      options.productVariantId,
      options.roastLevelId,
      options.grindTypeId
    )

    const cartItemToAdd = {
      id: product.id,
      productId: product.id,
      productVariantId: options.productVariantId || "",
      slug: product.slug ?? "",
      name: product.name,
      price: options.price,
      prices: options.prices || [],
      quantity,
      imageUrl,
      sku: options.sku,
      attributes: options.attributes,
      variantKey,
      roastLevelId: options.roastLevelId || EMPTY_GUID,
      roastLevelName: options.roastLevelName,
      grindTypeId: options.grindTypeId || EMPTY_GUID,
      grindTypeName: options.grindTypeName,
      product: product as any, 
    }

    // Debug: show key inputs and the generated variant key
    try {
    } catch {}


    addItem(cartItemToAdd, isAuthenticated)

    toast.success("Added to basket!")
  }

  return { addToCart }
}
