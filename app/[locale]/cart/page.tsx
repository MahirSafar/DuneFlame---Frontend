import { useTranslations } from "next-intl"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import CartSummary from "@/components/cart/cart-summary"
import CartRecommendations from "@/components/cart/cart-recommendations"

export default function CartPage() {
  const t = useTranslations("cart")

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="font-bold uppercase" style={{ fontSize: '24px', color: '#2b1b13', fontFamily: '"DIN 2014", sans-serif' }}>{t('title')}</h1>
          </div>

          <CartSummary />
          <CartRecommendations />
        </div>
      </div>
      <Footer />
    </main>
  )
}
