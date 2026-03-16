"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { basketService, BasketItem } from "./services/basket"
import { resolvePrice, type ProductWithPricing, type CurrencyType } from "./currency-utils"
import type { ProductResponse } from "./services/products"
import { getProduct } from "./services/products"
import { useAuthStore } from "./auth-store"

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
  clearGuestData: () => void
  loadBasket: () => Promise<void>
  syncGuestItemsToAuthenticatedBasket: () => Promise<void>
  total: (currency?: CurrencyType) => number
  getItemPrice: (item: CartItem, currency: CurrencyType) => number
  rehydrate: () => void // For manual hydration after skipHydration
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
    const { user, userBasketId } = useAuthStore.getState()
    
    // Determine basketId - prefer userBasketId from authentication (set after Google login)
    let basketId: string | undefined = undefined
    if (user?.id) {
      basketId = userBasketId || user.id;
    } else {
      const storedGuestId = typeof window !== "undefined" ? localStorage.getItem("guestBasketId") : null
      basketId = storedGuestId ?? undefined
    }

    if (!basketId) {
      return
    }

    if (items.length === 0) {
      // Clear basket by sending empty items
      await basketService.clearBasket(basketId)
    } else {
      const basketItems: BasketItem[] = items.map((item) => ({
        id: item.cartItemId,
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
      
      // Send to backend with basketId in URL
      await basketService.updateBasket({
        id: basketId,
        items: basketItems,
      })
    }
  } catch (error) {
    console.error("Failed to sync cart with backend:", error)
  }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
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
        // Use backend basket item id for DELETE /basket/{basketId}/{itemId}
        backendDeleteId = itemToDelete.cartItemId || null
      } else {
        newItems = state.items.filter((i) => (i.cartItemId !== idOrKey) && (getItemKey(i) !== idOrKey))
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrKey)
        backendDeleteId = isGuid ? idOrKey : null
      }


      if (isAuthenticated) {
        // Always sync the entire basket instead of trying to delete individual items
        syncWithBackend(newItems)
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

  clearGuestData: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("guestBasketId")
      localStorage.removeItem("df_guest_basket_id")
      localStorage.removeItem("df-cart-storage")
      localStorage.removeItem("cart-storage")
      localStorage.removeItem("basketId")
    }

    // Clear local items only; do not touch backend basket
    set({ items: [] })
  },

  loadBasket: async () => {
    set({ isLoading: true })
    try {
      const { user, userBasketId } = useAuthStore.getState()
      
      // Use stored userBasketId if available (set after Google login), otherwise fall back to user ID
      let basketId = userBasketId || user?.id
      const isAuthenticated = !!user?.id
      
      if (!basketId) {
        // Check if guest ID exists in localStorage
        const storedGuestId = typeof window !== "undefined" ? localStorage.getItem("guestBasketId") : null
        basketId = storedGuestId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Store guest ID for consistency
        if (typeof window !== "undefined") {
          localStorage.setItem("guestBasketId", basketId)
        }
      }
      
      
      // Call getBasket with basketId in URL
      const basket = await basketService.getBasket(basketId)

      const itemPromises = (basket.items || [])
        .filter((item) => Boolean(item.slug))
        .map(async (item) => {
          const productId = (item.productId || "").toLowerCase().trim()
          const productPriceId = (item.productPriceId || "").toLowerCase().trim()
          const roastLevelId = (item.roastLevelId || EMPTY_GUID).toLowerCase().trim()
          const grindTypeId = (item.grindTypeId || EMPTY_GUID).toLowerCase().trim()
          const variantKey = generateVariantKey(productId, productPriceId, roastLevelId, grindTypeId)

          // Debug log for server-loaded items and generated key
          try {
          } catch {}

          let productData: ProductResponse | undefined
          try {
            productData = await getProduct(item.slug!)
          } catch (e) {
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
      set({ items: resolvedItems || [], isLoading: false })
    } catch (error) {
      set({ items: [], isLoading: false })
    }
  },

  total: (currency?: CurrencyType) => {
    const { items } = get()
    const activeCurrency = currency ?? "USD"
    return items.reduce((sum, item) => sum + getItemPrice(item, activeCurrency) * item.quantity, 0)
  },

  getItemPrice: (item: CartItem, currency: CurrencyType) => getItemPrice(item, currency),

  rehydrate: () => {
    // Manually rehydrate the store from localStorage
    // This is needed because we set skipHydration: true to prevent hydration mismatch
    useCartStore.persist.rehydrate()
  },

  syncGuestItemsToAuthenticatedBasket: async () => {
    const { items } = get()
    const { user, userBasketId } = useAuthStore.getState()
    
    // Only proceed if user is authenticated
    if (!user?.id) {
      return
    }
    
    // Clear guest ID from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("guestBasketId")
    }
    
    // Clear local items
    set({ items: [] })
    
    // Ensure items is an array
    const itemsToSync = items || []
    
    if (itemsToSync.length === 0) {
      return
    }
    
    try {
      // Use stored userBasketId if available (set after Google login), otherwise use user.id
      const basketId = userBasketId || user.id;
      
      // Convert current local items to BasketItem format
      const basketItems: BasketItem[] = itemsToSync.map((item) => ({
        id: item.cartItemId,
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
      
      // Send guest items to authenticated user's basket
      await basketService.updateBasket({
        id: basketId,
        items: basketItems,
      })
      
    } catch (error) {
      throw error
    }
  },
    }),
    {
      name: "df-cart-storage", // LocalStorage key
      skipHydration: true, // Prevent hydration mismatch in Next.js
      partialize: (state) => ({
        items: state.items, // Only persist cart items
      }),
    }
  )
)