import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PaymentCancelledPage() {
  const t = useTranslations("payment");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="glass rounded-2xl p-8 md:p-12 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <AlertCircle size={64} className="text-orange-500 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary dark:text-secondary">
            {t("cancelled.title") || "Payment Cancelled"}
          </h1>
          <p className="text-muted-foreground">
            {t("cancelled.description") || "Your payment has been cancelled. No charges have been made to your account."}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("cancelled.message") || "You can try again or continue browsing our products."}
        </p>

        <div className="space-y-3 pt-4">
          <Link
            href="/products"
            className="block w-full px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg transition-smooth glow-accent"
          >
            {t("cancelled.back_to_products") || "Back to Products"}
          </Link>
          <Link
            href="/cart"
            className="block w-full px-6 py-3 bg-secondary/20 hover:bg-secondary/30 text-foreground font-bold rounded-lg transition-smooth"
          >
            {t("cancelled.view_cart") || "View Cart"}
          </Link>
        </div>

        <p className="text-xs text-muted-foreground pt-4">
          {t("cancelled.support") || "If you need help, please"}
          {" "}
          <Link href="/contact" className="text-accent hover:underline font-semibold">
            {t("cancelled.contact_us") || "contact us"}
          </Link>
        </p>
      </div>
    </div>
  );
}
