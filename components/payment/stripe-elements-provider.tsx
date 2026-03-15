"use client"

import { useMemo } from "react"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import type React from "react"

interface StripeProviderProps {
  children: React.ReactNode
}

export function StripeElementsProvider({ children }: StripeProviderProps) {
  const stripePromise = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.warn("[Stripe] Publishable key not configured")
      return null
    }
    return loadStripe(key)
  }, [])

  if (!stripePromise) {
    return <>{children}</>
  }

  return (
    <Elements stripe={stripePromise} options={{ locale: "auto" }}>
      {children}
    </Elements>
  )
}
