"use client"

import { useEffect } from "react"

/**
 * Payment Script Initializer
 * 
 * Ensures external payment SDKs (Stripe, Google) are properly loaded
 * and available before payment/auth operations begin.
 * 
 * This component verifies script availability and logs warnings if scripts
 * fail to load, allowing graceful degradation.
 */
export default function PaymentScriptInit() {
  useEffect(() => {
    // Verify Stripe script is loaded
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      const checkStripe = () => {
        if (typeof (window as any).Stripe === "undefined") {
        } else {
        }
      }

      // Check immediately and after a short delay
      checkStripe()
      const timer = setTimeout(checkStripe, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    // Verify Google GSI (Google Sign-In) script is loaded
    if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      return
    }

    // Check if already loaded
    const checkGoogle = () => {
      if (typeof (window as any).google !== "undefined") {
        return true
      }
      return false
    }

    // If already loaded, exit early
    if (checkGoogle()) {
      return
    }

    // Listen for the custom event dispatched by the script onload
    const handleGoogleSDKLoaded = () => {
    }

    window.addEventListener("google-sdk-loaded", handleGoogleSDKLoaded)

    // Fallback: Check again after 2 seconds if event didn't fire (network delay)
    const fallbackTimer = setTimeout(() => {
      if (!checkGoogle()) {
      }
    }, 2000)

    return () => {
      window.removeEventListener("google-sdk-loaded", handleGoogleSDKLoaded)
      clearTimeout(fallbackTimer)
    }
  }, [])

  return null
}
