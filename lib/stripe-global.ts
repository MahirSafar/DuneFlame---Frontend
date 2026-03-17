import type { Stripe } from "@stripe/stripe-js"

let stripeInstancePromise: Promise<Stripe | null> | null = null

/**
 * Return a singleton Stripe instance from the globally injected Stripe.js script.
 * Stripe.js is expected to be loaded once in app/[locale]/layout.tsx.
 */
export function getGlobalStripeInstance(): Promise<Stripe | null> {
  if (stripeInstancePromise) {
    return stripeInstancePromise
  }

  stripeInstancePromise = new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null)
      return
    }

    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!stripeKey) {
      resolve(null)
      return
    }

    const initStripe = () => {
      const stripeFactory = (window as Window & {
        Stripe?: (publishableKey: string) => Stripe | null
      }).Stripe
      if (typeof stripeFactory === "function") {
        return stripeFactory(stripeKey)
      }
      return null
    }

    const existingStripe = initStripe()
    if (existingStripe) {
      resolve(existingStripe)
      return
    }

    let attempts = 0
    const maxAttempts = 100
    const timer = window.setInterval(() => {
      attempts += 1
      const stripe = initStripe()
      if (stripe) {
        window.clearInterval(timer)
        resolve(stripe)
        return
      }

      if (attempts >= maxAttempts) {
        window.clearInterval(timer)
        resolve(null)
      }
    }, 100)
  })

  return stripeInstancePromise
}
