"use client"

"use client"

import { create } from "zustand"
import { basketService, BasketItem } from "./services/basket"
import { resolvePrice, type ProductWithPricing, type CurrencyType } from "./currency-utils"
import type { ProductResponse } from "./services/products"
import { getProduct } from "./services/products"

export const EMPTY_GUID = "00000000-0000-0000-0000-000000000000"

export function generateVariantKey(
  productId: string,
  priceId?: string,
  roastId?: string,
  grindId?: string
): string {
  // Strict normalization: force strings, lowercase, and trim
  const normalizedProductId = String(productId ?? "").toLowerCase().trim()
  const normalizedPriceId = String(priceId ?? "").toLowerCase().trim()
  const normalizedRoastId = String(roastId ?? EMPTY_GUID).toLowerCase().trim()
  const normalizedGrindId = String(grindId ?? EMPTY_GUID).toLowerCase().trim()
  return `${normalizedProductId}-${normalizedPriceId}-${normalizedRoastId}-${normalizedGrindId}`
}

export interface CartItem {
  id: string
  productPriceId: string
  slug: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  variantKey?: string
  weightLabel?: string
  grams?: number
  roastLevelId?: string
  roastLevelName?: string
  grindTypeId?: string
  grindTypeName?: string
  cartItemId?: string
  selectedWeightLabel?: string
  selectedRoast?: string
  selectedGrind?: string
  priceUsed?: number
  product?: ProductResponse | ProductWithPricing
  selectedWeight?: number
}

interface CartStore {
  items: CartItem[]
  isLoading: boolean
  addItem: (item: CartItem, isAuthenticated?: boolean) => void
  removeItem: (idOrKey: string, isAuthenticated?: boolean) => void
  updateQuantity: (id: string, quantity: number, isAuthenticated?: boolean) => void
  clearCart: () => void
  loadBasket: () => Promise<void>
  total: (currency?: CurrencyType) => number
  getItemPrice: (item: CartItem, currency: CurrencyType) => number
}

const getItemKey = (item: Pick<CartItem, "id" | "variantKey">) => item.variantKey || item.id

export const getItemPrice = (item: CartItem, currency: CurrencyType): number => {
  if (item.product && item.selectedWeight !== undefined) {
    const resolved = resolvePrice(item.product, currency, item.selectedWeight)
    if (resolved?.price) return resolved.price
  }
  return item.priceUsed ?? item.price ?? 0
}

