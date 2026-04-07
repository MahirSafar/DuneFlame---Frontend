"use client"

import { useCallback, useState, useRef, useEffect } from "react"
import { useStripe } from "@stripe/react-stripe-js"
import type Stripe from "@stripe/stripe-js"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/routing"
import toast from "react-hot-toast"
import { Loader2 } from "lucide-react"
import { useExpressCheckout } from "@/hooks/use-express-checkout"
import { useCurrency } from "@/lib/currency-context"
import { useAuthStore } from "@/lib/auth-store"
import { basketService } from "@/lib/services/basket"
import { EMPTY_GUID } from "@/lib/cart-store"
import type { ProductResponse } from "@/lib/services/products"

interface ProductQuickBuyProps {
  product: ProductResponse
  selectedWeight: number | undefined
  selectedWeightId: string
  selectedRoast: string
  selectedGrind: string
  quantity?: number
  currentPrice: number
  isPriceAvailable: boolean
  hasValidSelection: boolean
  onSuccess?: (orderId: string) => void
}

/**
 * Product Quick Buy with Express Checkout
 * Allows users to purchase directly from product modal via Apple Pay/Google Pay
 */
export function ProductQuickBuy({
  product,
  selectedWeight,
  selectedWeightId,
  selectedRoast,
  selectedGrind,
  quantity = 1,
  currentPrice,
  isPriceAvailable,
  hasValidSelection,
  onSuccess,
}: ProductQuickBuyProps) {
  const t = useTranslations()
  const locale = useLocale()
  const stripe = useStripe()
  const router = useRouter()
  const { currency } = useCurrency()
  const { user, accessToken } = useAuthStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const paymentRequestRef = useRef<Stripe.PaymentRequest | null>(null)
  const elementRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    fetchCountries,
    countries,
    handleShippingAddressChange,
    completePayment: executePayment,
    allowedCountryCodes,
  } = useExpressCheckout()

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries()
  }, [fetchCountries])

  // Initialize PaymentRequest for quick buy
  useEffect(() => {
    if (
      !stripe ||
      !containerRef.current ||
      !hasValidSelection ||
      !isPriceAvailable ||
      !selectedWeight
    ) {
      if (containerRef.current && (!hasValidSelection || !isPriceAvailable)) {
        containerRef.current.style.display = "none"
      }
      return
    }

    const initPaymentRequest = async () => {
      try {
        // The container may have been hidden in a previous invalid state.
        // Ensure it becomes visible again before mounting the button.
        if (containerRef.current) {
          containerRef.current.style.display = "block"
        }

        // Create a single-item basket for quick buy
        const auth = useAuthStore.getState()
        const isFirstOrder = !!auth.accessToken && auth.user?.hasOrders === false
        
        const rawAmount = currentPrice * quantity
        const discountAmount = isFirstOrder ? rawAmount * 0.1 : 0
        const finalAmount = rawAmount - discountAmount
        
        const displayAmount = Math.round(finalAmount * 100) // in cents
        const rawDisplayAmount = Math.round(rawAmount * 100)

        const subtotalLabel = t("checkout.subtotal") || "Subtotal"
        const shippingLabel = t("checkout.shipping") || "Shipping"
        const totalLabel = t("expressCheckout.totalLabel") || "Total"

        const itemLines = product?.name
          ? [
              {
                label: product.name,
                amount: rawDisplayAmount,
              },
            ]
          : []

        const displayItems = [
          ...itemLines,
          { label: subtotalLabel, amount: rawDisplayAmount }
        ]
        
        if (isFirstOrder) {
          // Stripe expects positive amounts. Submitting a negative amount might cause an error.
          // Apple Pay ignores `displayItems` math, it only trusts `total`. However, to be safe from API crashes,
          // we simply don't add the discount as a separate line item if it causes a crash, or we show it in the label.
          displayItems.push({ label: (t("checkout.welcomeDiscount") || "Welcome Discount") + " (-10%)", amount: 0 })
        }
        
        displayItems.push(
          { label: shippingLabel, amount: 0 },
          { label: totalLabel, amount: displayAmount }
        )


        const pr = stripe.paymentRequest({
          country: "AE",
          currency: currency.toLowerCase(),
          total: {
            label: t("expressCheckout.quickBuy") || "Quick Buy",
            amount: displayAmount,
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

        if (containerRef.current) {
          containerRef.current.style.display = "block"
        }

        // Handle shipping address changes
        pr.on("shippingaddresschange", async (event) => {
          const updateDetails = await handleShippingAddressChange({
            address: event.shippingAddress,
            subtotalAmount: rawDisplayAmount, // Need to make sure this is raw subtotal if hook also applies discount
            baseItems: itemLines,
            currencyCode: currency.toUpperCase(),
          })
          event.updateWith(updateDetails as Stripe.PaymentRequestUpdateDetails)
        })

        // Handle payment method
        pr.on("paymentmethod", async (event) => {
          try {
            setIsProcessing(true)
            setError(null)


            // 1. Create temporary basket for this single product
            const basketId = user?.id || "guest_" + Math.random().toString(36).substring(2, 11)

            // 2. Find Roast and Grind IDs
            const roastIndex = product.roastLevelNames?.indexOf(selectedRoast) ?? -1
            const roastLevelId = roastIndex >= 0 ? product.roastLevelIds?.[roastIndex] : EMPTY_GUID

            const grindIndex = product.grindTypeNames?.indexOf(selectedGrind) ?? -1
            const grindTypeId = grindIndex >= 0 ? product.grindTypeIds?.[grindIndex] : EMPTY_GUID

            // 3. Create product variant item
            const basketItems = [
              {
                productId: product.id,
                productPriceId: selectedWeightId,
                productName: product.name,
                slug: product.slug,
                price: currentPrice,
                quantity,
                imageUrl: product.images?.[0]?.imageUrl || "",
                weightLabel: `${selectedWeight}g`,
                grams: selectedWeight,
                roastLevelId,
                roastLevelName: selectedRoast,
                grindTypeId,
                grindTypeName: selectedGrind,
              },
            ]

            // 4. Sync to backend
            console.log("[Product Quick Buy] Syncing product to basket:", {
              basketId,
              items: basketItems,
            })

            await basketService.updateBasket({
              id: basketId,
              items: basketItems,
              currencyCode: currency.toUpperCase(),
            })

            // 5. Complete the payment using the shared utility
            const shippingDetails = {
              address: event.shippingAddress,
              name: event.payerName,
              email: event.payerEmail,
              phone: event.payerPhone,
            }

            let orderResponse: { id: string; clientSecret?: string } | null = null

            try {
              // Import createOrder dynamically to avoid circular dependencies
              const { apiFetch } = await import("@/lib/axios")

              const nameParts = event.payerName
                ? event.payerName.trim().split(" ")
                : ["", ""]
              // FirstName/LastName: only include if they meet validation (min 2 chars), otherwise undefined
              const firstName = nameParts[0]?.trim().length ?? 0 >= 2 ? nameParts[0].trim() : undefined
              const lastName = nameParts.slice(1).join(" ").trim().length >= 2 ? nameParts.slice(1).join(" ").trim() : undefined

              const address = event.shippingAddress as any
              
              // Backend validation rules:
              // - Street: NotEmpty, Min 5, Max 200
              // - City: NotEmpty, Min 2, Max 50
              // - State: NotEmpty, Min 2, Max 50
              // - PostalCode: NotEmpty, Min 3, Max 20
              // - Country: NotEmpty, Min 2, Max 50
              // - FirstName/LastName: Optional, but Min 2 if provided
              const addressCity = address?.city?.trim() || "Unknown" // Min 2 chars ✓ (7 chars)
              const addressPostalCode = (address?.postalCode || address?.postal_code)?.trim() || "000000" // Min 3 chars ✓ (6 chars)
              
              orderResponse = await apiFetch<{
                id: string
                clientSecret?: string
              }>("/orders", {
                method: "POST",
                body: JSON.stringify({
                  basketId,
                  shippingAddress: {
                    // Street: Min 5 chars → "Not provided" fallback (12 chars)
                    street: (
                      address?.line1?.trim() ||
                      address?.addressLine1?.trim() ||
                      addressCity ||
                      "Not provided"
                    ),
                    // City: Min 2 chars → "Unknown" fallback (7 chars)
                    city: addressCity,
                    // State: Min 2 chars → "AE" fallback (2 chars)
                    state: (address?.state?.trim() || address?.region?.trim() || "AE"),
                    // PostalCode: Min 3 chars → "000000" fallback (6 chars)
                    postalCode: addressPostalCode,
                    // Country: Min 2 chars → "AE" fallback (2 chars)
                    country: address?.country?.trim() || "AE",
                    // Optional fields
                    firstName,
                    lastName,
                    email: event.payerEmail?.trim() || undefined,
                    phoneNumber: event.payerPhone?.trim() || undefined,
                  },
                  currency: currency.toUpperCase(),
                  usePoints: false,
                  languageCode: locale,
                }),
              })
              
              console.log("[Product Quick Buy] ✅ Backend validation check:", {
                street: `${(
                  address?.line1?.trim() ||
                  address?.addressLine1?.trim() ||
                  addressCity ||
                  "Not provided"
                ).length} chars (min 5) ✓`,
                city: `${addressCity.length} chars (min 2) ✓`,
                state: `${
                  (address?.state?.trim() || address?.region?.trim() || "AE")
                    .length
                } chars (min 2) ✓`,
                postalCode: `${addressPostalCode.length} chars (min 3) ✓`,
                country: `${
                  (address?.country?.trim() || "AE").length
                } chars (min 2) ✓`,
              })
            

              if (!orderResponse?.id) {
                throw new Error("Failed to create order")
              }
              

              // If there's a client secret, confirm payment
              if (orderResponse.clientSecret && event.paymentMethod?.id) {
                const { error: confirmError } = await stripe.confirmCardPayment(
                  orderResponse.clientSecret,
                  {
                    payment_method: event.paymentMethod.id,
                  }
                )

                if (confirmError) {
                  event.complete("fail")
                  const errorMessage =
                    confirmError.message || t("paymentFailed") || "Payment failed"
                  setError(errorMessage)
                  toast.error(errorMessage)
                  return
                }
              }

              // Complete payment
              event.complete("success")

              toast.success(t("expressCheckout.paymentSuccess") || "Payment successful!")

              if (onSuccess) {
                onSuccess(orderResponse.id)
              }

              // Redirect to confirmation page
              router.push(`/orders/confirmation/${orderResponse.id}`)
            } catch (orderError) {
              event.complete("fail")
              const errorMessage =
                orderError instanceof Error
                  ? orderError.message
                  : "Failed to process order"
              setError(errorMessage)
              toast.error(errorMessage)
            }
          } catch (err) {
            event.complete("fail")
            const errorMessage =
              err instanceof Error ? err.message : "Payment processing failed"
            setError(errorMessage)
            toast.error(errorMessage)
          } finally {
            setIsProcessing(false)
          }
        })

        // Create and mount PaymentRequestButtonElement
        const elements = stripe.elements()
        const element = elements.create("paymentRequestButton", {
          paymentRequest: pr,
          style: {
            paymentRequestButton: {
              type: "buy",
              theme: "dark",
              height: "40px",
            },
          },
        })

        elementRef.current = element
        if (containerRef.current) {
          element.mount(containerRef.current)
        }
      } catch (err) {
        setError("Express checkout not available")
      }
    }

    initPaymentRequest()

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
    hasValidSelection,
    isPriceAvailable,
    selectedWeight,
    product,
    currentPrice,
    selectedWeightId,
    selectedRoast,
    selectedGrind,
    quantity,
    locale,
    t,
    handleShippingAddressChange,
    onSuccess,
  ])

  if (!hasValidSelection || !isPriceAvailable) {
    return null
  }

  return (
    <div className="quick-buy-payment-request w-full">
      {error && (
        <div className="mb-3 p-2 rounded text-sm bg-destructive/10 text-destructive border border-destructive">
          {error}
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center z-50">
          <div className="bg-white rounded p-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">
              {t("expressCheckout.processing") || "Processing..."}
            </span>
          </div>
        </div>
      )}

      <div ref={containerRef} className="min-h-10" />
    </div>
  )
}
