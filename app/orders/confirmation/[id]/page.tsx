"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import confetti from "canvas-confetti"
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormattedPrice } from "@/components/currency/formatted-price"
import { apiFetch } from "@/lib/api-client"
import { useCurrency } from "@/lib/currency-context"

interface OrderItem {
  id: string
  productId: string
  productName: string
  price: number
  quantity: number
  imageUrl?: string
}

interface ShippingAddress {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface OrderResponse {
  id: string
  customerId: string
  orderDate: string
  status: string
  totalAmount: number
  currency: string
  shippingAddress: ShippingAddress
  items: OrderItem[]
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const { currency } = useCurrency()
  const orderId = params.id as string

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
        console.error("Failed to fetch order:", err)
        setError(err instanceof Error ? err.message : "Failed to load order details")
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <p className="text-lg text-muted-foreground">Loading your order details...</p>
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
                <h1 className="text-2xl font-bold">Order Not Found</h1>
                <p className="text-muted-foreground">
                  {error || "We couldn't find the order you're looking for."}
                </p>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => router.push("/profile/orders")} variant="outline">
                  View Your Orders
                </Button>
                <Button onClick={() => router.push("/contact")} variant="default">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { shippingAddress } = order

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
                <h1 className="text-4xl font-bold text-oasis-teal">Thank You for Your Order!</h1>
                <p className="text-lg text-muted-foreground">
                  Your order has been successfully placed and is being processed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono font-semibold text-lg">{order.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-semibold text-lg">
                  {new Date(order.orderDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                  {order.status}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-bold text-2xl text-accent">
                  <FormattedPrice amount={order.totalAmount} />
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-semibold text-lg mb-3">Shipping Address</h3>
              <div className="text-muted-foreground space-y-1">
                <p>{shippingAddress.street}</p>
                <p>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                </p>
                <p>{shippingAddress.country}</p>
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="border-t border-border pt-6">
                <h3 className="font-semibold text-lg mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">
                        <FormattedPrice amount={item.price * item.quantity} />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Confirmation Alert */}
        <Alert className="border-blue-500/50 bg-blue-500/5">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            A confirmation email has been sent to your registered email address with order details and
            tracking information.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => router.push("/profile/orders")}
            className="flex-1 text-lg py-6"
            size="lg"
          >
            View All Orders
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            onClick={() => router.push("/products")}
            variant="outline"
            className="flex-1 text-lg py-6"
            size="lg"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  )
}
