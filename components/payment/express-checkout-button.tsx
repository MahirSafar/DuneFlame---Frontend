"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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

interface Country {
  id: string
  name: string
  code: string
  cityCount: number
  shippingRates: any[]
}

interface ShippingOption {
  id: string
  label: string
  detail: string
  amount: number
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
  const itemsLength = useCartStore((state) => state.items.length)

  // Component-level state for countries and shipping
  const [countries, setCountries] = useState<Country[]>([])
  const [allowedCountryCodes, setAllowedCountryCodes] = useState<string[]>([])
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShippingId, setSelectedShippingId] = useState<string>("")
  const [shippingAvailable, setShippingAvailable] = useState(true)
  const [componentError, setComponentError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const paymentRequestRef = useRef<Stripe.PaymentRequest | null>(null)
  const elementRef = useRef<any>(null)
  const isInitializedRef = useRef(false)

  const {
    isProcessing,
    error: hookError,
    fetchCountries: hookFetchCountries,
    calculateShipping,
    completePayment,
  } = useExpressCheckout()

  // Fetch countries on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    ;(async () => {
      try {
        const loadedCountries = await hookFetchCountries()
        setCountries(loadedCountries)
        const codes = loadedCountries
          .map((c) => c.code)
          .filter((code): code is string => Boolean(code))
        setAllowedCountryCodes(codes.length > 0 ? codes : ["AE", "AZ"])
      } catch (err) {
        console.error("[Express Checkout] Failed to load countries:", err)
        setComponentError(
          t("failedLoadCountries") || "Failed to load countries"
        )
      }
    })()
  }, [])

  /**
   * Build display items for Stripe payment request
   */
  const buildDisplayItems = (
    baseItems: Stripe.PaymentRequestItem[] | undefined,
    subtotalAmount: number,
    shippingAmount: number,
    totalAmount: number
  ): Stripe.PaymentRequestItem[] => {
    const subtotalLabel = t("checkout.subtotal") || "Subtotal"
    const shippingLabel = t("checkout.shipping") || "Shipping"
    const totalLabel = t("expressCheckout.totalLabel") || "Total"
    const itemLines = baseItems && baseItems.length > 0 ? baseItems : []

    return [
      ...itemLines,
      { label: subtotalLabel, amount: subtotalAmount },
      { label: shippingLabel, amount: shippingAmount },
      { label: totalLabel, amount: totalAmount },
    ]
  }

  /**
   * Initialize PaymentRequest and Element
   * Uses strict initialization guard to prevent infinite loop
   */
  useEffect(() => {
    // Basic readiness checks
    if (!stripe || !containerRef.current || itemsLength === 0) {
      if (containerRef.current) {
        containerRef.current.style.display = "none"
      }
      return
    }

    // Wait for countries to load
    if (allowedCountryCodes.length === 0) return

    // CRITICAL GUARD: Initialize payment request exactly ONCE
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    const initPaymentRequest = async () => {
      try {
        // Calculate subtotal from cart (CRITICAL: never use total() function from store)
        const cartState = useCartStore.getState()
        const { items: currentItems, getItemPrice } = cartState
        const subtotalInDollars = currentItems.reduce(
          (sum, item) => sum + getItemPrice(item, currency) * item.quantity,
          0
        )
        const subtotalAmount = Math.round(subtotalInDollars * 100) // Convert to cents

        // Build initial display items
        const itemLines: Stripe.PaymentRequestItem[] =
          currentItems.length > 0
            ? currentItems.map((item) => ({
                label: item.name,
                amount: Math.round(
                  getItemPrice(item, currency) * item.quantity * 100
                ),
              }))
            : []

        const displayItems = buildDisplayItems(
          itemLines,
          subtotalAmount,
          0, // Initial shipping
          subtotalAmount
        )

        // Create PaymentRequest
        const pr = stripe.paymentRequest({
          country: "AE",
          currency: currency.toLowerCase(),
          total: {
            label: t("expressCheckout.totalLabel") || "Total",
            amount: subtotalAmount,
            pending: false,
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

        /**
         * Handle shipping address change
         * Calculate shipping and update payment request details
         */
        pr.on("shippingaddresschange", async (event) => {
          try {
            const shippingAddress = event.shippingAddress as any

            // Find matching country
            const matchedCountry = countries.find(
              (c) =>
                c.code?.toUpperCase() ===
                (shippingAddress?.country || "").toUpperCase()
            )

            if (!matchedCountry) {
              setComponentError(
                t("countryNotSupported") || "This country is not supported"
              )
              setShippingAvailable(false)
              event.updateWith({
                status: "invalid_shipping_address",
                shippingOptions: [],
                displayItems: buildDisplayItems(
                  itemLines,
                  subtotalAmount,
                  0,
                  subtotalAmount
                ),
                total: {
                  label: t("expressCheckout.totalLabel") || "Total",
                  amount: subtotalAmount,
                  pending: false,
                },
              })
              return
            }

            // Extract city from address (try multiple conventions)
            const city =
              shippingAddress?.city?.trim() ||
              shippingAddress?.locality?.trim() ||
              shippingAddress?.town?.trim() ||
              shippingAddress?.administrativeArea?.trim() ||
              ""

            // Calculate shipping cost
            const countryCode = shippingAddress?.country || "AE"
            const shippingResponse = await calculateShipping({
              countryCode,
              city,
              currencyCode: currency.toUpperCase(),
              subtotalAmount,
            })

            const statusValue = shippingResponse?.status?.toLowerCase()
            const statusOk =
              !statusValue ||
              statusValue === "available" ||
              statusValue === "success" ||
              statusValue === "ok"

            const price =
              shippingResponse?.shippingPrice ??
              (shippingResponse as any)?.shippingCost
            const hasValidPrice = typeof price === "number"
            const isExplicitlyUnavailable = shippingResponse?.available === false

            // Check if shipping is available
            if (isExplicitlyUnavailable || (!hasValidPrice && !statusOk)) {
              setComponentError(
                shippingResponse?.message ||
                  t("shipping.not_available") ||
                  "Shipping not available for this location"
              )
              setShippingAvailable(false)
              event.updateWith({
                status: "invalid_shipping_address",
                shippingOptions: [],
                displayItems: buildDisplayItems(
                  itemLines,
                  subtotalAmount,
                  0,
                  subtotalAmount
                ),
                total: {
                  label: t("expressCheckout.totalLabel") || "Total",
                  amount: subtotalAmount,
                  pending: false,
                },
              })
              return
            }

            // Calculate final totals with shipping
            const shippingAmount = Math.round((price || 0) * 100)
            const computedTotal = subtotalAmount + shippingAmount

            const estimatedDays =
              shippingResponse.estimatedDays ||
              shippingResponse.estimatedDeliveryDays ||
              shippingResponse.deliveryDays ||
              ""

            const options: ShippingOption[] = [
              {
                id: `${matchedCountry.id}-calculated`,
                label: t("shipping.standard") || "Shipping",
                detail: estimatedDays ? `${estimatedDays}` : "",
                amount: shippingAmount,
              },
            ]

            setShippingOptions(options)
            setSelectedShippingId(options[0].id)
            setComponentError(null)
            setShippingAvailable(true)

            // Update payment request with shipping details
            event.updateWith({
              status: "success",
              shippingOptions: options,
              displayItems: buildDisplayItems(
                itemLines,
                subtotalAmount,
                shippingAmount,
                computedTotal
              ),
              total: {
                label: t("expressCheckout.totalLabel") || "Total",
                amount: computedTotal,
                pending: false,
              },
            })
          } catch (err) {
            console.error("[Express Checkout] Shipping calculation failed:", err)
            setComponentError(
              t("shippingCalculationFailed") || "Failed to calculate shipping"
            )
            setShippingAvailable(false)
            event.updateWith({
              status: "invalid_shipping_address",
              shippingOptions: [],
              displayItems: buildDisplayItems(
                itemLines,
                subtotalAmount,
                0,
                subtotalAmount
              ),
              total: {
                label: t("expressCheckout.totalLabel") || "Total",
                amount: subtotalAmount,
                pending: false,
              },
            })
          }
        })

        /**
         * Handle payment method
         * Trigger final payment completion
         */
        pr.on("paymentmethod", async (event) => {
          try {
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
              // Call success callback
              onSuccess(orderId)

              // Redirect to confirmation page
              router.push(`/orders/confirmation/${orderId}`)
            }
          } catch (err) {
            event.complete("fail")
            const errorMsg =
              err instanceof Error ? err.message : "Payment failed"
            setComponentError(errorMsg)
            if (onError && err instanceof Error) {
              onError(err)
            }
          }
        })

        // Create PaymentRequestButtonElement
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

        // Mount element
        if (containerRef.current) {
          element.mount(containerRef.current)
        }
      } catch (err) {
        console.error(
          "[Express Checkout] Failed to initialize payment request:",
          err
        )
        setComponentError(
          "Failed to initialize payment. Please try again."
        )
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
      isInitializedRef.current = false; // CRITICAL FIX: Allow remounting!
    }
    // CRITICAL: Only depend on primitive values and stable callbacks
    // Never include functions that change on every render
    // Never include total() function
  }, [stripe, itemsLength, allowedCountryCodes.length, currency, t, calculateShipping, completePayment, onSuccess, onError, router])



  // Determine if button should be visible
  const canCheckout = itemsLength > 0 && allowedCountryCodes.length > 0

  if (!canCheckout) {
    return null
  }

  const displayError = componentError || hookError?.message

  return (
    <div className={`express-checkout-container ${className}`}>
      {displayError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
          <p className="font-medium">{displayError}</p>
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
        {t("expressCheckout.securePayment") ||
          "Secure payment powered by Stripe"}
      </p>
    </div>
  )
}
