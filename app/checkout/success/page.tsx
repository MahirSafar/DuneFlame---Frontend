"use client"

import { useEffect } from "react"
import { CheckCircle2, Package, ArrowRight, Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCartStore } from "@/lib/cart-store"

export default function CheckoutSuccessPage() {
  // Ensure cart is completely empty when user lands on success page
  useEffect(() => {
    const cartItems = useCartStore.getState().items
    if (cartItems.length > 0) {
      console.warn("Cart not empty on success page, clearing now")
      useCartStore.getState().clearCart()
    }
  }, [])

  return (
    <div className="container max-w-2xl mx-auto py-16 px-4">
      <Card className="border-2 border-oasis-teal/20 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-24 h-24 rounded-full bg-oasis-teal/10 flex items-center justify-center animate-in zoom-in duration-500">
            <CheckCircle2 className="w-16 h-16 text-oasis-teal" strokeWidth={2.5} />
          </div>
          <div className="space-y-3">
            <CardTitle className="text-4xl font-bold text-oasis-teal dark:text-oasis-teal">
              Payment Successful!
            </CardTitle>
            <p className="text-muted-foreground text-lg">
              Your order has been placed successfully
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Confirmation Notice */}
          <div className="bg-dune-sand dark:bg-dune-sand/20 border border-dune-taupe dark:border-dune-taupe rounded-lg p-4 flex items-start gap-3">
            <Mail className="h-5 w-5 text-espresso-brown dark:text-flame-caramel mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-espresso-brown dark:text-dune-paper">
                Confirmation Email Sent
              </p>
              <p className="text-sm text-espresso-brown/80 dark:text-dune-paper/80 mt-1">
                A confirmation email with your order details will be sent to your registered email address shortly.
              </p>
            </div>
          </div>

          {/* What's Next Section */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              What's Next?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground ml-7">
              <li>• Check your email for order confirmation and receipt</li>
              <li>• Track your order status in your dashboard</li>
              <li>• Your coffee will be roasted fresh and shipped soon</li>
              <li>• Estimated delivery: 3-5 business days</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild className="flex-1" size="lg">
              <Link href="/dashboard" className="gap-2">
                <Package className="h-4 w-4" />
                View My Orders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link href="/products">
                Continue Shopping
              </Link>
            </Button>
          </div>

          {/* Support Link */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Need help?{" "}
              <Link href="/contact" className="text-accent hover:underline font-medium">
                Contact Support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
