import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import CartSummary from "@/components/cart/cart-summary"

export default function CartPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="font-bold uppercase" style={{ fontSize: '24px', color: '#2b1b13', fontFamily: '"DIN 2014", sans-serif' }}>Your Cart</h1>
          </div>

          <CartSummary />
        </div>
      </div>
      <Footer />
    </main>
  )
}
