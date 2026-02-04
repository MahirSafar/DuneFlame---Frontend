"use client"

import { useEffect } from "react"
import { useCartStore } from "@/lib/cart-store"

/**
 * Cart Initialization Component
 * 
 * Manually rehydrates the cart store from localStorage on client mount.
 * This is necessary because the store uses skipHydration: true to prevent
 * Next.js hydration mismatches.
 * 
 * Guest users' cart items will be restored from localStorage on page reload.
 */
export default function CartInit() {
  const { rehydrate } = useCartStore()

  useEffect(() => {
    // Rehydrate cart from localStorage on component mount
    rehydrate()
  }, [rehydrate])

  return null
}