const syncWithBackend = async (items: CartItem[]) => {
  try {
    if (items.length === 0) {
      await basketService.deleteBasket()
    } else {
      const basketItems: BasketItem[] = items.map((item) => ({
        productId: item.id,
        productPriceId: item.productPriceId,
        productName: item.name,
        slug: item.slug,
        price: item.priceUsed ?? item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl || "",
        weightLabel: item.selectedWeightLabel || item.weightLabel || "Standard",
        grams: item.grams || 0,
        roastLevelId: item.roastLevelId || EMPTY_GUID,
        roastLevelName: item.selectedRoast || item.roastLevelName || "Original",
        grindTypeId: item.grindTypeId || EMPTY_GUID,
        grindTypeName: item.selectedGrind || item.grindTypeName || "Whole Bean",
      }))
      await basketService.updateBasket(basketItems)
    }
  } catch (error) {
    console.error("Failed to sync cart with backend:", error)
  }
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isLoading: false,

  addItem: (item, isAuthenticated = false) =>
    set((state) => {
      const variantKey = generateVariantKey(item.id, item.productPriceId, item.roastLevelId, item.grindTypeId)
      const itemWithKey = { ...item, variantKey }

      const existingItemIndex = state.items.findIndex((si) => si.variantKey === variantKey)

      const updatedItems: CartItem[] =
        existingItemIndex > -1
          ? state.items.map((si, idx) => (idx === existingItemIndex ? { ...si, quantity: si.quantity + item.quantity } : si))
          : [...state.items, itemWithKey]

      if (isAuthenticated) syncWithBackend(updatedItems)
      return { items: updatedItems }
    }),

  removeItem: (idOrKey, isAuthenticated = false) =>
    set((state) => {
      const itemToDelete = state.items.find(
        (i) => i.cartItemId === idOrKey || i.variantKey === idOrKey || i.id === idOrKey
      )

      let newItems: CartItem[] = []
      let backendDeleteId: string | null = null

      if (itemToDelete) {
        newItems = state.items.filter((i) => {
          const matchCartId = itemToDelete.cartItemId && i.cartItemId === itemToDelete.cartItemId
          const matchVariantKey = itemToDelete.variantKey && i.variantKey === itemToDelete.variantKey
          return !(matchCartId || matchVariantKey)
        })
        // Use backend basket item id for DELETE /basket/{itemId}
        backendDeleteId = itemToDelete.cartItemId || null
      } else {
        newItems = state.items.filter((i) => (i.cartItemId !== idOrKey) && (getItemKey(i) !== idOrKey))
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrKey)
        backendDeleteId = isGuid ? idOrKey : null
      }

      console.log("Cart removeItem:", {
        requestedId: idOrKey,
        localFilterCartItemId: itemToDelete?.cartItemId ?? null,
        localFilterVariantKey: itemToDelete?.variantKey ?? null,
        backendDeleteId,
      })

      if (isAuthenticated) {
        if (backendDeleteId) {
          const isValidGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(backendDeleteId)
          if (isValidGuid) {
            basketService.deleteBasketItem(backendDeleteId).catch((error) =>
              console.error("Failed to delete cart item:", error)
            )
          } else {
            // Non-GUID ID edge case; fall back to syncing entire basket
            syncWithBackend(newItems)
          }
        } else {
          // No backend ID available (e.g., variantKey-only); sync full basket
          syncWithBackend(newItems)
        }
      }

      return { items: newItems }
    }),

  updateQuantity: (itemKey, quantity, isAuthenticated = false) =>
    set((state) => {
      const newItems = state.items.map((i) => (getItemKey(i) === itemKey ? { ...i, quantity } : i))
      if (isAuthenticated) syncWithBackend(newItems)
      return { items: newItems }
    }),

  clearCart: () => {
    set({ items: [] })
    syncWithBackend([])
  },

  loadBasket: async () => {
    set({ isLoading: true })
    try {
      const basket = await basketService.getBasket()

      const itemPromises = basket.items
        .filter((item) => Boolean(item.slug))
        .map(async (item) => {
          const productId = (item.productId || "").toLowerCase().trim()
          const productPriceId = (item.productPriceId || "").toLowerCase().trim()
          const roastLevelId = (item.roastLevelId || EMPTY_GUID).toLowerCase().trim()
          const grindTypeId = (item.grindTypeId || EMPTY_GUID).toLowerCase().trim()
          const variantKey = generateVariantKey(productId, productPriceId, roastLevelId, grindTypeId)

          // Debug log for server-loaded items and generated key
          try {
            console.log("🌍 LOADED SERVER:", {
              productId,
              productPriceId,
              roastLevelId,
              grindTypeId,
              GENERATED_KEY: variantKey,
            })
          } catch {}

          let productData: ProductResponse | undefined
          try {
            productData = await getProduct(item.slug!)
          } catch (e) {
            console.warn(`Could not sync product data for ${item.slug}`)
          }

          return {
            id: productId,
            productPriceId: productPriceId,
            name: item.productName,
            slug: item.slug!,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            variantKey,
            cartItemId: item.id,
            weightLabel: item.weightLabel,
            grams: item.grams,
            roastLevelId,
            roastLevelName: item.roastLevelName,
            grindTypeId,
            grindTypeName: item.grindTypeName,
            selectedWeightLabel: item.weightLabel,
            selectedRoast: item.roastLevelName,
            selectedGrind: item.grindTypeName,
            priceUsed: item.price,
            product: productData,
            selectedWeight: item.grams,
          }
        })

      const resolvedItems = await Promise.all(itemPromises)
      set({ items: resolvedItems, isLoading: false })
    } catch (error) {
      console.error("Basket load failed:", error)
      set({ items: [], isLoading: false })
    }
  },

  total: (currency?: CurrencyType) => {
    const { items } = get()
    const activeCurrency = currency ?? "USD"
    return items.reduce((sum, item) => sum + getItemPrice(item, activeCurrency) * item.quantity, 0)
  },

  getItemPrice: (item: CartItem, currency: CurrencyType) => getItemPrice(item, currency),
}))