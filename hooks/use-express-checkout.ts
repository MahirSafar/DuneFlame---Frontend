"use client"

import { useCallback, useState } from "react"
import { useStripe } from "@stripe/react-stripe-js"
import { toast } from "@/hooks/use-toast"
import { useLocale, useTranslations } from "next-intl"
import { apiFetch } from "@/lib/axios"
import { useAuthStore } from "@/lib/auth-store"
import { useCartStore } from "@/lib/cart-store"
import { useCurrency } from "@/lib/currency-context"
import { basketService } from "@/lib/services/basket"
import type { ExpressCheckoutError, ExpressCheckoutShippingAddress } from "@/lib/types/express-checkout"

interface Country {
  id: string
  name: string
  code: string
  cityCount: number
  shippingRates: ShippingRate[]
}

interface ShippingRate {
  currency: string | number
  cost: number
}

export function useExpressCheckout() {
  const t = useTranslations()
  const locale = useLocale()
  const stripe = useStripe()
  const { currency } = useCurrency()
  // CRITICAL: Use primitive selectors to prevent render loops from object reference changes
  const userBasketId = useAuthStore((state) => state.userBasketId)
  const userId = useAuthStore((state) => state.user?.id)
  const itemsLength = useCartStore((state) => state.items.length)

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<ExpressCheckoutError | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [allowedCountryCodes, setAllowedCountryCodes] = useState<string[]>([])

  /**
   * PURE API: Fetch all available countries and their shipping rates
   */
  const fetchCountries = useCallback(async (): Promise<Country[]> => {
    try {
      const data = await apiFetch<Country[]>("/shipping/countries")
      setCountries(data)
      const codes = data.map(c => c.code).filter(Boolean) as string[]
      setAllowedCountryCodes(codes.length > 0 ? codes : ["AE", "AZ"])
      return data
    } catch (err) {
      const errorMsg = t("failedLoadCountries") || "Failed to load countries"
      setError({
        type: "network",
        message: errorMsg,
      })
      throw err
    }
  }, [t])

  /**
   * PURE API: Calculate shipping cost for a given location
   * Returns the shipping price in cents
   */
  const calculateShipping = useCallback(
    async (params: {
      countryCode: string
      city?: string
      currencyCode: string
      subtotalAmount: number
    }): Promise<{
      shippingPrice?: number
      currency?: string
      available?: boolean
      status?: string
      message?: string
      estimatedDays?: string
      estimatedDeliveryDays?: string
      deliveryDays?: string
    }> => {
      const { countryCode, city, currencyCode, subtotalAmount } = params
      const subtotalInUnits = subtotalAmount / 100

      return apiFetch<{
        shippingPrice?: number
        currency?: string
        available?: boolean
        status?: string
        message?: string
        estimatedDays?: string
        estimatedDeliveryDays?: string
        deliveryDays?: string
      }>("/shipping/calculate", {
        method: "POST",
        body: JSON.stringify({
          countryCode,
          city,
          currency: currencyCode,
          subtotal: subtotalInUnits,
        }),
      })
    },
    []
  )

  /**
   * PURE LOGIC: Map shipping address data from Express Checkout to backend format
   */
  const mapShippingAddress = useCallback(
    (
      shippingAddress: any,
      email: string,
      payerName: string,
      payerPhone: string
    ): ExpressCheckoutShippingAddress => {
      // Parse payer name into first and last
      const nameParts = payerName ? payerName.trim().split(" ") : ["", ""]
      const firstName =
        nameParts[0]?.trim().length >= 2 ? nameParts[0].trim() : undefined
      const lastName =
        nameParts.slice(1).join(" ").trim().length >= 2
          ? nameParts.slice(1).join(" ").trim()
          : undefined

      // Extract street address (try multiple field naming conventions)
      const line1Raw =
        shippingAddress?.line1?.trim() ||
        shippingAddress?.addressLine1?.trim() ||
        shippingAddress?.address1?.trim() ||
        shippingAddress?.street?.trim() ||
        ""

      const line2 =
        shippingAddress?.line2?.trim() ||
        shippingAddress?.addressLine2?.trim() ||
        shippingAddress?.address2?.trim() ||
        ""

      // Extract city (try multiple field naming conventions)
      const rawCity =
        shippingAddress?.city?.trim() ||
        shippingAddress?.locality?.trim() ||
        shippingAddress?.town?.trim() ||
        shippingAddress?.administrativeArea?.trim() ||
        shippingAddress?.region?.trim() ||
        shippingAddress?.state?.trim() ||
        ""

      // Extract state/region
      const rawState =
        shippingAddress?.state?.trim() ||
        shippingAddress?.region?.trim() ||
        shippingAddress?.administrativeArea?.trim() ||
        ""

      // Extract country code
      const country =
        shippingAddress?.country?.trim() ||
        shippingAddress?.countryCode?.trim() ||
        "AE"

      // Fallback for recipient name
      const recipientFallback =
        shippingAddress?.recipient?.trim() || payerName?.trim() || ""

      // Build street address
      const line1 = line1Raw.length >= 5 ? line1Raw : ""
      const line1Fallback = rawCity || recipientFallback
      const streetFromLines = [line1 || line1Fallback, line2]
        .filter(Boolean)
        .join(", ")
      const streetFallback = [rawCity, rawState].filter(Boolean).join(", ")
      const street = streetFromLines || streetFallback || "Not provided"

      // Build city and state with defaults
      const city = rawCity || "Unknown"
      const state =
        rawState || (country.toUpperCase() === "AZ" ? "AZ" : "AE")

      // Extract postal code
      const postalCode =
        shippingAddress?.postalCode?.trim() ||
        shippingAddress?.postal_code?.trim() ||
        shippingAddress?.zip?.trim() ||
        shippingAddress?.zipCode?.trim() ||
        "000000"

      return {
        street,
        city,
        state,
        postalCode,
        country,
        firstName,
        lastName,
        email: email?.trim() || undefined,
        phoneNumber: payerPhone?.trim() || undefined,
      }
    },
    []
  )

  /**
   * PURE API: Create an Express Checkout order
   */
  const handleShippingAddressChange = useCallback(
    async (params: {
      address: any
      subtotalAmount: number
      baseItems: any[]
      currencyCode: string
    }) => {
      const { address, subtotalAmount, baseItems, currencyCode } = params
      const matchedCountry = countries.find(
        (c) => c.code?.toUpperCase() === (address?.country || "").toUpperCase()
      )

      if (!matchedCountry) {
        return {
          status: "invalid_shipping_address",
          shippingOptions: [],
          displayItems: [
            ...baseItems,
            { label: t("checkout.subtotal") || "Subtotal", amount: subtotalAmount },
            { label: t("expressCheckout.totalLabel") || "Total", amount: subtotalAmount },
          ],
          total: {
            label: t("expressCheckout.totalLabel") || "Total",
            amount: subtotalAmount,
            pending: false,
          },
        }
      }

      const city =
        address?.city?.trim() ||
        address?.locality?.trim() ||
        address?.town?.trim() ||
        address?.administrativeArea?.trim() ||
        ""

      const countryCode = address?.country || "AE"
      const shippingResponse = await calculateShipping({
        countryCode,
        city,
        currencyCode,
        subtotalAmount,
      })

      const statusValue = shippingResponse?.status?.toLowerCase()
      const statusOk =
        !statusValue ||
        statusValue === "available" ||
        statusValue === "success" ||
        statusValue === "ok"

      const price = shippingResponse?.shippingPrice ?? (shippingResponse as any)?.shippingCost
      const hasValidPrice = typeof price === "number"
      const isExplicitlyUnavailable = shippingResponse?.available === false

      if (isExplicitlyUnavailable || (!hasValidPrice && !statusOk)) {
        return {
          status: "invalid_shipping_address",
          shippingOptions: [],
          displayItems: [
            ...baseItems,
            { label: t("checkout.subtotal") || "Subtotal", amount: subtotalAmount },
            { label: t("expressCheckout.totalLabel") || "Total", amount: subtotalAmount },
          ],
          total: {
            label: t("expressCheckout.totalLabel") || "Total",
            amount: subtotalAmount,
            pending: false,
          },
        }
      }

      const auth = useAuthStore.getState()
      const isFirstOrder = !!auth.accessToken && auth.user?.hasOrders === false
      const subtotalDiscount = isFirstOrder ? Math.round(subtotalAmount * 0.1) : 0

      const estimatedDays =
        shippingResponse.estimatedDays ||
        shippingResponse.estimatedDeliveryDays ||
        shippingResponse.deliveryDays ||
        ""

      const shippingAmount = Math.round((price || 0) * 100)
      const computedTotal = subtotalAmount - subtotalDiscount + shippingAmount

      const options = [
        {
          id: `${matchedCountry.id}-calculated`,
          label: t("shipping.standard") || "Shipping",
          detail: estimatedDays ? `${estimatedDays}` : "",
          amount: shippingAmount,
        },
      ]

      const displayItemsFinal = [
        ...baseItems,
        { label: t("checkout.subtotal") || "Subtotal", amount: subtotalAmount },
      ]

      if (subtotalDiscount > 0) {
        displayItemsFinal.push({
           label: t("checkout.welcomeDiscount") || "Welcome Discount (10%)",
           // Apple Pay & Google Pay display items usually don't support negative.
           // However, if it must be a positive line item representing a subtraction
           // or if it throws, use Positive, it's just a display item. 
           // Standard Google Pay expects positive values for all items.
           // Wait, actually, Stripe PaymentRequestItem amount CAN be negative in SOME browsers but it's risky. 
           // We'll supply the computedTotal as the final `total` amount. The items just explain it visually.
           // If we just skip adding it to `displayItems`, the total will just be less. Let's just adjust the total directly.
           amount: subtotalDiscount, 
        })
      }

      displayItemsFinal.push({ label: t("checkout.shipping") || "Shipping", amount: shippingAmount })
      
      return {
        status: "success",
        shippingOptions: options,
        displayItems: displayItemsFinal,
        total: {
          label: t("expressCheckout.totalLabel") || "Total",
          amount: computedTotal,
          pending: false,
        }
      }
    },
    [countries, calculateShipping, t]
  )

  const createOrder = useCallback(
    async (
      basketId: string,
      shippingAddress: any,
      shippingAmount: number,
      email: string,
      payerName: string,
      payerPhone: string
    ): Promise<{ id: string; clientSecret?: string }> => {
      const mappedShippingAddress = mapShippingAddress(
        shippingAddress,
        email,
        payerName,
        payerPhone
      )

      const orderPayload = {
        basketId,
        shippingAddress: mappedShippingAddress,
        currency: currency.toUpperCase(),
        usePoints: false,
        languageCode: locale,
      }

      const createOrderResponse = await apiFetch<{
        id: string
        clientSecret?: string
      }>("/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      })

      if (!createOrderResponse.id) {
        throw new Error("Failed to create order - no order ID returned")
      }

      return createOrderResponse
    },
    [currency, locale, mapShippingAddress]
  )

  /**
   * HELPER: Get active basket ID (authenticated or guest)
   */
  const getActiveBasketId = useCallback(() => {
    const authState = useAuthStore.getState()
    const authenticatedId = authState.userBasketId || authState.user?.id

    if (authenticatedId) {
      return authenticatedId
    }

    if (typeof window !== "undefined") {
      const storedGuestId = localStorage.getItem("guestBasketId")
      if (storedGuestId) {
        return storedGuestId
      }
    }

    const newGuestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    if (typeof window !== "undefined") {
      localStorage.setItem("guestBasketId", newGuestId)
    }
    return newGuestId
  }, [])



  /**
   * Complete Express Checkout payment (handles all Stripe/payment logic)
   * CRITICAL: Calculates current total dynamically using useCartStore.getState() instead of closure
   */
  const completePayment = useCallback(
    async (
      paymentEvent: any,
      shippingDetails: any
    ): Promise<{ orderId: string; success: boolean }> => {
      if (!stripe) {
        throw new Error("Stripe not initialized")
      }

      setIsProcessing(true)
      setError(null)

      try {
        // 1. Get active basket ID
        const basketId = getActiveBasketId()

        // 2. Extract shipping details from payment event
        const { address, name, email, phone } = shippingDetails
        const selectedShippingOption = paymentEvent?.shippingOption
        const shippingAmountInCents = selectedShippingOption?.amount || 0
        const shippingCost = shippingAmountInCents / 100

        // 2. CRITICAL: Calculate total dynamically from store (never use closure)
        const cartState = useCartStore.getState()
        const { items: currentItems, getItemPrice } = cartState
        const orderTotal = currentItems.reduce(
          (sum, item) => sum + getItemPrice(item, currency) * item.quantity,
          0
        )
        const auth = useAuthStore.getState()
        const isFirstOrder = !!auth.accessToken && auth.user?.hasOrders === false
        const discountAmount = isFirstOrder ? orderTotal * 0.1 : 0

        const totalWithShipping = (orderTotal - discountAmount) + shippingCost

        // 3. Handle zero-cost orders (rewards covering full amount)
        if (totalWithShipping <= 0) {
          const orderResponse = await createOrder(
            basketId,
            address,
            shippingAmountInCents,
            email,
            name,
            phone
          )

          paymentEvent.complete("success")
          useCartStore.getState().clearCart()

          return { orderId: orderResponse.id, success: true }
        }

        // 4. Get payment intent
        const paymentIntentResponse = await apiFetch<{ clientSecret?: string }>(
          `/payments/${basketId}`,
          { method: "POST" }
        )

        if (!paymentIntentResponse?.clientSecret) {
          throw new Error("Missing client secret from payment intent")
        }

        const paymentMethodId =
          paymentEvent?.paymentMethod?.id ?? paymentEvent?.paymentMethod

        // 7. Confirm payment with Stripe
        const confirmResult = await stripe.confirmPayment({
          clientSecret: paymentIntentResponse.clientSecret,
          confirmParams: {
            payment_method: paymentMethodId,
          },
          redirect: "if_required",
        })

        if (confirmResult.error) {
          paymentEvent.complete("fail")

          toast({
            title: t("paymentFailed") || "Payment failed",
            description:
              confirmResult.error.message ||
              t("paymentFailed") ||
              "Payment failed",
          })

          throw confirmResult.error
        }

        const intentStatus = confirmResult.paymentIntent?.status
        if (
          intentStatus &&
          intentStatus !== "succeeded" &&
          intentStatus !== "processing"
        ) {
          paymentEvent.complete("fail")
          throw new Error(`Payment status: ${intentStatus}`)
        }

        // 5. Create order after confirmed payment
        const orderResponse = await createOrder(
          basketId,
          address,
          shippingAmountInCents,
          email,
          name,
          phone
        )

        // 6. Complete payment and clear cart
        paymentEvent.complete("success")
        useCartStore.getState().clearCart()

        return { orderId: orderResponse.id, success: true }
      } catch (err) {
        paymentEvent.complete("fail")

        const errorMessage =
          err instanceof Error ? err.message : t("paymentFailed") || "Payment failed"

        const validationDetails = (err as any)?.data?.errors
        if ((err as any)?.status === 400 && validationDetails) {
          const firstKey = Object.keys(validationDetails)[0]
          const firstValue = validationDetails?.[firstKey]
          const detailMessage = Array.isArray(firstValue)
            ? firstValue[0]
            : typeof firstValue === "string"
              ? firstValue
              : (err as any)?.data?.message

          toast({
            title: t("paymentFailed") || "Payment failed",
            description: detailMessage || errorMessage,
          })
        }

        if (
          (err as any)?.status === 400 &&
          /basket is empty/i.test(
            (err as any)?.data?.message || (err as any)?.message || ""
          )
        ) {
          setError({
            type: "payment",
            message:
              "Your basket is empty. Please add items before checking out.",
          })

          const { loadBasket } = useCartStore.getState()
          loadBasket().catch((loadError) =>
            console.error(
              "[Express Checkout] Failed to refresh basket:",
              loadError
            )
          )

          throw err
        }

        setError({
          type: "payment",
          message: errorMessage,
        })

        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [stripe, currency, createOrder, t]
  )

  return {
    // State
    isProcessing,
    error,
    countries,
    allowedCountryCodes,

    // Pure API functions
    fetchCountries,
    calculateShipping,
    createOrder,

    // Helper functions
    mapShippingAddress,
    getActiveBasketId,
    handleShippingAddressChange,

    // Payment handling
    completePayment,
  }
}
