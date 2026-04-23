"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { basketService, BasketItem } from "./services/basket"
import { type ProductWithPricing, type CurrencyType } from "./currency-utils"
import type { ProductResponse } from "./services/products"
import { getProduct } from "./services/products"
import { useAuthStore } from "./auth-store"

export const EMPTY_GUID = "00000000-0000-0000-0000-000000000000"

/**
 * Normalize an ID so that null, undefined, "", and EMPTY_GUID are all treated as equal.
 * Used for roastLevelId / grindTypeId comparisons where backends may omit or zero-out the field.
 */
function normalizeId(id: string | null | undefined): string {
  if (id === null || id === undefined || id === "" || id === EMPTY_GUID) {
    return EMPTY_GUID
  }
  return id.toLowerCase().trim()
}

/**
 * Convert an optional GUID field to null if it is empty, EMPTY_GUID, or undefined.
 * Ensures the backend wire payload never receives "" or the zero-GUID for optional fields.
 */
function toNullableGuid(id: string | null | undefined): string | null {
  if (!id || id === EMPTY_GUID) return null
  return id
}

export function generateVariantKey(
  productId: string,
  variantId?: string,
  roastId?: string,
  grindId?: string
): string {
  // Strict normalization: force strings, lowercase, and trim
  const normalizedProductId = String(productId ?? "").toLowerCase().trim()
  const normalizedVariantId = String(variantId ?? "").toLowerCase().trim()
  // Use normalizeId so that null / "" / EMPTY_GUID all collapse to the same key segment
  const normalizedRoastId = normalizeId(roastId)
  const normalizedGrindId = normalizeId(grindId)
  return `${normalizedProductId}-${normalizedVariantId}-${normalizedRoastId}-${normalizedGrindId}`
}

export interface CartItem {
  id: string
  productId: string
  variantId: string
  slug: string
  name: string
  price: number
  prices?: { currencyCode: string; price: number }[]
  quantity: number
  imageUrl?: string
  sku: string
  attributes: string[]
  variantKey?: string
  roastLevelName?: string
  grindTypeName?: string
  roastLevelId?: string
  grindTypeId?: string
  cartItemId?: string
  product?: ProductResponse | ProductWithPricing
}

interface CartStore {
  items: CartItem[]
  isLoading: boolean
  addItem: (item: CartItem, isAuthenticated?: boolean) => Promise<void>
  removeItem: (idOrKey: string, isAuthenticated?: boolean) => void
  updateQuantity: (id: string, quantity: number, isAuthenticated?: boolean) => void
  clearCart: () => void
  clearGuestData: () => void
  loadBasket: () => Promise<void>
  syncGuestItemsToAuthenticatedBasket: () => Promise<void>
  total: (currency?: CurrencyType) => number
  getItemPrice: (item: CartItem, currency: CurrencyType) => number
}

const getItemKey = (item: Pick<CartItem, "id" | "variantKey">) => item.variantKey || item.id

export const getItemPrice = (item: CartItem, currency: CurrencyType): number => {
  return item.prices?.find((p: any) => p.currencyCode === currency)?.price ?? item.price ?? 0
}

