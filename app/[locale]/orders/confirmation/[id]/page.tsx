"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/routing"
import { useLocale, useTranslations } from "next-intl"
import confetti from "canvas-confetti"
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormattedPrice } from "@/components/currency/formatted-price"
import { apiFetch, setApiClientLocale } from "@/lib/api-client"
import { useCurrency } from "@/lib/currency-context"

interface OrderItem {
  id: string
  productId: string
  productName: string
  unitPrice: number
  price?: number
  quantity: number
}

interface ShippingAddress {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

interface OrderResponse {
  id: string
  customerId?: string
  createdAt?: string
  orderDate?: string
  status: string
  totalAmount: number
  currency?: string
  shippingAddress?: ShippingAddress | string
  items: OrderItem[]
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("orders.confirmation")
  const { currency } = useCurrency()
  const orderId = params.id as string
  const isArabic = locale === "ar"

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Order ID is missing")
        setIsLoading(false)
        return
      }

      try {
        const data = await apiFetch<OrderResponse>(`/orders/${orderId}`)
        setOrder(data)
        setIsLoading(false)

        // Ensure locale is set for product translation
        setApiClientLocale(locale)

        // Trigger confetti celebration
        const duration = 3000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

        const interval = window.setInterval(() => {
          const timeLeft = animationEnd - Date.now()

          if (timeLeft <= 0) {
            return clearInterval(interval)
          }

          const particleCount = 50 * (timeLeft / duration)

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          })
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          })
        }, 250)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order details")
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  // Refetch product names when order loads or locale changes to show translated product names
  useEffect(() => {
    const refreshProductNames = async () => {
      if (!order || !order.items || order.items.length === 0) {
        return
      }

      // Note: Product translation disabled due to endpoint availability issues
      // Using product names from stored order data
    }

    refreshProductNames()
  }, [order?.id, locale])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <p className="text-lg text-muted-foreground">{t("loadingDetails")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-6">
              <AlertCircle className="h-16 w-16 text-destructive" />
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">{t("orderNotFound")}</h1>
                <p className="text-muted-foreground">
                  {error || t("orderNotFoundDesc")}
                </p>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => router.push("/profile/orders")} variant="outline">
                  {t("viewYourOrders")}
                </Button>
                <Button onClick={() => router.push("/contact")} variant="default">
                  {t("contactSupport")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    const colorMap: { [key: string]: string } = {
      pending: '#e2a56e',
      paid: '#1f6f78',
      shipped: '#2b1b13',
      delivered: '#3e4b3a',
      cancelled: '#a3291c',
    }
    return colorMap[statusLower] || '#e2a56e'
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="space-y-8">
        {/* Success Header */}
        <Card className="border-oasis-teal bg-oasis-teal/5 dark:bg-oasis-teal/10">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <CheckCircle className="h-24 w-24 text-oasis-teal" strokeWidth={2} />
                <div className="absolute inset-0 h-24 w-24 bg-oasis-teal/20 rounded-full blur-xl animate-pulse" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-oasis-teal">{t("title")}</h1>
                <p className="text-lg text-muted-foreground">
                  {t("subtitle")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card style={{ backgroundColor: 'transparent', color: '#2b1b13' }}>
          <CardHeader>
            <CardTitle className="text-2xl" style={{ color: '#2b1b13' }}>{t("orderDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orderId")}</p>
                <p className="font-mono font-semibold text-lg">{order.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orderDate")}</p>
                <p className="font-semibold text-lg">
                  {order.createdAt || order.orderDate ? (
                    new Date(order.createdAt || order.orderDate || "").toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  ) : (
                    <span className="text-red-500">{t("dateNotAvailable")}</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("status")}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: getStatusColor(order.status) }}>
                  {t(`statuses.${order.status.toLowerCase()}`)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("totalAmount")}</p>
                <p className="font-bold text-2xl" style={{ color: '#2b1b13' }}>
                  <FormattedPrice amount={order.totalAmount} />
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-semibold text-lg mb-3">{t("shippingAddress")}</h3>
              <div className="text-muted-foreground space-y-1">
                {typeof order.shippingAddress === "string" ? (
                  // If shippingAddress is a string
                  <>
                    {order.shippingAddress && order.shippingAddress.trim() ? (
                      <p>{order.shippingAddress}</p>
                    ) : (
                      <p className="text-sm text-red-500">{t("shippingAddressNotAvailable")}</p>
                    )}
                  </>
                ) : (
                  // If shippingAddress is an object
                  <>
                    {order.shippingAddress?.street && <p>{order.shippingAddress.street}</p>}
                    {(order.shippingAddress?.city ||
                      order.shippingAddress?.state ||
                      order.shippingAddress?.postalCode) && (
                      <p>
                        {[
                          order.shippingAddress?.city,
                          order.shippingAddress?.state,
                          order.shippingAddress?.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {order.shippingAddress?.country && <p>{order.shippingAddress.country}</p>}
                    {!order.shippingAddress?.street &&
                      !order.shippingAddress?.city &&
                      !order.shippingAddress?.country && (
                        <p className="text-sm text-red-500">{t("shippingAddressNotAvailable")}</p>
                      )}
                  </>
                )}
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="border-t border-border pt-6">
                <h3 className="font-semibold text-lg mb-4">{t("orderItems")}</h3>
                <div className="space-y-4">
                  {order.items.map((item) => {
                    const itemPrice = item.unitPrice || item.price || 0
                    const itemQuantity = item.quantity || 1
                    const totalPrice = itemPrice * itemQuantity


                    return (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">{t("quantity")}: {itemQuantity}</p>
                        </div>
                        <p className="font-semibold">
                          {totalPrice > 0 ? (
                            <FormattedPrice amount={totalPrice} />
                          ) : (
                            <span className="text-red-500">Price unavailable</span>
                          )}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Confirmation Alert */}
        <Alert className="border-[#1f6f78]/50" style={{ backgroundColor: 'rgba(31, 111, 120, 0.1)' }}>
          <AlertCircle className="h-4 w-4" style={{ color: '#1f6f78' }} />
          <AlertDescription style={{ color: '#1f6f78' }}>
            {t("confirmationEmail")}
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => router.push("/dashboard")}
            className="flex-1 text-lg py-6 text-white"
            size="lg"
            style={{ backgroundColor: '#2b1b13' }}
          >
            {t("viewAllOrders")}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            onClick={() => router.push("/products")}
            variant="outline"
            className="flex-1 text-lg py-6"
            size="lg"
          >
            {t("continueShopping")}
          </Button>
        </div>
      </div>
    </div>
  )
}
