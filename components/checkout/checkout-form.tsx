"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useLocale, useTranslations } from "next-intl"
import { MapPin, Package, AlertCircle, Loader2 } from "lucide-react"
import { useCartStore, getItemPrice } from "@/lib/cart-store"
import { useCurrency } from "@/lib/currency-context"
import { apiFetch, setTokens, setApiClientLocale } from "@/lib/api-client"
import { basketService } from "@/lib/services/basket"
import { getProduct } from "@/lib/services/products"
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

type ShippingErrors = Partial<ShippingAddress> & {
  fullName?: string
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

const GCC_COUNTRY_CODES = ["AE", "SA", "KW", "QA", "BH", "OM"]

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
  orderTotal,
  t,
}: {
  onClose: () => void
  orderId: string | null
  isProcessing: boolean
  setIsProcessing: (val: boolean) => void
  orderTotal: number
  t: any
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false)

  // Check if this is a zero-amount order
  const isZeroAmount = orderTotal <= 0

  const handlePayNow = async () => {
    // For zero-amount orders, finalize without Stripe
    if (isZeroAmount) {
      setIsProcessing(true)
      setPaymentError(null)

      try {
        if (!orderId) {
          throw new Error("Order ID is missing")
        }

        console.log("✅ ZERO AMOUNT ORDER - Finalizing without Stripe payment")
        
        // Clear cart
        useCartStore.getState().clearCart()
        
        // Redirect to confirmation page
        if (typeof window !== "undefined") {
          window.location.href = `/orders/confirmation/${orderId}`
        } else {
          throw new Error("Cannot redirect: window object not available")
        }
      } catch (error) {
        console.error("Zero-amount order finalization error:", error)
        setPaymentError(error instanceof Error ? error.message : "Failed to finalize order")
        setIsProcessing(false)
      }
      return
    }

    // For paid orders, use Stripe
    if (!stripe || !elements) {
      setPaymentError("Payment system is not ready. Please refresh the page.")
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      if (typeof window === "undefined") {
        throw new Error("Payment system is not available in this environment")
      }

      // CHECK 1: Verify PaymentElement is actually mounted
      const paymentElement = elements.getElement(PaymentElement)
      if (!paymentElement) {
        console.error("❌ Payment Element not found/mounted. Aborting confirmPayment.")
        throw new Error("Payment Element is not mounted. Please refresh the page and try again.")
      }

      // CHECK 2: Verify PaymentElement is ready before proceeding
      if (!isPaymentElementReady) {
        console.error("❌ Payment Element is not ready yet. User clicked too fast.")
        throw new Error("Payment system is still loading. Please wait a moment and try again.")
      }

      console.log("✅ Payment Element verified as mounted and ready. Proceeding with confirmPayment.")

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
        
        // Safely redirect using window.location
        if (typeof window !== "undefined") {
          window.location.href = confirmationPath
        } else {
          console.warn("Cannot redirect: window object not available")
          setPaymentError("Payment succeeded but redirection failed. Please refresh the page.")
        }
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
      {/* Only render PaymentElement for paid orders */}
      {!isZeroAmount && (
        <div className="w-full overflow-x-hidden">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
            onReady={() => {
              console.log("✅ PaymentElement is now ready")
              setIsPaymentElementReady(true)
            }}
          />
        </div>
      )}

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
          disabled={isProcessing || (!isZeroAmount && !isPaymentElementReady)}
          style={{ backgroundColor: '#1f6f78', color: '#fff' }}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isZeroAmount ? t("processing") : t("processing")}
            </span>
          ) : !isZeroAmount && !isPaymentElementReady ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : isZeroAmount ? (
            "Complete Free Order"
          ) : (
            t("payNow")
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing} className="sm:flex-none">
          {t("cancel")}
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
  orderTotal,
  currency,
  t,
}: {
  open: boolean
  onClose: () => void
  clientSecret: string | null
  orderId: string | null
  orderTotal: number
  currency: string
  t: any
}) {
  const [isProcessing, setIsProcessing] = useState(false)

  // Check if this is a zero-amount order
  const isZeroAmount = orderTotal <= 0

  // Log client secret whenever modal opens or clientSecret changes
  useEffect(() => {
    if (open && clientSecret) {
      console.log("📋 STRIPE PAYMENT MODAL OPENED - Client Secret Debug:", {
        clientSecret: clientSecret,
        type: typeof clientSecret,
        clientSecretExists: !!clientSecret,
        clientSecretLength: clientSecret.length,
        clientSecretPrefix: clientSecret.substring(0, 30) + "...",
        isValidFormat: clientSecret.includes("_secret_"),
        noManipulation: clientSecret === clientSecret.trim() && !clientSecret.includes('\\n') && !clientSecret.includes('\\t'),
        orderTotal,
        isZeroAmount,
        orderId,
        timestamp: new Date().toISOString(),
      })
    }
  }, [open, clientSecret, orderTotal])

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!isProcessing && !val) onClose() }}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isZeroAmount ? "Complete Your Order" : t("completePayment")}
          </DialogTitle>
          <DialogDescription>
            {isZeroAmount 
              ? "Your order will be finalized with the reward points discount applied."
              : t("paymentInfo")}
          </DialogDescription>
        </DialogHeader>

        {isZeroAmount ? (
          // Zero-amount order - no Stripe elements needed
          <PaymentContent
            onClose={onClose}
            orderId={orderId}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            orderTotal={orderTotal}
            t={t}
          />
        ) : clientSecret && stripePromise ? (
          // Paid order - use Stripe Elements
          <>
            {console.log("✅ RENDERING ELEMENTS PROVIDER WITH RAW CLIENT SECRET:", {
              clientSecret: clientSecret,
              type: typeof clientSecret,
              clientSecretExists: !!clientSecret,
              clientSecretLength: clientSecret.length,
              clientSecretPrefix: clientSecret.substring(0, 30) + "...",
              isValidFormat: clientSecret.includes("_secret_"),
              noManipulation: clientSecret === clientSecret.trim() && !clientSecret.includes('\\n'),
              timestamp: new Date().toISOString(),
            })}
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: clientSecret,
                appearance: { theme: "stripe" as const },
              }}
            >
              <PaymentContent
                onClose={onClose}
                orderId={orderId}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                orderTotal={orderTotal}
                t={t}
              />
            </Elements>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {!clientSecret ? "No payment method available - Please go back and try again." : "Preparing payment..."}
          </p>
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
  const t = useTranslations("checkout")
  const isArabic = locale === "ar"

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

  const [errors, setErrors] = useState<ShippingErrors>({})
  const [guestStep, setGuestStep] = useState<1 | 2>(1)
  const [guestFullName, setGuestFullName] = useState("")
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

  const isGuest = !accessToken

  useEffect(() => {
    if (accessToken && refreshToken) {
      setTokens({ accessToken, refreshToken })
    }
  }, [accessToken, refreshToken])

  // Restore selected country from localStorage after login
  useEffect(() => {
    if (accessToken && !selectedCountryId && typeof window !== "undefined") {
      const savedCountryId = localStorage.getItem("checkout_selected_country_id")
      if (savedCountryId) {
        console.log("[CheckoutForm] 🔄 Restored selected country from localStorage:", savedCountryId)
        setSelectedCountryId(savedCountryId)
      } else {
        // If no saved country and in UAE, suggest AE by default
        const savedCountryFromAPI = localStorage.getItem("df_default_country")
        if (savedCountryFromAPI) {
          console.log("[CheckoutForm] 🔄 Using default country from API:", savedCountryFromAPI)
          setSelectedCountryId(savedCountryFromAPI)
        }
      }
    }
  }, [accessToken, selectedCountryId])

  // Save selected country to localStorage when it changes
  useEffect(() => {
    if (selectedCountryId && typeof window !== "undefined") {
      localStorage.setItem("checkout_selected_country_id", selectedCountryId)
      console.log("[CheckoutForm] 💾 Saved selected country to localStorage:", selectedCountryId)
    }
  }, [selectedCountryId])

  // Fetch user's reward balance on component mount
  useEffect(() => {
    const fetchRewardBalance = async () => {
      if (!user) return // Only fetch if user is logged in

      setIsLoadingRewards(true)
      try {
        const rewards = await getMyRewards()
        setRewardBalance(rewards.stats.balance)
      } catch (error: any) {
        // Silently handle session expired errors (expected after token expiry)
        if (error?.message === "Session expired") {
          console.debug("Skipping reward fetch - session expired");
          setRewardBalance(0)
          return
        }
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

  useEffect(() => {
    if (isGuest) {
      const prefilledName = [shippingAddress.firstName, shippingAddress.lastName].filter(Boolean).join(" ")
      if (prefilledName && !guestFullName) {
        setGuestFullName(prefilledName)
      }
    } else {
      setGuestStep(1)
      setGuestFullName("")
    }
  }, [isGuest, shippingAddress.firstName, shippingAddress.lastName, guestFullName])

  // Ensure locale is set in API client before fetching products
  useEffect(() => {
    console.log(`[CheckoutForm] Setting API locale to: ${locale}`)
    setApiClientLocale(locale)
  }, [locale])

  // Refresh product names when locale changes
  useEffect(() => {
    const refreshProductNames = async () => {
      const currentItems = useCartStore.getState().items
      
      if (currentItems.length === 0) {
        console.log('[CheckoutForm] No items to display')
        return
      }

      // Note: Product translation disabled due to endpoint availability issues
      // Using product names from cart store data
      console.log('[CheckoutForm] Using product names from cart store')
    }

    refreshProductNames()
  }, [locale])

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

  const splitFullName = (value: string) => {
    const normalized = value.trim().replace(/\s+/g, " ")
    if (!normalized) {
      return { firstName: "", lastName: "" }
    }

    const parts = normalized.split(" ")
    const firstName = parts[0] || ""
    const lastName = parts.slice(1).join(" ")

    return { firstName, lastName }
  }

  const handleGuestFullNameChange = (value: string) => {
    setGuestFullName(value)
    const { firstName, lastName } = splitFullName(value)
    setShippingAddress((prev) => ({ ...prev, firstName, lastName }))

    if (errors.fullName) {
      setErrors((prev) => ({ ...prev, fullName: undefined }))
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

  const fetchCities = useCallback(async (countryId: string) => {
    setIsLoadingCities(true)
    setShippingError(null)

    try {
      const data = await apiFetch<City[]>(`/shipping/countries/${countryId}/cities`)
      setCities(data)
    } catch (error) {
      console.error("Failed to load cities", error)
      setCities([])
      setShippingError(t("unableToLoadCities"))
    } finally {
      setIsLoadingCities(false)
    }
  }, [t])

  const fetchCountries = useCallback(async () => {
    setIsLoadingCountries(true)
    setShippingError(null)

    try {
      const data = await apiFetch<Country[]>('/shipping/countries')
      const filtered = data.filter((country) => GCC_COUNTRY_CODES.includes(country.code))
      setCountries(filtered)

      // Keep selected country name in sync or clear if it no longer exists
      if (selectedCountryId) {
        const selected = filtered.find((country) => country.id === selectedCountryId)
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
      setShippingError(t("unableToLoadCountries"))
    } finally {
      setIsLoadingCountries(false)
    }
  }, [selectedCountryId, t])

  useEffect(() => {
    fetchCountries()
  }, [fetchCountries])

  // Auto-fetch cities when country is selected/restored
  useEffect(() => {
    if (selectedCountryId && countries.length > 0) {
      const selected = countries.find((country) => country.id === selectedCountryId)
      const selectedCode = selected?.code || ""
      if (selectedCode === "AE" || selectedCode === "KW") {
        console.log("[CheckoutForm] 🔄 Auto-fetching cities for country:", selectedCountryId)
        fetchCities(selectedCountryId)
      } else {
        setCities([])
      }
    }
  }, [selectedCountryId, countries, fetchCities])

  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId)

    const selected = countries.find((country) => country.id === countryId)
    if (selected) {
      console.log("Secilen Olke Kodu:", selected.code)
      // Store ISO code so backend ShippingService matches (e.g., "KW" instead of country name)
      setShippingAddress((prev) => ({ ...prev, country: selected.code, city: "", state: "" }))
    } else {
      setShippingAddress((prev) => ({ ...prev, country: "", city: "", state: "" }))
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
      const selectedCode = selected?.code || ""
      if (selectedCode === "AE" || selectedCode === "KW") {
        fetchCities(countryId)
      }
    }
  }

  const handleCityChange = (value: string) => {
    handleInputChange("city", value)
  }

  const handleRegionChange = (value: string) => {
    handleInputChange("state", value)
  }

  const validateGuestStepOne = (): boolean => {
    const newErrors: ShippingErrors = {}

    if (!guestFullName.trim()) {
      newErrors.fullName = t("validationMessages.fullNameRequired")
    }
    if (!shippingAddress.email?.trim()) {
      newErrors.email = t("validationMessages.emailRequired")
    }
    if (!shippingAddress.phoneNumber?.trim()) {
      newErrors.phoneNumber = t("validationMessages.phoneRequired")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateForm = (): boolean => {
    const newErrors: ShippingErrors = {}

    if (isGuest) {
      if (!guestFullName.trim()) {
        newErrors.fullName = t("validationMessages.fullNameRequired")
      }
      if (!shippingAddress.email?.trim()) {
        newErrors.email = t("validationMessages.emailRequired")
      }
      if (!shippingAddress.phoneNumber?.trim()) {
        newErrors.phoneNumber = t("validationMessages.phoneRequired")
      }
    }

    if (!selectedCountryId) {
      newErrors.country = t("validationMessages.countryRequired")
    } else {
      const selected = countries.find((country) => country.id === selectedCountryId)
      const selectedCode = selected?.code || ""
      if (!shippingAddress.street.trim()) {
        newErrors.street = t("validationMessages.streetAddressRequired")
      }
      if (!shippingAddress.city.trim()) {
        newErrors.city = t("validationMessages.cityRequired")
      }
      if ((selectedCode === "AE" || selectedCode === "KW") && !shippingAddress.state.trim()) {
        newErrors.state = t("validationMessages.regionRequired")
      }
      if (!shippingAddress.email?.trim()) {
        newErrors.email = t("validationMessages.emailRequired")
      }
      if (!shippingAddress.phoneNumber?.trim()) {
        newErrors.phoneNumber = t("validationMessages.phoneRequired")
      }
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
      const authState = useAuthStore.getState()
      
      // CRITICAL CLEANUP: Clear any old guest basket ID when authenticated user proceeds to checkout
      if (authState.accessToken && typeof window !== "undefined") {
        localStorage.removeItem("df_guest_basket_id");
        console.log("[Checkout] ✅ Cleared any old guest basket ID - authenticated user proceeding");
      }
      
      console.log("📦 STORE STATE AT CHECKOUT:", {
        itemsCount: currentItems.length,
        itemNames: currentItems.map(i => i.name),
        hasAccessToken: !!authState.accessToken,
        hasUser: !!authState.user,
      })

      // Determine consistent basketId for entire function
      let basketId: string
      
      // v17 KEY FIX: Check for accessToken ONLY (not user?.id) - indicates authenticated state
      // user object may be null during hydration/page reload even with valid token
      const isAuthenticated = !!authState.accessToken
      
      if (isAuthenticated) {
        // FOR AUTHENTICATED USERS: NEVER use guest_ ID - ALWAYS fetch UUID from backend
        console.log("🔐 AUTHENTICATED USER DETECTED - Fetching UUID basket ID...");
        
        // v16 CRITICAL: Retry logic with backend sync wait
        let userBasketId: string | null = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        // Keep retrying until we get a valid UUID (not guest_)
        while (retryCount < maxRetries && !userBasketId) {
          retryCount++;
          
          if (retryCount > 1) {
            console.log(`⏱️ RETRY ${retryCount}/${maxRetries}: Waiting 2 seconds for backend sync...`);
            setPaymentError("Finalizing your secure basket...");
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          const candidateId = await authState.fetchAndStoreBasketId();
          
          if (candidateId && !candidateId.startsWith("guest_")) {
            // Valid UUID received
            userBasketId = candidateId;
            console.log(`✅ RETRY ${retryCount}: Got valid UUID:`, userBasketId);
          } else if (candidateId?.startsWith("guest_")) {
            console.warn(`⚠️ RETRY ${retryCount}: Backend still syncing (got guest_ ID):`, candidateId);
          } else {
            console.warn(`⚠️ RETRY ${retryCount}: Backend returned null, will retry...`);
          }
        }
        
        // After 3 retries, if still no UUID, redirect to cart
        if (!userBasketId) {
          console.error("❌ CRITICAL: Failed to get valid basketId after 3 retries. Redirecting to cart...");
          setPaymentError("Your basket is being prepared. Please refresh your cart and try again.");
          setIsInitializingPayment(false);
          
          // Redirect to cart page
          setTimeout(() => {
            if (typeof window !== "undefined") {
              window.location.href = "/cart";
            }
          }, 2000);
          return;
        }
        
        basketId = userBasketId;
        
        // Validate basketId is UUID format (final sanity check)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(basketId)) {
          console.error("❌ INVALID BASKET ID FORMAT:", basketId);
          throw new Error("Invalid basket ID. Please go back to your cart and try again.");
        }
        
        console.log("🔑 Using authenticated user basketId (UUID):", basketId);
        setPaymentError(null);  // Clear "Finalizing..." message
      } else {
        // For guests, generate ONCE and reuse throughout
        basketId = "guest_" + Math.random().toString(36).substring(2, 11);
        console.log("👤 GUEST MODE - Generated guest basketId:", basketId);
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
          throw new Error(t("failedSyncBasket"))
        }
      } else {
        console.warn("⚠️ EMPTY BASKET: No items to sync")
        throw new Error(t("emptyBasket"))
      }

      // STEP 2: RE-VALIDATE basketId 1 second before payment (ensure latest UUID for authenticated)
      console.log("⏱️ VALIDATION PAUSE: Waiting 1 second before order creation...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For authenticated users, force-refresh basketId one more time
      if (isAuthenticated) {
        console.log("🔄 RE-FETCHING basketId for authenticated user (final check)...");
        const freshBasketId = await authState.fetchAndStoreBasketId();
        
        if (freshBasketId && !freshBasketId.startsWith("guest_")) {
          basketId = freshBasketId;
          console.log("✅ Up-to-date basketId retrieved:", basketId);
        } else {
          console.warn("⚠️ Could not fetch fresh basketId, using previously validated one:", basketId);
        }
      }

      // STEP 3: Create order with same consistent basketId
      console.log("📋 PAYLOAD CHECK (BEFORE ORDER):", {
        basketId: basketId,
        itemsCount: currentItems.length,
        currency: currency.toUpperCase(),
        shippingAddress: shippingAddress,
        isAuthenticated: isAuthenticated,
      })

      // v17: AGGRESSIVE - Force populate user data in checkout payload
      // Get FRESH user data directly from Zustand store
      const freshAuthState = useAuthStore.getState();
      const freshUser = freshAuthState.user;
      
      console.log("[Checkout Debug] AUTH STATE USER (Closure):", authState.user);
      console.log("[Checkout Debug] AUTH STATE USER (Fresh from Zustand):", freshUser);
      console.log("[Checkout Debug] Is Authenticated:", isAuthenticated);
      console.log("[Checkout Debug] Access Token exists:", !!authState.accessToken);

      const finalShippingAddress = { ...shippingAddress };

      if (!finalShippingAddress.state?.trim()) {
        finalShippingAddress.state = finalShippingAddress.city
      }

      if (isGuest) {
        const { firstName, lastName } = splitFullName(guestFullName)
        finalShippingAddress.firstName = firstName
        finalShippingAddress.lastName = lastName || "-"
      }

      // AGGRESSIVE: Use FRESH user data from Zustand, not closure value
      // Account for nested user object structure
      if (isAuthenticated && freshUser) {
        // Extract data safely from nested structure (backend may return nested user object)
        const userObj = (freshUser as any)?.user || freshUser;
        const extractedFirstName = userObj?.firstName || freshUser?.firstName || "";
        const extractedLastName = userObj?.lastName || freshUser?.lastName || "";
        const extractedEmail = userObj?.email || freshUser?.email || "";

        console.log("[Checkout] 🔴 AGGRESSIVE POPULATION - Using fresh user data:", {
          firstName: extractedFirstName,
          lastName: extractedLastName,
          email: extractedEmail,
        });

        // Fill missing required fields (or OVERRIDE if empty)
        if (!finalShippingAddress.firstName?.trim()) {
          finalShippingAddress.firstName = extractedFirstName;
          console.log("[Checkout] 📝 Set firstName:", finalShippingAddress.firstName);
        }
        if (!finalShippingAddress.lastName?.trim()) {
          finalShippingAddress.lastName = extractedLastName;
          console.log("[Checkout] 📝 Set lastName:", finalShippingAddress.lastName);
        }
        if (!finalShippingAddress.email?.trim()) {
          finalShippingAddress.email = extractedEmail;
          console.log("[Checkout] 📝 Set email:", finalShippingAddress.email);
        }

        // Ensure phoneNumber is never empty for the API
        if (!finalShippingAddress.phoneNumber?.trim()) {
          finalShippingAddress.phoneNumber = "00000000";
          console.log("[Checkout] 📝 Set default phoneNumber:", finalShippingAddress.phoneNumber);
        }
      } else {
        console.warn("[Checkout] ⚠️ NOT populating user data - isAuthenticated:", isAuthenticated, "freshUser:", freshUser);
      }

      console.log("[Checkout] 🎯 FINAL PAYLOAD - ShippingAddress:", finalShippingAddress);

      const orderResponse = await apiFetch<{ id: string; clientSecret?: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          basketId: basketId,
          shippingAddress: finalShippingAddress,
          currency: currency.toUpperCase(),
          usePoints: usePoints,
          languageCode: locale,
        }),
      })

      console.log("✅ ORDER CREATED:", {
        orderId: orderResponse?.id,
        basketIdUsed: basketId,
        payloadShippingAddress: finalShippingAddress,
      })

      setOrderId(orderResponse?.id || null)

      // STEP 3: Check if payment is zero (rewards cover everything)
      // Calculate order total to determine if Stripe is needed
      const subtotal = total(currency)
      const selectedCountry = countries.find((country) => country.id === selectedCountryId)
      const rateObj = selectedCountry?.shippingRates.find((r) =>
        String(r.currency).toUpperCase() === currency.toUpperCase()
      )
      
      let shipping = rateObj?.cost ?? 0
      const isUAE = selectedCountry?.code === "AE"
      const freeShippingThreshold = currency === "USD" ? 55 : 200
      const qualifiesForFreeShipping = subtotal >= freeShippingThreshold && isUAE
      
      if (qualifiesForFreeShipping) {
        shipping = 0
      }
      
      const subtotalWithShipping = subtotal + shipping
      const rewardDiscount = usePoints ? Math.min(rewardBalance, subtotalWithShipping) : 0
      const calculatedOrderTotal = subtotalWithShipping - rewardDiscount
      const isZeroPayment = calculatedOrderTotal <= 0

      console.log("💰 PAYMENT CHECK:", {
        subtotal,
        shipping,
        subtotalWithShipping,
        rewardDiscount,
        calculatedOrderTotal,
        isZeroPayment,
      })

      // If order total is 0 (rewards cover everything), skip Stripe and redirect
      if (isZeroPayment) {
        console.log("🎉 ZERO PAYMENT ORDER - Skipping Stripe, redirecting to confirmation")
        useCartStore.getState().clearCart()
        setSuccessMessage(t("orderCreatedSuccess"))
        
        // Redirect directly to confirmation page
        if (typeof window !== "undefined") {
          window.location.href = `/orders/confirmation/${orderResponse?.id || ""}`
        }
        setIsInitializingPayment(false)
        return
      }

      // STEP 4: Get payment intent for non-zero payments
      let clientSecretValue: string | undefined

      console.log("🔍 FETCHING CLIENT SECRET...")

      if (orderResponse?.clientSecret) {
        clientSecretValue = orderResponse.clientSecret
        console.log("✅ CLIENT SECRET FROM ORDER RESPONSE (RAW STRING):", {
          clientSecret: clientSecretValue,
          type: typeof clientSecretValue,
          clientSecretExists: !!clientSecretValue,
          clientSecretLength: clientSecretValue?.length,
          clientSecretPrefix: clientSecretValue?.substring(0, 20) + "...",
          isValidFormat: clientSecretValue?.includes("_secret_"),
          timestamp: new Date().toISOString(),
        })
      } else {
        console.warn("⚠️ No clientSecret in orderResponse, fetching from /payments endpoint...")
        const paymentResponse = await apiFetch<{ clientSecret: string }>(`/payments/${basketId}`, {
          method: "POST",
        })
        clientSecretValue = paymentResponse?.clientSecret
        console.log("✅ CLIENT SECRET FROM PAYMENTS ENDPOINT (RAW STRING):", {
          clientSecret: clientSecretValue,
          type: typeof clientSecretValue,
          clientSecretExists: !!clientSecretValue,
          clientSecretLength: clientSecretValue?.length,
          clientSecretPrefix: clientSecretValue?.substring(0, 20) + "...",
          isValidFormat: clientSecretValue?.includes("_secret_"),
          timestamp: new Date().toISOString(),
        })
      }

      if (!clientSecretValue) {
        throw new Error("Missing client secret from payment intent")
      }

      // Verify it's a raw string, not JSON or other format
      if (typeof clientSecretValue !== "string") {
        console.error("❌ CLIENT SECRET IS NOT A STRING:", {
          type: typeof clientSecretValue,
          value: clientSecretValue,
        })
        throw new Error("Client secret must be a raw string")
      }

      if (!clientSecretValue.includes("_secret_")) {
        console.error("❌ INVALID CLIENT SECRET FORMAT:", {
          clientSecret: clientSecretValue,
          type: typeof clientSecretValue,
          length: clientSecretValue.length,
        })
        throw new Error("Invalid client secret format received from backend")
      }

      // NO string manipulation - passing raw string directly
      console.log("🎯 FINAL CLIENT SECRET (NO MANIPULATION - RAW STRING):", {
        clientSecret: clientSecretValue,
        type: typeof clientSecretValue,
        clientSecretExists: !!clientSecretValue,
        clientSecretLength: clientSecretValue.length,
        firstChars: clientSecretValue.substring(0, 30) + "...",
        orderId: orderResponse?.id,
        basketId: basketId,
        timestamp: new Date().toISOString(),
      })

      // Set the raw clientSecret directly without any manipulation
      setClientSecret(clientSecretValue)
      setIsPaymentModalOpen(true)
      setSuccessMessage(t("orderCreatedSuccess"))
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

    if (isGuest && guestStep === 1) {
      if (validateGuestStepOne()) {
        setGuestStep(2)
      }
      return
    }

    if (validateForm()) {
      await initializePayment()
    }
  }

  const subtotal = total(currency)
  const selectedCountry = countries.find((country) => country.id === selectedCountryId)
  const selectedCountryCode = selectedCountry?.code || ""
  const isRegionCountry = selectedCountryCode === "AE" || selectedCountryCode === "KW"
  // Find rate that matches current currency
  const rateObj = selectedCountry?.shippingRates.find((r) =>
    String(r.currency).toUpperCase() === currency.toUpperCase()
  )
  
  // FREE SHIPPING CAMPAIGN LOGIC
  // IF subtotal >= $200 USD (or 734 AED) AND country is UAE (AE), THEN shipping = 0
  let shipping = rateObj?.cost ?? 0
  const isUAE = selectedCountry?.code === "AE"
  const freeShippingThreshold = currency === "USD" ? 55 : 200 // 734 AED ≈ 200 USD at 3.67 rate
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold && isUAE
  
  if (qualifiesForFreeShipping) {
    shipping = 0
  }
  
  const subtotalWithShipping = subtotal + shipping
  
  // Calculate reward discount
  const rewardDiscount = usePoints ? Math.min(rewardBalance, subtotalWithShipping) : 0
  const orderTotal = subtotalWithShipping - rewardDiscount

  // Debug log
  console.log("📦 Checkout Pricing:", {
    subtotal,
    selectedCountry: selectedCountry?.name,
    countryCode: selectedCountry?.code,
    isUAE,
    freeShippingThreshold,
    qualifiesForFreeShipping,
    shipping,
    subtotalWithShipping,
    rewardDiscount,
    orderTotal,
    currency,
  })

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
                  <CardTitle className="text-2xl" style={{ color: '#4B2E2B' }}>{t("shippingAddress")}</CardTitle>
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

                {/* Guest Checkout */}
                {isGuest && guestStep === 1 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("guestCheckout")}</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 sm:col-span-2">
                        <label htmlFor="fullName" className="text-sm font-medium">
                          {t("fullName")}
                        </label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="John Doe"
                          value={guestFullName}
                          onChange={(e) => handleGuestFullNameChange(e.target.value)}
                          aria-invalid={!!errors.fullName}
                          className={`${errors.fullName ? "border-destructive" : ""} focus-visible:ring-[#1f6f78]/50 focus-visible:border-[#1f6f78]`}
                        />
                        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          {t("email")}
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
                          {t("phone")}
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

                    <div className="mt-4 flex justify-end">
                      <Button type="button" onClick={() => validateGuestStepOne() && setGuestStep(2)}>
                        {t("next")}
                      </Button>
                    </div>
                  </div>
                )}

                {(isGuest ? guestStep === 2 : true) && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="country" className="text-sm font-medium">
                        {t("country")}
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
                          <SelectValue placeholder={t("selectCountry")} />
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

                    {(!isGuest && selectedCountryId) || (isGuest && guestStep === 2) ? (
                      <>
                        <div className="space-y-2">
                          <label htmlFor="street" className="text-sm font-medium">
                            {t("address")}
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

                        {isRegionCountry && (
                          <div className="space-y-2">
                            <label htmlFor="region" className="text-sm font-medium">
                              {selectedCountryCode === "AE" ? t("emirate") : t("governorate")}
                            </label>
                            <Select
                              value={shippingAddress.state}
                              onValueChange={handleRegionChange}
                              disabled={!selectedCountryId || isLoadingCities}
                            >
                              <SelectTrigger
                                id="region"
                                className={`w-full ${errors.state ? "border-destructive" : ""}`}
                                aria-invalid={!!errors.state}
                                aria-busy={isLoadingCities}
                              >
                                <SelectValue
                                  placeholder={
                                    selectedCountryId
                                      ? selectedCountryCode === "AE"
                                        ? t("selectEmirate")
                                        : t("selectGovernorate")
                                      : t("selectCountryFirst")
                                  }
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
                            {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                          </div>
                        )}

                        <div className="space-y-2">
                          <label htmlFor="city" className="text-sm font-medium">
                            {t("city")}
                          </label>
                          <Input
                            id="city"
                            type="text"
                            placeholder="Dubai"
                            value={shippingAddress.city}
                            onChange={(e) => handleCityChange(e.target.value)}
                            aria-invalid={!!errors.city}
                            className={`${errors.city ? "border-destructive" : ""} focus-visible:ring-[#1f6f78]/50 focus-visible:border-[#1f6f78]`}
                          />
                          {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="postalCode" className="text-sm font-medium">
                              {t("postalCode")}
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

                          {!isGuest && (
                            <div className="space-y-2">
                              <label htmlFor="email" className="text-sm font-medium">
                                {t("email")}
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
                          )}
                        </div>

                        {!isGuest && (
                          <div className="space-y-2">
                            <label htmlFor="phoneNumber" className="text-sm font-medium">
                              {t("phone")}
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
                        )}

                        {isGuest && (
                          <div className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setGuestStep(1)}>
                              {t("back")}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg font-semibold"
              style={{ backgroundColor: '#2b1b13', color: '#fff' }}
              disabled={isInitializingPayment || (isGuest && guestStep === 1)}
            >
              {isInitializingPayment ? t("preparingPayment") : t("proceedToPayment")}
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
                <CardTitle className="text-2xl" style={{ color: '#4B2E2B' }}>{t("summary")}</CardTitle>
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
                    className={`flex gap-4 ${isArabic ? "flex-row-reverse" : ""}`}
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
                    <div className="flex-1 min-w-0" style={{ textAlign: isArabic ? "right" : "left" }}>
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("quantity")}: {item.quantity}
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
                  <span className="text-muted-foreground">
                    {t("shipping")} {shippingAddress.country && `(${shippingAddress.country})`}
                  </span>
                  <span className={`font-medium ${qualifiesForFreeShipping ? 'text-accent' : ''}`}>
                    {selectedCountryId ? (
                      qualifiesForFreeShipping ? (
                        <span className="flex items-center gap-2 justify-end">
                          <span className="line-through text-muted-foreground text-xs">
                            <FormattedPrice amount={rateObj?.cost ?? 0} />
                          </span>
                          <span className="font-bold" style={{ color: '#1f6f78' }}>FREE 🎉</span>
                        </span>
                      ) : (
                        <FormattedPrice amount={shipping} />
                      )
                    ) : (
                      t("selectCountry")
                    )}
                  </span>
                </div>

                {/* Free Shipping Info Banner */}
                {qualifiesForFreeShipping && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(31, 111, 120, 0.1)', borderColor: '#1f6f78' }}>
                    <p className="text-sm font-medium" style={{ color: '#1f6f78' }}>
                      {t("freeShippingMessage")}
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Subtotal with Shipping */}
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t("subtotal")}</span>
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
                          {t("usePoints", { points: rewardBalance.toFixed(2) })}
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-7">
                      {t("pointsAvailable", { points: rewardBalance.toFixed(2) })}
                    </p>
                  </div>
                )}

                {usePoints && rewardDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                    <span>{t("rewardDiscount")}</span>
                    <span>-<FormattedPrice amount={rewardDiscount} /></span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Total */}
                <div className="flex justify-between text-lg font-bold">
                  <span>{t("orderTotal")}</span>
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
        orderTotal={orderTotal}
        currency={currency}
        t={t}
      />
    </>
  )
}
