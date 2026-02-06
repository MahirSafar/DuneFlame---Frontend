"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import CheckoutForm from "@/components/checkout/checkout-form"
import { useCartStore } from "@/lib/cart-store"
import { useAuthStore } from "@/lib/auth-store"

export default function CheckoutPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((state) => state.items)
  const accessToken = useAuthStore((state) => state.accessToken)

  // Wait for component to mount (hydration)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check cart after hydration
  useEffect(() => {
    if (!mounted) return // Wait for hydration

    // Redirect to cart if empty
    if (items.length === 0) {
      router.push("/cart")
      return
    }
  }, [mounted, items.length, router])

  // Show loading state while hydrating
  if (!mounted || items.length === 0) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-2xl font-bold uppercase text-espresso-brown dark:text-espresso-brown">Checkout</h1>
          </div>

          <CheckoutForm />
        </div>
      </div>
      <Footer />
    </main>
  )
}
