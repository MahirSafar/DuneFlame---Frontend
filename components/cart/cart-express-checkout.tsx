"use client"

import { useCallback } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/routing"
import toast from "react-hot-toast"
import { ExpressCheckoutButton } from "@/components/payment/express-checkout-button"

interface CartExpressCheckoutProps {
  className?: string
}

/**
 * Cart Express Checkout Section
 * Displays the Apple Pay / Google Pay button above the standard checkout button
 */
export function CartExpressCheckout({ className = "" }: CartExpressCheckoutProps) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()

  const handleSuccess = useCallback(
    (orderId: string) => {
      toast.success(t("expressCheckout.paymentSuccess") || "Payment successful!")

      // Redirect to confirmation page (ExpressCheckoutButton also does this)
      router.push(`/orders/confirmation/${orderId}`)
    },
    [router, t]
  )

  const handleError = useCallback(
    (error: Error) => {
      toast.error(error.message || t("expressCheckout.paymentError") || "Payment failed")
    },
    [t]
  )

  return (
    <div className={`express-checkout-section ${className}`}>
      <div className="mb-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {t("expressCheckout.fastCheckout") || "Fast Checkout"}
        </p>
      </div>

      <ExpressCheckoutButton
        onSuccess={handleSuccess}
        onError={handleError}
        className="relative"
      />
    </div>
  )
}
