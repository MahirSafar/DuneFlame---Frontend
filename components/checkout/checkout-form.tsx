"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { MapPin, Package, AlertCircle, Loader2 } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { useCurrency } from "@/lib/currency-context"
import { apiFetch, setTokens } from "@/lib/api-client"
import { basketService } from "@/lib/services/basket"
import { useAuthStore } from "@/lib/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getImageUrl } from "@/lib/utils"
import { FormattedPrice } from "@/components/currency/formatted-price"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

interface ShippingRate {
  currency: string | number  // Handle Enum (could be "USD" or 0)
  cost: number
}

interface Country {
  id: string
  name: string
  code: string
  cityCount: number
  shippingRates: ShippingRate[]
}

interface City {
  id: string
  name: string
}

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

if (!stripePromise) {
  console.warn("Stripe key missing. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payments.")
}

function PaymentContent({
  onClose,
  orderId,
  isProcessing,
  setIsProcessing,
}: {
  onClose: () => void
  orderId: string | null
  isProcessing: boolean
  setIsProcessing: (val: boolean) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handlePayNow = async () => {
    if (!stripe || !elements) {
      setPaymentError("Payment system is not ready. Please refresh the page.")
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders/confirmation/${orderId || ""}`,
        },
        redirect: "if_required",
      })

      if (result.error) {
        let errorMessage = result.error.message || "Payment failed. Please try again."
        if (result.error.type === "card_error") {
          errorMessage = result.error.message || "Your card was declined. Please try a different payment method."
        } else if (result.error.type === "validation_error") {
          errorMessage = "Please check your card details and try again."
        }
        setPaymentError(errorMessage)
        setIsProcessing(false)
        return
      }

      if (result.paymentIntent?.status === "succeeded") {
        useCartStore.getState().clearCart()
        const confirmationPath = orderId
          ? `/orders/confirmation/${orderId}`
          : "/profile/orders"
        window.location.href = confirmationPath
      } else {
        const status = result.paymentIntent?.status || "unknown"
        if (status === "processing") {
          setPaymentError("Payment is being processed. Please wait...")
        } else if (status === "requires_payment_method") {
          setPaymentError("Payment failed. Please try a different payment method.")
        } else {
          setPaymentError(`Payment status: ${status}. Please contact support if this persists.`)
        }
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Payment error:", error)
      setPaymentError(error instanceof Error ? error.message : "Payment processing failed")
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      {paymentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-3">
        <Button
          type="button"
          className="flex-1"
          onClick={handlePayNow}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            "Pay Now"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function StripePaymentModal({
  open,
  onClose,
  clientSecret,
  orderId,
}: {
  open: boolean
  onClose: () => void
  clientSecret: string | null
  orderId: string | null
}) {
  const [isProcessing, setIsProcessing] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!isProcessing && !val) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete your payment</DialogTitle>
          <DialogDescription>
            Your order is created. Please pay to finalize it. Closing without paying keeps it unpaid.
          </DialogDescription>
        </DialogHeader>

        {clientSecret && stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: "stripe" },
            }}
          >
            <PaymentContent
              onClose={onClose}
              orderId={orderId}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </Elements>
        ) : (
          <p className="text-sm text-muted-foreground">Preparing payment...</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function CheckoutForm() {
  const items = useCartStore((state) => state.items)
  const total = useCartStore((state) => state.total)
  const { currency } = useCurrency()
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
  const [orderId, setOrderId] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isInitializingPayment, setIsInitializingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedCountryId, setSelectedCountryId] = useState("")
  const [isLoadingCountries, setIsLoadingCountries] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [shippingError, setShippingError] = useState<string | null>(null)

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

  const fetchCities = useCallback(async (countryId: string) => {
    setIsLoadingCities(true)
    setShippingError(null)

    try {
      const data = await apiFetch<City[]>(`/shipping/countries/${countryId}/cities`)
      setCities(data)
    } catch (error) {
      console.error("Failed to load cities", error)
      setCities([])
      setShippingError("Unable to load cities. Please try again.")
    } finally {
      setIsLoadingCities(false)
    }
  }, [])

  const fetchCountries = useCallback(async () => {
    setIsLoadingCountries(true)
    setShippingError(null)

    try {
      const data = await apiFetch<Country[]>('/shipping/countries')
      setCountries(data)

      // Keep selected country name in sync or clear if it no longer exists
      if (selectedCountryId) {
        const selected = data.find((country) => country.id === selectedCountryId)
        if (selected) {
          setShippingAddress((prev) => ({ ...prev, country: selected.code }))
        } else {
          setSelectedCountryId("")
          setShippingAddress((prev) => ({ ...prev, country: "", city: "" }))
          setCities([])
        }
      }
    } catch (error) {
      console.error("Failed to load countries", error)
      setCountries([])
      setShippingError("Unable to load shipping countries. Please try again.")
    } finally {
      setIsLoadingCountries(false)
    }
  }, [currency, selectedCountryId])

  useEffect(() => {
    fetchCountries()
  }, [fetchCountries])

  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId)

    const selected = countries.find((country) => country.id === countryId)
    if (selected) {
      console.log("Secilen Olke Kodu:", selected.code)
      // Store ISO code so backend ShippingService matches (e.g., "KW" instead of country name)
      setShippingAddress((prev) => ({ ...prev, country: selected.code, city: "" }))
    } else {
      setShippingAddress((prev) => ({ ...prev, country: "", city: "" }))
    }
    setCities([])

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

    if (countryId) {
      fetchCities(countryId)
    }
  }

  const handleCityChange = (value: string) => {
    handleInputChange("city", value)
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


      if (!basketId) {
        throw new Error("Basket ID is missing")
      }

      // STEP 1: Create the pending order FIRST with currency
      const orderResponse = await apiFetch<{ id: string; clientSecret?: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          basketId,
          shippingAddress,
          currency: currency.toUpperCase(),  // CRITICAL: Include currency for Stripe amount calculation
        }),
      })

      setOrderId(orderResponse?.id || null)


      // STEP 2: Get payment intent (either from order response or separate call)
      let clientSecretValue: string | undefined

      // If backend returns clientSecret with order, use it
      if (orderResponse?.clientSecret) {
        clientSecretValue = orderResponse.clientSecret
      } else {
        // Otherwise, create payment intent separately
        const url = `/payments/${basketId}`

        const paymentResponse = await apiFetch<{ clientSecret: string }>(url, {
          method: "POST",
        })

        clientSecretValue = paymentResponse?.clientSecret
      }

      if (!clientSecretValue) {
        throw new Error("Missing client secret from payment intent")
      }

      setClientSecret(clientSecretValue)
      setIsPaymentModalOpen(true)
      setSuccessMessage("Order created successfully. Please complete payment.")
    } catch (error) {
      console.error("Failed to initialize checkout", error)
      const message = error instanceof Error ? error.message : "Unable to start checkout process"
      setPaymentError(message)
      setClientSecret(null)
      setOrderId(null)
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

  const subtotal = total(currency)
  const selectedCountry = countries.find((country) => country.id === selectedCountryId)
  // Find rate that matches current currency
  const rateObj = selectedCountry?.shippingRates.find((r) =>
    String(r.currency).toUpperCase() === currency.toUpperCase()
  )
  const shipping = rateObj?.cost ?? 0
  const orderTotal = subtotal + shipping

  // Debug log
  console.log("Selected Country Rates:", selectedCountry?.shippingRates, "App Currency:", currency)

  return (
    <>
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
                    <Select
                      value={selectedCountryId}
                      onValueChange={handleCountryChange}
                      disabled={isLoadingCountries}
                    >
                      <SelectTrigger
                        id="country"
                        className={`w-full ${errors.country ? "border-destructive" : ""}`}
                        aria-invalid={!!errors.country}
                        aria-busy={isLoadingCountries}
                      >
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
                    {shippingError && !errors.country && (
                      <p className="text-sm text-destructive">{shippingError}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm font-medium">
                    City <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={shippingAddress.city}
                    onValueChange={handleCityChange}
                    disabled={!selectedCountryId || isLoadingCities}
                  >
                    <SelectTrigger
                      id="city"
                      className={`w-full ${errors.city ? "border-destructive" : ""}`}
                      aria-invalid={!!errors.city}
                      aria-busy={isLoadingCities}
                    >
                      <SelectValue
                        placeholder={selectedCountryId ? "Select city" : "Select country first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
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

          {/* Payment handled via modal */}
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
                  <div
                    key={
                      item.variantKey || `${item.id}-${item.productPriceId}-${item.roastLevelId}-${item.grindTypeId}`
                    }
                    className="flex gap-4"
                  >
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
                  <FormattedPrice amount={subtotal} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Shipping {shippingAddress.country && `(${shippingAddress.country})`}
                  </span>
                  <span className="font-medium">
                    {selectedCountryId ? <FormattedPrice amount={shipping} /> : "Select country"}
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Total */}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-accent"><FormattedPrice amount={orderTotal} /></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <StripePaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        clientSecret={clientSecret}
        orderId={orderId}
      />
    </>
  )
}
