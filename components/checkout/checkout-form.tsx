"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useLocale } from "next-intl"
import { MapPin, Package, AlertCircle, Loader2 } from "lucide-react"
import { useCartStore, getItemPrice } from "@/lib/cart-store"
import { useCurrency } from "@/lib/currency-context"
import { apiFetch, setTokens } from "@/lib/api-client"
import { basketService } from "@/lib/services/basket"
import { useAuthStore } from "@/lib/auth-store"
import { getMyRewards } from "@/lib/services/rewards"
import { Checkbox } from "@/components/ui/checkbox"
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
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
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
    <div className="space-y-4 w-full">
      <div className="w-full overflow-x-hidden">
        <PaymentElement />
      </div>
      {paymentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
        <Button
          type="button"
          className="flex-1"
          onClick={handlePayNow}
          disabled={isProcessing}
          style={{ backgroundColor: '#1f6f78', color: '#fff' }}
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
        <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing} className="sm:flex-none">
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
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
  const locale = useLocale()

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: "",
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
  const [rewardBalance, setRewardBalance] = useState<number>(0)
  const [usePoints, setUsePoints] = useState(false)
  const [isLoadingRewards, setIsLoadingRewards] = useState(false)

  useEffect(() => {
    if (accessToken && refreshToken) {
      setTokens({ accessToken, refreshToken })
    }
  }, [accessToken, refreshToken])

  // Fetch user's reward balance on component mount
  useEffect(() => {
    const fetchRewardBalance = async () => {
      if (!user) return // Only fetch if user is logged in

      setIsLoadingRewards(true)
      try {
        const rewards = await getMyRewards()
        setRewardBalance(rewards.stats.balance)
      } catch (error) {
        console.error("Failed to fetch reward balance:", error)
        setRewardBalance(0)
      } finally {
        setIsLoadingRewards(false)
      }
    }

    fetchRewardBalance()
  }, [user])

  // Pre-fill form with logged-in user data if available
  useEffect(() => {
    if (user) {
      setShippingAddress((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      }))
    }
  }, [user])

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

    // Validate guest info if not logged in
    if (!user) {
      if (!shippingAddress.firstName?.trim()) {
        newErrors.firstName = "First name is required"
      }
      if (!shippingAddress.lastName?.trim()) {
        newErrors.lastName = "Last name is required"
      }
      if (!shippingAddress.email?.trim()) {
        newErrors.email = "Email is required"
      }
      if (!shippingAddress.phoneNumber?.trim()) {
        newErrors.phoneNumber = "Phone number is required"
      }
    }

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
      // STEP 0: Get current state from Zustand store
      const storeState = useCartStore.getState()
      const currentItems = storeState.items
      
      console.log("📦 STORE STATE AT CHECKOUT:", {
        itemsCount: currentItems.length,
        itemNames: currentItems.map(i => i.name),
      })

      // Determine consistent basketId for entire function
      let basketId: string
      if (user?.id) {
        basketId = user.id
      } else {
        // For guests, generate ONCE and reuse throughout
        basketId = "guest_" + Math.random().toString(36).substring(2, 11)
      }

      console.log("🔑 BASKET ID DETERMINED:", basketId)

      // STEP 1: FORCE SYNC - Sync current store items to Backend (Redis) BEFORE order creation
      if (currentItems.length > 0) {
        try {
          const basketItems = currentItems.map((item) => ({
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
            roastLevelName: item.selectedRoast || item.roastLevelName || "Original",
            grindTypeId: item.grindTypeId || "00000000-0000-0000-0000-000000000000",
            grindTypeName: item.selectedGrind || item.grindTypeName || "Whole Bean",
          }))

          console.log("🔄 FORCE SYNCING TO REDIS:", {
            basketId: basketId,
            itemCount: basketItems.length,
            items: basketItems,
          })

          // Force sync to Backend
          await basketService.updateBasket({
            id: basketId,
            items: basketItems,
            currencyCode: currency.toUpperCase(),
          })

          console.log("✅ BASKET FORCE SYNCED TO REDIS:", basketId)
        } catch (syncError) {
          console.error("❌ CRITICAL: Failed to sync basket to Redis:", syncError)
          throw new Error("Failed to sync basket. Please try again.")
        }
      } else {
        console.warn("⚠️ EMPTY BASKET: No items to sync")
        throw new Error("Your basket is empty. Please add items before checkout.")
      }

      // STEP 2: Create order with same consistent basketId
      console.log("📋 PAYLOAD CHECK (BEFORE ORDER):", {
        basketId: basketId,
        itemsCount: currentItems.length,
        currency: currency.toUpperCase(),
        shippingAddress: shippingAddress,
      })

      const orderResponse = await apiFetch<{ id: string; clientSecret?: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          basketId: basketId,  // SAME ID as updateBasket
          shippingAddress,
          currency: currency.toUpperCase(),
          usePoints: usePoints,
          languageCode: locale,
        }),
      })

      console.log("✅ ORDER CREATED:", {
        orderId: orderResponse?.id,
        basketIdUsed: basketId,
      })

      setOrderId(orderResponse?.id || null)

      // STEP 3: Get payment intent
      let clientSecretValue: string | undefined

      if (orderResponse?.clientSecret) {
        clientSecretValue = orderResponse.clientSecret
      } else {
        const paymentResponse = await apiFetch<{ clientSecret: string }>(`/payments/${basketId}`, {
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
      console.error("❌ CHECKOUT ERROR:", error)
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
  const subtotalWithShipping = subtotal + shipping
  
  // Calculate reward discount
  const rewardDiscount = usePoints ? Math.min(rewardBalance, subtotalWithShipping) : 0
  const orderTotal = subtotalWithShipping - rewardDiscount

  // Debug log
  console.log("Selected Country Rates:", selectedCountry?.shippingRates, "App Currency:", currency)

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Shipping Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleContinueToPayment} className="space-y-6">
            <Card style={{ backgroundColor: 'rgb(253, 250, 247)', color: '#4B2E2B' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MapPin className="text-accent h-6 w-6" />
                  <CardTitle className="text-2xl" style={{ color: '#4B2E2B' }}>Shipping Address</CardTitle>
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

                {/* Guest Checkout - Show guest info fields if not logged in */}
                {!user && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Guest Checkout - Please enter your information</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm font-medium">
                          First Name
                        </label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          value={shippingAddress.firstName || ""}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          aria-invalid={!!errors.firstName}
                          className={`${errors.firstName ? "border-destructive" : ""} focus-visible:ring-[#1f6f78]/50 focus-visible:border-[#1f6f78]`}
                        />
                        {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="lastName" className="text-sm font-medium">
                          Last Name
                        </label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          value={shippingAddress.lastName || ""}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          aria-invalid={!!errors.lastName}
                          className={`${errors.lastName ? "border-destructive" : ""} focus-visible:ring-[#1f6f78]/50 focus-visible:border-[#1f6f78]`}
                        />
                        {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          Email
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={shippingAddress.email || ""}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          aria-invalid={!!errors.email}
                          className={`${errors.email ? "border-destructive" : ""} focus-visible:ring-[#1f6f78]/50 focus-visible:border-[#1f6f78]`}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="phoneNumber" className="text-sm font-medium">
                          Phone Number
                        </label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={shippingAddress.phoneNumber || ""}
                          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                          aria-invalid={!!errors.phoneNumber}
                          className={`${errors.phoneNumber ? "border-destructive" : ""} focus-visible:ring-[#1f6f78]/50 focus-visible:border-[#1f6f78]`}
                        />
                        {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="street" className="text-sm font-medium">
                    Street Address
                  </label>
                  <Input
                    id="street"
                    type="text"
                    placeholder="123 Main Street"
                    value={shippingAddress.street}
                    onChange={(e) => handleInputChange("street", e.target.value)}
                    aria-invalid={!!errors.street}
                    className={`${errors.street ? "border-destructive" : ""} focus-visible:ring-[#1f6f78]/50 focus-visible:border-[#1f6f78]`}
                  />
                  {errors.street && <p className="text-sm text-destructive">{errors.street}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="state" className="text-sm font-medium">
                    State / Region
                  </label>
                  <Input
                    id="state"
                    type="text"
                    placeholder="NY"
                    value={shippingAddress.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    aria-invalid={!!errors.state}
                    className={`${errors.state ? "border-destructive" : ""} focus-visible:ring-[#1f6f78]/50 focus-visible:border-[#1f6f78]`}
                  />
                  {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="postalCode" className="text-sm font-medium">
                      Postal Code
                    </label>
                    <Input
                      id="postalCode"
                      type="text"
                      placeholder="10001"
                      value={shippingAddress.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      aria-invalid={!!errors.postalCode}
                      className={`${errors.postalCode ? "border-destructive" : ""} focus-visible:ring-[#1f6f78]/50 focus-visible:border-[#1f6f78]`}
                    />
                    {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="country" className="text-sm font-medium">
                      Country
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
                    City
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
              style={{ backgroundColor: '#2b1b13', color: '#fff' }}
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
          <Card className="sticky top-8" style={{ backgroundColor: 'rgb(253, 250, 247)', color: '#4B2E2B' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Package className="text-accent h-6 w-6" />
                <CardTitle className="text-2xl" style={{ color: '#4B2E2B' }}>Order Summary</CardTitle>
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
                        <FormattedPrice amount={getItemPrice(item, currency) * item.quantity} />
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

                {/* Subtotal with Shipping */}
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Subtotal</span>
                  <FormattedPrice amount={subtotalWithShipping} />
                </div>

                {/* Reward Points Toggle */}
                {user && rewardBalance > 0 && (
                  <div className="space-y-2 py-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="usePoints"
                          checked={usePoints}
                          onCheckedChange={(checked) => setUsePoints(checked === true)}
                          disabled={isLoadingRewards}
                        />
                        <label
                          htmlFor="usePoints"
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          Use {rewardBalance.toFixed(2)} points
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-7">
                      You have {rewardBalance.toFixed(2)} points available
                    </p>
                  </div>
                )}

                {usePoints && rewardDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                    <span>Reward Discount</span>
                    <span>-<FormattedPrice amount={rewardDiscount} /></span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Total */}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <div className="text-right">
                    {usePoints && rewardDiscount > 0 && (
                      <div className="line-through text-muted-foreground text-sm mb-1">
                        <FormattedPrice amount={subtotalWithShipping} />
                      </div>
                    )}
                    <span className="text-accent"><FormattedPrice amount={orderTotal} /></span>
                  </div>
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