const syncWithBackend = async (items: CartItem[]) => {
  const auth = useAuthStore.getState()
  const isAuthenticated = !!auth.accessToken

  // Determine basketId - prefer userBasketId from authentication (set after Google login)
  let basketId: string | undefined = auth.userBasketId || auth.user?.id || undefined

  // CRITICAL FIX: If authenticated but missing basketId, fetch it before syncing
  if (isAuthenticated && !basketId) {
    try {
      const fetchedId = await auth.fetchAndStoreBasketId()
      if (fetchedId) basketId = fetchedId
    } catch (error) {
      console.error("[CartStore] Failed to fetch basket ID for sync", error)
    }
  }

  // Fallback for guests
  if (!isAuthenticated && !basketId) {
    if (typeof window !== "undefined") {
      basketId = localStorage.getItem("guestBasketId") || undefined
      if (!basketId) {
        basketId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
        localStorage.setItem("guestBasketId", basketId)
      }
    }
  }

  if (!basketId) {
    console.warn("[CartStore] Aborting sync: No basket ID could be resolved.")
    return
  }

  // Strip any items that somehow still carry an empty/zero GUID before hitting the network
  const validItems = items.filter(
    (item) => item.variantId && item.variantId !== "" && item.variantId !== EMPTY_GUID
  )

  if (validItems.length === 0) {
    // Clear basket by sending empty items
    await basketService.clearBasket(basketId)
  } else {
    const basketItems: BasketItem[] = validItems.map((item) => ({
      id: item.cartItemId,
      productId: item.productId,
      productVariantId: item.variantId,
      productName: item.name,
      slug: item.slug,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl || "",
      sku: item.sku || "",
      attributes: item.attributes ?? [],
      roastLevelId: toNullableGuid(item.roastLevelId),
      roastLevelName: item.roastLevelName ?? null,
      grindTypeId: toNullableGuid(item.grindTypeId),
      grindTypeName: item.grindTypeName ?? null,
    }))

    // Send to backend with basketId in URL
    await basketService.updateBasket({
      id: basketId,
      items: basketItems,
    })
  }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: async (item, isAuthenticated = false) => {
        // PERIMETER GUARD: Reject any item with a missing or empty GUID variant ID
        if (
          !item.variantId ||
          item.variantId === "" ||
          item.variantId === EMPTY_GUID
        ) {
          console.error("[CartStore] BLOCKED INVALID VARIANT ID — item not added:", item)
          return
        }

        const state = get()
        const variantKey = generateVariantKey(item.productId, item.variantId, item.roastLevelId, item.grindTypeId)
        const itemWithKey = { ...item, variantKey, cartItemId: item.cartItemId || crypto.randomUUID() }
        const existingItemIndex = state.items.findIndex((si) => si.variantKey === variantKey)
        const updatedItems: CartItem[] =
          existingItemIndex > -1
            ? state.items.map((si, idx) => (idx === existingItemIndex ? { ...si, quantity: si.quantity + item.quantity } : si))
            : [...state.items, itemWithKey]

        if (isAuthenticated) {
          // Pessimistic update: confirm with the backend FIRST, then commit to local state.
          // This eliminates the race where navigating to the cart page triggers loadBasket
          // before the POST has landed, returning an empty basket and wiping Zustand.
          await syncWithBackend(updatedItems)
          set({ items: updatedItems })
        } else {
          // Guest: optimistic — no backend call, update local state immediately
          set({ items: updatedItems })
        }
      },

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
          // Backend returns `productVariantId` — now properly typed on BasketItem
          const variantId = (item.productVariantId || "").trim()
          const variantKey = generateVariantKey(productId, variantId)

          // Debug log for server-loaded items and generated key
          try {
          } catch {}

          let productData: ProductResponse | undefined
          try {
            productData = await getProduct(item.slug!)
          } catch (e) {
          }

          return {
            id: productId, // maintain id backwards compatibility if needed, or align with productId
            productId: productId,
            variantId: variantId,
            name: item.productName || productData?.name || "Unknown",
            slug: item.slug!,
            price: item.price,
            prices: productData?.variants?.find((v: any) => v.id === variantId)?.prices || [],
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            sku: "",
            attributes: productData?.variants?.find((v: any) => v.id === variantId)?.options?.map((o: any) => `${o.attributeName}: ${o.value}`) || [],
            variantKey,
            cartItemId: item.id,
            product: productData,
            roastLevelId: item.roastLevelId ?? undefined,
            roastLevelName: item.roastLevelName ?? undefined,
            grindTypeId: item.grindTypeId ?? undefined,
            grindTypeName: item.grindTypeName ?? undefined,
          }
        })

      const resolvedItems = await Promise.all(itemPromises)
      // Filter out any items the backend returned with invalid variantIds (legacy data)
      const validResolved = resolvedItems.filter(
        (item) => item.variantId && item.variantId !== "" && item.variantId !== EMPTY_GUID
      )
      set({ items: validResolved, isLoading: false })
    } catch (error) {
      // Do NOT wipe existing items on a fetch failure; preserve what the user has locally
      console.error("[CartStore] loadBasket failed, preserving existing items:", error)
      set({ isLoading: false })
    }
  },

  total: (currency?: CurrencyType) => {
    const { items } = get()
    const activeCurrency = currency ?? "USD"
    return items.reduce((sum, item) => sum + getItemPrice(item, activeCurrency) * item.quantity, 0)
  },

  getItemPrice: (item: CartItem, currency: CurrencyType) => getItemPrice(item, currency),

  syncGuestItemsToAuthenticatedBasket: async () => {
    const { items } = get()
    const { user, userBasketId } = useAuthStore.getState()
    
    // Only proceed if user is authenticated
    if (!user?.id) {
      return
    }

    // Filter valid items FIRST — before touching the store or localStorage.
    // Items with EMPTY_GUID were blocked by addItem on new sessions but may survive
    // from old localStorage data; sending them would cause a backend 400 and wipe the cart.
    const validItems = (items || []).filter(
      (item) => item.variantId && item.variantId !== "" && item.variantId !== EMPTY_GUID
    )

    if (validItems.length === 0) {
      // Nothing valid to push — authenticated basket will be loaded as-is by caller
      // Still clear the guest localStorage key since we're now authenticated
      if (typeof window !== "undefined") {
        localStorage.removeItem("guestBasketId")
      }
      // Clear Zustand state (no valid guest items to preserve)
      set({ items: [] })
      return
    }

    try {
      // Use stored userBasketId if available (set after Google login), otherwise use user.id
      const basketId = userBasketId || user.id;

      // 1. Fetch the authenticated user's basket using "me" — avoids ResolveBasketId override
      // Guest items are local-only (optimistic): the backend has no guest basket record,
      // so we must NOT try to read the guest basket from the API here.
      const existingBasket = await basketService.getBasket("me")
      // Backend GET responses use `productVariantId` — now the canonical field on BasketItem.
      // Spread directly; no field normalization needed.
      const mergedItems: BasketItem[] = [...(existingBasket.items || [])]

      // 2. Merge guest items: increment quantity if already exists, push if new
      for (const guestItem of validItems) {
        const existingIdx = mergedItems.findIndex(
          (fi) =>
            fi.productId === guestItem.productId &&
            fi.productVariantId === guestItem.variantId &&
            normalizeId(fi.roastLevelId) === normalizeId(guestItem.roastLevelId) &&
            normalizeId(fi.grindTypeId) === normalizeId(guestItem.grindTypeId)
        )
        if (existingIdx > -1) {
          mergedItems[existingIdx] = {
            ...mergedItems[existingIdx],
            quantity: mergedItems[existingIdx].quantity + guestItem.quantity,
          }
        } else {
          mergedItems.push({
            id: guestItem.cartItemId,
            productId: guestItem.productId,
            productVariantId: guestItem.variantId,
            productName: guestItem.name,
            slug: guestItem.slug,
            price: guestItem.price,
            quantity: guestItem.quantity,
            imageUrl: guestItem.imageUrl || "",
            sku: guestItem.sku || "",
            attributes: guestItem.attributes ?? [],
            roastLevelId: toNullableGuid(guestItem.roastLevelId),
            roastLevelName: guestItem.roastLevelName ?? null,
            grindTypeId: toNullableGuid(guestItem.grindTypeId),
            grindTypeName: guestItem.grindTypeName ?? null,
          })
        }
      }

      // 3. Update backend with the fully merged array — only clear local state on success
      await basketService.updateBasket({
        id: basketId,
        items: mergedItems,
      })

      // SUCCESS: now safe to clear guest localStorage key and wipe Zustand state
      // (caller will immediately call loadBasket to re-hydrate from backend)
      if (typeof window !== "undefined") {
        localStorage.removeItem("guestBasketId")
      }
      set({ items: [] })

    } catch (error) {
      // Do NOT clear items — guest items remain in Zustand so the user doesn't lose them
      throw error
    }
  },
    }),
    {
      name: "df-cart-storage",
      partialize: (state) => ({
        items: state.items,
      }),
      // On every app boot, scrub any items with empty/zero GUID that survived from
      // previous sessions (before the addItem guard existed).
      onRehydrateStorage: () => (rehydratedState) => {
        if (rehydratedState?.items) {
          const before = rehydratedState.items.length
          rehydratedState.items = rehydratedState.items.filter(
            (item) => item.variantId && item.variantId !== "" && item.variantId !== EMPTY_GUID
          )
          if (rehydratedState.items.length !== before) {
            console.warn(
              `[CartStore] Purged ${before - rehydratedState.items.length} persisted item(s) with invalid variantId from localStorage.`
            )
          }
        }
      },
    }
  )
)
