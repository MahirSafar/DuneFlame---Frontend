"use client"

import { create } from "zustand"
import { basketService, BasketItem } from "./services/basket"

export interface CartItem {
  id: string
  slug: string
  name: string
  price: number
  quantity: number
  imageUrl: string
}

interface CartStore {
  items: CartItem[]
  isLoading: boolean
  addItem: (item: CartItem, isAuthenticated?: boolean) => void
  removeItem: (id: string, isAuthenticated?: boolean) => void
  updateQuantity: (id: string, quantity: number, isAuthenticated?: boolean) => void
  clearCart: () => void
  loadBasket: () => Promise<void>
  total: () => number
}

const syncWithBackend = async (items: CartItem[]) => {
  try {
    console.table(items)

    if (items.length === 0) {
      await basketService.deleteBasket()
      console.log("Cart synced: Basket deleted (empty)")
    } else {
      const basketItems: BasketItem[] = items.map((item) => ({
        productId: item.id,
        productName: item.name,
        slug: item.slug,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl || "",
      }))
      await basketService.updateBasket(basketItems)
      console.log("Cart synced: Items updated")
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
      const existingItem = state.items.find((i) => i.id === item.id)
      const newItems = existingItem
        ? state.items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i))
        : [...state.items, item]

      // Fire and forget backend sync if authenticated
      if (isAuthenticated) {
        syncWithBackend(newItems)
      }

      return { items: newItems }
    }),
  removeItem: (id, isAuthenticated = false) =>
    set((state) => {
      const newItems = state.items.filter((i) => i.id !== id)

      // Fire and forget backend sync if authenticated
      if (isAuthenticated) {
        syncWithBackend(newItems)
      }

      return { items: newItems }
    }),
  updateQuantity: (id, quantity, isAuthenticated = false) =>
    set((state) => {
      const newItems = state.items.map((i) => (i.id === id ? { ...i, quantity } : i))

      // Fire and forget backend sync if authenticated
      if (isAuthenticated) {
        syncWithBackend(newItems)
      }

      return { items: newItems }
    }),
  clearCart: () => set({ items: [] }),
  loadBasket: async () => {
    set({ isLoading: true })
    try {
      const basket = await basketService.getBasket()
      // Convert BasketItem[] to CartItem[] with all product details from backend
      const items = basket.items
        .filter((item) => {
          const hasSlug = Boolean(item.slug)
          if (!hasSlug) {
            console.warn("Skipping basket item without slug", item)
          }
          return hasSlug
        })
        .map((item) => ({
          id: item.productId,
          name: item.productName,
          slug: item.slug!,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl || "",
        }))

      set({
        items,
        isLoading: false,
      })
    } catch (error) {
      // Gracefully handle 404 (no basket exists yet for new user) or other errors
      console.error("Failed to load basket from backend:", error)
      set({ items: [], isLoading: false })
    }
  },
  total: () => {
    const { items } = get()
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },
}))
