"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { MapPin, Package, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/lib/cart-store"
import { apiFetch, setTokens } from "@/lib/api-client"
import { basketService } from "@/lib/services/basket"
import { useAuthStore } from "@/lib/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getImageUrl } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ShippingAddress {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

// Mock data for Arab countries and cities
const COUNTRIES_DATA = {
  UAE: {
    name: "United Arab Emirates",
    cities: ["Dubai", "Abu Dhabi", "Sharjah"],
    shippingCost: 10,
  },
  "Saudi Arabia": {
    name: "Saudi Arabia",
    cities: ["Riyadh", "Jeddah", "Dammam"],
    shippingCost: 15,
  },
  Qatar: {
    name: "Qatar",
    cities: ["Doha", "Al Rayyan"],
    shippingCost: 15,
  },
  Kuwait: {
    name: "Kuwait",
    cities: ["Kuwait City"],
    shippingCost: 15,
  },
} as const

type CountryKey = keyof typeof COUNTRIES_DATA

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

if (!stripePromise) {
  console.error("Stripe Key missing in ENV")
}

// Payment Form Component - Inside Elements wrapper, has access to Stripe hooks
function PaymentForm({ 
  shippingAddress, 
  onPaymentError 
}: { 
  shippingAddress: ShippingAddress
  onPaymentError: (error: string) => void 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayNow = async () => {
    if (!stripe || !elements) {
      onPaymentError("Payment system is not ready. Please refresh the page.")
      return
    }

    setIsProcessing(true)
    onPaymentError("") // Clear any previous errors

    try {
      // Confirm payment with Stripe - Order already exists as "Pending"
      // Use confirmParams with return_url to ensure success page is set
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      })

      // Handle Stripe errors (card declined, insufficient funds, etc.)
      if (result.error) {
        let errorMessage = result.error.message || "Payment failed. Please try again."
        
        // Provide more specific error messages for common cases
        if (result.error.type === "card_error") {
          errorMessage = result.error.message || "Your card was declined. Please try a different payment method."
        } else if (result.error.type === "validation_error") {
          errorMessage = "Please check your card details and try again."
        }
        
        onPaymentError(errorMessage)
        setIsProcessing(false)
        return
      }

      // Check if payment succeeded
      if (result.paymentIntent?.status === "succeeded") {
        // Payment successful! Order already exists in DB as "Pending"
        // Webhook will update it to "Paid" status
        console.log("Payment confirmed:", result.paymentIntent.id)
        
        // Clear cart first, then redirect using window.location.href for clean state transition
        useCartStore.getState().clearCart()
        // Use window.location.href to ensure a full page navigation and clean state
        window.location.href = "/checkout/success"
      } else {
        // Handle other payment statuses
        const status = result.paymentIntent?.status || "unknown"
        console.log("Payment status:", status)
        
        if (status === "processing") {
          onPaymentError("Payment is being processed. Please wait...")
        } else if (status === "requires_payment_method") {
          onPaymentError("Payment failed. Please try a different payment method.")
        } else {
          onPaymentError(`Payment status: ${status}. Please contact support if this persists.`)
        }
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Payment error:", error)
      onPaymentError(error instanceof Error ? error.message : "Payment processing failed")
      setIsProcessing(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertCircle className="text-accent h-6 w-6" />
          <CardTitle className="text-2xl">Payment</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <PaymentElement />
        <Button 
          type="button" 
          size="lg" 
          className="w-full text-lg font-semibold"
          onClick={handlePayNow}
          disabled={!stripe || !elements || isProcessing}
        >
          {isProcessing ? "Processing Payment..." : "Pay Now"}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function CheckoutForm() {
  const items = useCartStore((state) => state.items)
  const total = useCartStore((state) => state.total)
  const { user, accessToken, refreshToken } = useAuthStore()

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  })

  const [errors, setErrors] = useState<Partial<ShippingAddress>>({})
  const [successMessage, setSuccessMessage] = useState("")
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isInitializingPayment, setIsInitializingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  useEffect(() => {
    if (accessToken && refreshToken) {
      setTokens({ accessToken, refreshToken })
    }
  }, [accessToken, refreshToken])

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    // Clear success message when user modifies form
    if (successMessage) {
      setSuccessMessage("")
    }
    // Reset payment intent if the address changes
    if (clientSecret) {
      setClientSecret(null)
    }
    if (paymentError) {
      setPaymentError(null)
    }
  }

  const handleCountryChange = (value: string) => {
    setShippingAddress((prev) => ({ ...prev, country: value, city: "" })) // Reset city when country changes
    if (errors.country) {
      setErrors((prev) => ({ ...prev, country: undefined }))
    }
    if (successMessage) {
      setSuccessMessage("")
    }
    if (clientSecret) {
      setClientSecret(null)
    }
    if (paymentError) {
      setPaymentError(null)
    }
  }

  const handleCityChange = (value: string) => {
    handleInputChange("city", value)
  }

  // Get available cities based on selected country
  const availableCities = shippingAddress.country && shippingAddress.country in COUNTRIES_DATA
    ? COUNTRIES_DATA[shippingAddress.country as CountryKey].cities
    : []

  // Get shipping cost based on selected country
  const getShippingCost = (): number => {
    if (shippingAddress.country && shippingAddress.country in COUNTRIES_DATA) {
      return COUNTRIES_DATA[shippingAddress.country as CountryKey].shippingCost
    }
    return 0
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingAddress> = {}

    if (!shippingAddress.street.trim()) {
      newErrors.street = "Street address is required"
    }
    if (!shippingAddress.city.trim()) {
      newErrors.city = "City is required"
    }
    if (!shippingAddress.state.trim()) {
      newErrors.state = "State is required"
    }
    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = "Postal code is required"
    }
    if (!shippingAddress.country.trim()) {
      newErrors.country = "Country is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const initializePayment = async () => {
    setIsInitializingPayment(true)
    setPaymentError(null)

    try {
      let basketId: string | undefined

      try {
        const basket = await basketService.getBasket()
        basketId = basket?.id
      } catch (basketError) {
        console.warn("Unable to fetch basket before order creation", basketError)
      }

      if (!basketId && user?.id) {
        basketId = user.id
      }

      if (!accessToken) {
        throw new Error("Missing access token. Please sign in again.")
      }

      console.log("Basket ID for Order Creation:", basketId)

      if (!basketId) {
        throw new Error("Basket ID is missing")
      }

      // STEP 1: Create the pending order FIRST
      console.log("Creating pending order...")
      const orderResponse = await apiFetch<{ id: string; clientSecret?: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          basketId,
          shippingAddress,
        }),
      })

      console.log("Order created with ID:", orderResponse?.id)

      // STEP 2: Get payment intent (either from order response or separate call)
      let clientSecretValue: string | undefined

      // If backend returns clientSecret with order, use it
      if (orderResponse?.clientSecret) {
        clientSecretValue = orderResponse.clientSecret
      } else {
        // Otherwise, create payment intent separately
        const url = `/payments/${basketId}`
        console.log("Creating payment intent:", url)

        const paymentResponse = await apiFetch<{ clientSecret: string }>(url, {
          method: "POST",
        })

        clientSecretValue = paymentResponse?.clientSecret
      }

      if (!clientSecretValue) {
        throw new Error("Missing client secret from payment intent")
      }

      setClientSecret(clientSecretValue)
      setSuccessMessage("Order created successfully. Ready for payment.")
    } catch (error) {
      console.error("Failed to initialize checkout", error)
      const message = error instanceof Error ? error.message : "Unable to start checkout process"
      setPaymentError(message)
      setClientSecret(null)
    } finally {
      setIsInitializingPayment(false)
    }
  }

  const handleContinueToPayment = async (e: FormEvent) => {
    e.preventDefault()
    setPaymentError(null)

    if (validateForm()) {
      await initializePayment()
    }
  }

  const subtotal = total()
  const shipping = getShippingCost()
  const orderTotal = subtotal + shipping

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Shipping Form */}
      <div className="lg:col-span-2">
        <form onSubmit={handleContinueToPayment} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <MapPin className="text-accent h-6 w-6" />
                <CardTitle className="text-2xl">Shipping Address</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {successMessage && (
                <Alert className="border-oasis-teal bg-oasis-teal/5 dark:bg-oasis-teal/10">
                  <AlertCircle className="h-4 w-4 text-oasis-teal" />
                  <AlertDescription className="text-oasis-teal dark:text-oasis-teal">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="street" className="text-sm font-medium">
                  Street Address <span className="text-destructive">*</span>
                </label>
                <Input
                  id="street"
                  type="text"
                  placeholder="123 Main Street"
                  value={shippingAddress.street}
                  onChange={(e) => handleInputChange("street", e.target.value)}
                  aria-invalid={!!errors.street}
                  className={errors.street ? "border-destructive" : ""}
                />
                {errors.street && <p className="text-sm text-destructive">{errors.street}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="state" className="text-sm font-medium">
                  State / Region <span className="text-destructive">*</span>
                </label>
                <Input
                  id="state"
                  type="text"
                  placeholder="NY"
                  value={shippingAddress.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  aria-invalid={!!errors.state}
                  className={errors.state ? "border-destructive" : ""}
                />
                {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="postalCode" className="text-sm font-medium">
                    Postal Code <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="postalCode"
                    type="text"
                    placeholder="10001"
                    value={shippingAddress.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    aria-invalid={!!errors.postalCode}
                    className={errors.postalCode ? "border-destructive" : ""}
                  />
                  {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="country" className="text-sm font-medium">
                    Country <span className="text-destructive">*</span>
                  </label>
                  <Select value={shippingAddress.country} onValueChange={handleCountryChange}>
                    <SelectTrigger
                      id="country"
                      className={`w-full ${errors.country ? "border-destructive" : ""}`}
                      aria-invalid={!!errors.country}
                    >
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(COUNTRIES_DATA).map((countryKey) => (
                        <SelectItem key={countryKey} value={countryKey}>
                          {COUNTRIES_DATA[countryKey as CountryKey].name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">
                  City <span className="text-destructive">*</span>
                </label>
                <Select
                  value={shippingAddress.city}
                  onValueChange={handleCityChange}
                  disabled={!shippingAddress.country}
                >
                  <SelectTrigger
                    id="city"
                    className={`w-full ${errors.city ? "border-destructive" : ""}`}
                    aria-invalid={!!errors.city}
                  >
                    <SelectValue placeholder={shippingAddress.country ? "Select city" : "Select country first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full text-lg font-semibold"
            disabled={isInitializingPayment}
          >
            {isInitializingPayment ? "Preparing Payment..." : "Proceed to Payment"}
          </Button>
        </form>

        {paymentError && (
          <Alert className="mt-4 border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{paymentError}</AlertDescription>
          </Alert>
        )}

        {clientSecret && stripePromise && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm 
              shippingAddress={shippingAddress} 
              onPaymentError={setPaymentError}
            />
          </Elements>
        )}
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="text-accent h-6 w-6" />
              <CardTitle className="text-2xl">Order Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4 max-h-100 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getImageUrl(item.imageUrl) || ""}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Shipping {shippingAddress.country && `(${shippingAddress.country})`}
                </span>
                <span className="font-medium">
                  {shipping > 0 ? `$${shipping.toFixed(2)}` : "Select country"}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-accent">${orderTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
