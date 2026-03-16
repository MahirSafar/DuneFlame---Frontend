"use client"

import { useEffect, useRef, useCallback } from "react"
import { useStripe } from "@stripe/react-stripe-js"
import type Stripe from "@stripe/stripe-js"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/routing"
import { useExpressCheckout } from "@/hooks/use-express-checkout"
import { useCurrency } from "@/lib/currency-context"
import { useCartStore } from "@/lib/cart-store"
import { getItemPrice } from "@/lib/cart-store"
import { Loader2 } from "lucide-react"

interface ExpressCheckoutButtonProps {
  onSuccess: (orderId: string) => void
  onError?: (error: Error) => void
  variant?: "compact" | "full"
  className?: string
}

export function ExpressCheckoutButton({
  onSuccess,
  onError,
  variant = "full",
  className = "",
}: ExpressCheckoutButtonProps) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const stripe = useStripe()
  const { currency } = useCurrency()
  const { items, total } = useCartStore()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const paymentRequestRef = useRef<Stripe.PaymentRequest | null>(null)
  const elementRef = useRef<any>(null)

  const {
    isProcessing,
    error,
    fetchCountries,
    handleShippingAddressChange,
    completePayment,
    canCheckout,
    countries,
    allowedCountryCodes,
  } = useExpressCheckout()

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries()
  }, [fetchCountries])

  // Initialize PaymentRequest and Element
  useEffect(() => {
    if (!stripe || !containerRef.current || !canCheckout || items.length === 0) {
      if (containerRef.current && !canCheckout) {
        containerRef.current.style.display = "none"
      }
      return
    }

    // Do not create the PaymentRequest until the allowed countries list has
    // loaded from the API. Creating it with the empty fallback would either
    // show no restricted countries or use the stale ["AE", "AZ"] default.
    if (allowedCountryCodes.length === 0) return

    const initPaymentRequest = async () => {
      try {
        // Get the display amount
        const displayAmount = Math.round(total(currency) * 100) // in cents

        const subtotalLabel = t("checkout.subtotal") || "Subtotal"
        const shippingLabel = t("checkout.shipping") || "Shipping"
        const totalLabel = t("expressCheckout.totalLabel") || "Total"

        const itemLines =
          items.length > 0
            ? items.map((item) => ({
                label: item.name,
                amount: Math.round(
                  getItemPrice(item, currency) * item.quantity * 100
                ),
              }))
            : []

        const displayItems = [
          ...itemLines,
          { label: subtotalLabel, amount: displayAmount },
          { label: shippingLabel, amount: 0 },
          { label: totalLabel, amount: displayAmount },
        ]


        // Create PaymentRequest
        const pr = stripe.paymentRequest({
          country: "AE", // Default country
          currency: currency.toLowerCase(),
          total: {
            label: t("expressCheckout.totalLabel") || "Total",
            amount: displayAmount,
            pending: false, // Will update based on shipping
          },
          requestShipping: true,
          requestPayerName: true,
          requestPayerEmail: true,
          requestPayerPhone: true,
          displayItems,
          shippingAddressCollection: {
            allowedCountries: allowedCountryCodes,
          },
        } as any)

        paymentRequestRef.current = pr

        // Check if Apple Pay or Google Pay is available
        const result = await pr.canMakePayment()

        if (!result) {
          if (containerRef.current) {
            containerRef.current.style.display = "none"
          }
          return
        }

        // Handle shipping address changes
        pr.on("shippingaddresschange", async (event) => {
          const updateDetails = await handleShippingAddressChange({
            address: event.shippingAddress,
            subtotalAmount: displayAmount,
            baseItems: itemLines,
            currencyCode: currency.toUpperCase(),
          })
          event.updateWith(updateDetails)
        })

        // Handle payment method
        pr.on("paymentmethod", async (event) => {
          try {

            // Get shipping details
            const shippingDetails = {
              address: event.shippingAddress,
              name: event.payerName,
              email: event.payerEmail,
              phone: event.payerPhone,
            }

            // Complete the payment
            const { orderId, success } = await completePayment(
              event,
              shippingDetails
            )

            if (success) {
              // Call onSuccess callback
              onSuccess(orderId)

              // Redirect to confirmation page
              router.push(`/orders/confirmation/${orderId}`)
            }
          } catch (err) {
            event.complete("fail")
            if (onError && err instanceof Error) {
              onError(err)
            }
          }
        })

        // Create the PaymentRequestButtonElement
        const elements = stripe.elements()
        const element = elements.create("paymentRequestButton", {
          paymentRequest: pr,
          style: {
            paymentRequestButton: {
              type: "default",
              theme: "dark",
              height: "40px",
            },
          },
        })

        elementRef.current = element

        // Mount the element
        if (containerRef.current) {
          element.mount(containerRef.current)
        }

        // Handle element click to show loading state
        element.on("click", () => {
        })
      } catch (err) {
        console.error("[Express Checkout] Failed to initialize payment request:", err)
      }
    }

    initPaymentRequest()

    // Cleanup
    return () => {
      if (elementRef.current) {
        elementRef.current.unmount()
        elementRef.current = null
      }
      if (paymentRequestRef.current) {
        paymentRequestRef.current = null
      }
    }
  }, [
    stripe,
    currency,
    canCheckout,
    items,
    total,
    t,
    locale,
    allowedCountryCodes,
    handleShippingAddressChange,
    completePayment,
    onSuccess,
    onError,
  ])

  if (!canCheckout) {
    return null
  }

  return (
    <div className={`express-checkout-container ${className}`}>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
          <p className="font-medium">{error.message}</p>
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">
              {t("expressCheckout.processing") || "Processing payment..."}
            </span>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={variant === "compact" ? "min-h-10" : "min-h-14"}
      />

      <p className="text-xs text-muted-foreground mt-2">
        {t("expressCheckout.securePayment") || "Secure payment powered by Stripe"}
      </p>
    </div>
  )
}
