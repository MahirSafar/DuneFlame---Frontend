import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PaymentSuccessPage() {
  const t = useTranslations("payment");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="glass rounded-2xl p-8 md:p-12 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle size={64} className="text-green-500 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary dark:text-secondary">
            {t("success.title") || "Payment Successful!"}
          </h1>
          <p className="text-muted-foreground">
            {t("success.description") || "Your payment has been processed successfully. Thank you for your purchase!"}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("success.confirmation") || "A confirmation email has been sent to your registered email address."}
        </p>

        <div className="space-y-3 pt-4">
          <Link
            href="/dashboard"
            className="block w-full px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg transition-smooth glow-accent"
          >
            {t("success.view_orders") || "View My Orders"}
          </Link>
          <Link
            href="/products"
            className="block w-full px-6 py-3 bg-secondary/20 hover:bg-secondary/30 text-foreground font-bold rounded-lg transition-smooth"
          >
            {t("success.continue_shopping") || "Continue Shopping"}
          </Link>
        </div>

        <p className="text-xs text-muted-foreground pt-4">
          {t("success.order_id") || "Order ID"}:{" "}
          <span className="font-mono font-semibold">
            {typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("session_id")?.slice(0, 8)
              : ""}
          </span>
        </p>
      </div>
    </div>
  );
}
