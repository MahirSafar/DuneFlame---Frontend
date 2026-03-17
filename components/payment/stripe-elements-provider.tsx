"use client"

import { useMemo } from "react"
import { Elements } from "@stripe/react-stripe-js"
import type React from "react"
import { getGlobalStripeInstance } from "@/lib/stripe-global"

interface StripeProviderProps {
  children: React.ReactNode
}

export function StripeElementsProvider({ children }: StripeProviderProps) {
  const stripePromise = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      return null
    }
    return getGlobalStripeInstance()
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
