"use client"

import { useCallback, useMemo, useState } from "react"
import { useStripe } from "@stripe/react-stripe-js"
import { toast } from "@/hooks/use-toast"
import type { PaymentRequestItem, PaymentRequestUpdateDetails } from "@stripe/stripe-js"
import { useLocale, useTranslations } from "next-intl"
import { apiFetch } from "@/lib/axios"
import { useAuthStore } from "@/lib/auth-store"
import { useCartStore } from "@/lib/cart-store"
import { useCurrency } from "@/lib/currency-context"
import { basketService } from "@/lib/services/basket"
import type { ExpressCheckoutPayload, ShippingOption, ExpressCheckoutError } from "@/lib/types/express-checkout"

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
  const { user, userBasketId } = useAuthStore()
  const { items, total } = useCartStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<ExpressCheckoutError | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShippingId, setSelectedShippingId] = useState<string>("")
  const [countries, setCountries] = useState<Country[]>([])
  const [shippingAvailable, setShippingAvailable] = useState<boolean>(true)
  const [lastShippingCountry, setLastShippingCountry] = useState<string>("")

  const getFallbackShippingOptions = useCallback((): ShippingOption[] => {
    return [
      {
        id: "calculating",
        label: t("shipping.calculating") || "Calculating...",
        detail: "",
        amount: 0,
      },
    ]
  }, [t])

  const allowedCountryCodes = useMemo(() => {
    const codes = countries
      .map((country) => country.code)
      .filter((code): code is string => Boolean(code))
    return codes.length > 0 ? codes : ["AE", "AZ"]
  }, [countries])

  // Fetch countries on mount
  const fetchCountries = useCallback(async () => {
    try {
      const data = await apiFetch<Country[]>("/shipping/countries")
      setCountries(data)
    } catch (err) {
      setError({
        type: "network",
        message: t("failedLoadCountries") || "Failed to load countries",
      })
    }
  }, [t])

  // Calculate shipping rates for a country
  const getShippingRatesForCountry = useCallback(
    (countryId: string): ShippingOption[] => {
      const country = countries.find((c) => c.id === countryId)
      if (!country) return []

      // Find shipping rates for current currency
      const rates = country.shippingRates
        .filter(
          (r) => String(r.currency).toUpperCase() === currency.toUpperCase()
        )
        .map((rate, idx) => ({
          id: `${countryId}-${idx}`,
          label: country.name,
          detail: `${t("shipping")}`,
          amount: Math.round((rate.cost || 0) * 100), // Convert to cents for Stripe
        }))

      return rates
    },
    [countries, currency, t]
  )

  // Validate cart is not empty
  const canCheckout = useMemo(() => {
    return items && items.length > 0
  }, [items])

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

  const ensureCurrentBasketId = useCallback((basketId: string) => {
    const activeId = getActiveBasketId()
    if (activeId && activeId !== basketId) {
      return activeId
    }
    return basketId
  }, [getActiveBasketId])

  // Sync cart to backend before payment
  const syncCartToBackend = useCallback(
    async (basketId: string) => {
      try {
        if (!items || items.length === 0) {
          throw new Error(t("emptyBasket") || "Your cart is empty")
        }

        const basketItems = items.map((item) => ({
          productId: item.id,
          productPriceId: item.productPriceId,
          productName: item.name,
          slug: item.slug,
          price: item.priceUsed ?? item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl || "",
          weightLabel: item.selectedWeightLabel || item.weightLabel || "Standard",
          grams: item.grams || 0,
          roastLevelId: item.roastLevelId || "00000000-0000-0000-0000-000000000000",
          roastLevelName:
            item.selectedRoast || item.roastLevelName || "Original",
          grindTypeId: item.grindTypeId || "00000000-0000-0000-0000-000000000000",
          grindTypeName: item.selectedGrind || item.grindTypeName || "Whole Bean",
        }))


        const syncedBasket = await basketService.updateBasket({
          id: basketId,
          items: basketItems,
          currencyCode: currency.toUpperCase(),
        })

        const syncedBasketId = syncedBasket?.id || basketId
        if (user?.id) {
          if (syncedBasketId && syncedBasketId !== userBasketId) {
            useAuthStore.setState({ userBasketId: syncedBasketId })
            if (typeof window !== "undefined") {
              localStorage.setItem("df_user_basket_id", syncedBasketId)
            }
          }
        } else if (typeof window !== "undefined") {
          localStorage.setItem("guestBasketId", syncedBasketId)
        }

        return syncedBasketId
      } catch (err) {
        throw err
      }
    },
    [items, currency, t, user, userBasketId]
  )

  const mapShippingAddress = useCallback(
    (shippingAddress: any, email: string, payerName: string, payerPhone: string) => {
      const nameParts = payerName ? payerName.trim().split(" ") : ["", ""]
      const firstName = nameParts[0]?.trim().length ?? 0 >= 2 ? nameParts[0].trim() : undefined
      const lastName = nameParts.slice(1).join(" ").trim().length >= 2 ? nameParts.slice(1).join(" ").trim() : undefined

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
      const rawCity =
        shippingAddress?.city?.trim() ||
        shippingAddress?.locality?.trim() ||
        shippingAddress?.town?.trim() ||
        shippingAddress?.administrativeArea?.trim() ||
        shippingAddress?.region?.trim() ||
        shippingAddress?.state?.trim() ||
        ""

      const rawState =
        shippingAddress?.state?.trim() ||
        shippingAddress?.region?.trim() ||
        shippingAddress?.administrativeArea?.trim() ||
        ""

      const country =
        shippingAddress?.country?.trim() ||
        shippingAddress?.countryCode?.trim() ||
        "AE"

      const recipientFallback =
        shippingAddress?.recipient?.trim() ||
        payerName?.trim() ||
        ""

      const line1 = line1Raw.length >= 5 ? line1Raw : ""
      const line1Fallback = rawCity || recipientFallback

      const streetFromLines = [line1 || line1Fallback, line2].filter(Boolean).join(", ")
      const streetFallback = [rawCity, rawState].filter(Boolean).join(", ")
      const street = streetFromLines || streetFallback || "Not provided"

      const city = rawCity || "Unknown"
      const state = rawState || (country.toUpperCase() === "AZ" ? "AZ" : "AE")

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

  const buildDisplayItems = useCallback(
    (
      baseItems: PaymentRequestItem[] | undefined,
      subtotalAmount: number,
      shippingAmount: number,
      totalAmount: number
    ): PaymentRequestItem[] => {
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
    },
    [t]
  )

  const calculateShipping = useCallback(
    async (params: {
      countryCode: string
      city?: string
      currencyCode: string
      subtotalAmount: number
    }) => {
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

  // Create order with Express Checkout data
  const createOrder = useCallback(
    async (
      basketId: string,
      shippingAddress: any,
      shippingAmount: number,
      email: string,
      payerName: string,
      payerPhone: string
    ) => {
      try {

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


        const createOrderResponse = await apiFetch<{ id: string; clientSecret?: string }>(
          "/orders",
          {
            method: "POST",
            body: JSON.stringify(orderPayload),
          }
        )

        if (!createOrderResponse.id) {
          throw new Error("Failed to create order - no order ID returned")
        }

        return createOrderResponse
      } catch (err) {
        throw err
      }
    },
    [currency, locale, mapShippingAddress]
  )

  // Handle shipping address change
  const handleShippingAddressChange = useCallback(
    async (params: {
      address: any
      subtotalAmount: number
      baseItems?: PaymentRequestItem[]
      currencyCode?: string
    }): Promise<PaymentRequestUpdateDetails> => {
      try {
        const { address, subtotalAmount, baseItems, currencyCode } = params

        const fallbackOptions = getFallbackShippingOptions()
        const totalLabel = t("expressCheckout.totalLabel") || "Total"

        // If countries haven't loaded yet, return a pending state rather than
        // rejecting the address. The button should be hidden in this state
        // (guarded by allowedCountryCodes.length === 0), but handle it
        // defensively in case the sheet was already open.
        if (countries.length === 0) {
          return {
            status: "success",
            shippingOptions: fallbackOptions,
            displayItems: buildDisplayItems(baseItems, subtotalAmount, 0, subtotalAmount),
            total: { label: totalLabel, amount: subtotalAmount, pending: true },
          }
        }

        // Find matching country
        const matchedCountry = countries.find(
          (c) => c.code?.toUpperCase() === address.country?.toUpperCase()
        )

        if (!matchedCountry) {
          setError({
            type: "shipping",
            message: t("countryNotSupported") || "This country is not supported",
          })
          setShippingOptions([])
          setSelectedShippingId("")
          setShippingAvailable(false)
          setLastShippingCountry(address.country || "")
          return {
            status: "invalid_shipping_address",
            shippingOptions: [],
            displayItems: buildDisplayItems(baseItems, subtotalAmount, 0, subtotalAmount),
            total: { label: totalLabel, amount: subtotalAmount, pending: false },
          }
        }

        const city =
          address?.city?.trim() ||
          address?.locality?.trim() ||
          address?.town?.trim() ||
          address?.administrativeArea?.trim() ||
          ""

        const shippingResponse = await calculateShipping({
          countryCode: address.country,
          city,
          currencyCode: currencyCode || currency.toUpperCase(),
          subtotalAmount,
        })

        const statusValue = shippingResponse?.status?.toLowerCase()
        const statusOk =
          !statusValue ||
          statusValue === "available" ||
          statusValue === "success" ||
          statusValue === "ok"

        // Get price (handle both shippingPrice and shippingCost naming)
        const price = shippingResponse?.shippingPrice ?? (shippingResponse as any)?.shippingCost
        const hasValidPrice = typeof price === "number"
        const isExplicitlyUnavailable = shippingResponse?.available === false

        // Fail ONLY if it's explicitly marked unavailable, OR if we didn't get a valid price and the status is bad
        if (isExplicitlyUnavailable || (!hasValidPrice && !statusOk)) {
          setError({
            type: "shipping",
            message:
              shippingResponse?.message ||
              t("shipping.not_available") ||
              "Shipping not available for this location",
          })
          setShippingOptions([])
          setSelectedShippingId("")
          setShippingAvailable(false)
          setLastShippingCountry(address.country || "")
          return {
            status: "invalid_shipping_address",
            shippingOptions: [],
            displayItems: buildDisplayItems(baseItems, subtotalAmount, 0, subtotalAmount),
            total: { label: totalLabel, amount: subtotalAmount, pending: false },
          }
        }

        const shippingAmount = Math.round((price || 0) * 100)
        const computedTotal = subtotalAmount + shippingAmount

        const estimatedDays =
          shippingResponse.estimatedDays ||
          shippingResponse.estimatedDeliveryDays ||
          shippingResponse.deliveryDays ||
          ""

        const options = [
          {
            id: `${matchedCountry.id}-calculated`,
            label: t("shipping.standard") || "Shipping",
            detail: estimatedDays ? `${estimatedDays}` : "",
            amount: shippingAmount,
          },
        ]

        setShippingOptions(options)
        setSelectedShippingId(options[0].id)
        setError(null)
        setShippingAvailable(true)
        setLastShippingCountry(address.country || "")

        return {
          status: "success",
          shippingOptions: options,
          displayItems: buildDisplayItems(baseItems, subtotalAmount, shippingAmount, computedTotal),
          total: { label: totalLabel, amount: computedTotal, pending: false },
        }
      } catch (err) {
        setError({
          type: "shipping",
          message:
            t("shippingCalculationFailed") ||
            "Failed to calculate shipping",
        })
        setShippingAvailable(false)
        setLastShippingCountry(params.address?.country || "")
        const fallbackOptions = getFallbackShippingOptions()
        const totalLabel = t("expressCheckout.totalLabel") || "Total"
        return {
          status: "invalid_shipping_address",
          shippingOptions: [],
          displayItems: buildDisplayItems(params.baseItems, params.subtotalAmount, 0, params.subtotalAmount),
          total: { label: totalLabel, amount: params.subtotalAmount, pending: false },
        }
      }
    },
    [
      countries,
      getFallbackShippingOptions,
      buildDisplayItems,
      currency,
      t,
      calculateShipping,
    ]
  )

  // Complete Express Checkout payment
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
        // 1. Resolve active basket ID (matches cart store)
        const basketId = getActiveBasketId()

        // 2. Sync cart to backend and use the latest basketId from backend
        const syncedBasketId = await syncCartToBackend(basketId)

        // 3. Validate basketId before creating order
        const validatedBasketId = ensureCurrentBasketId(syncedBasketId)

        // 4. Extract shipping details
        const { address, name, email, phone } = shippingDetails

        // The digital wallet enforces shipping availability based on our response to
        // `shippingaddresschange`. Read the shipping cost directly from the option
        // the user selected in the native sheet.
        const selectedShippingOption = paymentEvent?.shippingOption
        const shippingAmountInCents = selectedShippingOption?.amount || 0
        const shippingCost = shippingAmountInCents / 100

        // 5. If order total is zero (rewards cover everything) or no payment needed
        const orderTotal = total(currency)
        const totalWithShipping = orderTotal + shippingCost

        if (totalWithShipping <= 0) {

          const orderResponse = await createOrder(
            validatedBasketId,
            address,
            shippingAmountInCents,
            email,
            name,
            phone
          )

          paymentEvent.complete("success")

          // Clear cart
          useCartStore.getState().clearCart()

          return { orderId: orderResponse.id, success: true }
        }

        // 6. Confirm payment if needed (before creating order)
        const paymentIntentResponse = await apiFetch<{ clientSecret?: string }>(
          `/payments/${validatedBasketId}`,
          { method: "POST" }
        )

        if (!paymentIntentResponse?.clientSecret) {
          throw new Error("Missing client secret from payment intent")
        }

        const paymentMethodId =
          paymentEvent?.paymentMethod?.id ?? paymentEvent?.paymentMethod

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
            description: confirmResult.error.message || t("paymentFailed") || "Payment failed",
          })

          if ((confirmResult.error as any)?.status === 402) {
            throw confirmResult.error
          }

          throw confirmResult.error
        }

        const intentStatus = confirmResult.paymentIntent?.status
        if (intentStatus && intentStatus !== "succeeded" && intentStatus !== "processing") {
          paymentEvent.complete("fail")
          throw new Error(`Payment status: ${intentStatus}`)
        }

        // 7. Create order after confirmed payment intent
        const orderResponse = await createOrder(
          validatedBasketId,
          address,
          shippingAmountInCents,
          email,
          name,
          phone
        )

        const orderId = orderResponse.id

        // 8. Complete payment
        paymentEvent.complete("success")

        // 9. Clear cart
        useCartStore.getState().clearCart()

        return { orderId, success: true }
      } catch (err) {
        paymentEvent.complete("fail")

        const errorMessage =
          err instanceof Error
            ? err.message
            : t("paymentFailed") || "Payment failed"

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
            message: "Your basket is empty. Please add items before checking out.",
          })

          const { loadBasket } = useCartStore.getState()
          loadBasket().catch((loadError) =>
            console.error("[Express Checkout] Failed to refresh basket:", loadError)
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
    [
      stripe,
      getActiveBasketId,
      syncCartToBackend,
      ensureCurrentBasketId,
      createOrder,
      total,
      currency,
    ]
  )

  return {
    // State
    isProcessing,
    error,
    shippingOptions,
    selectedShippingId,
    canCheckout,
    countries,
    allowedCountryCodes,

    // Methods
    fetchCountries,
    handleShippingAddressChange,
    completePayment,
    getShippingRatesForCountry,
    setSelectedShippingId,
    setError,
  }
}
