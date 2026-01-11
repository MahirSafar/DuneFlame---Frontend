import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import CheckoutForm from "@/components/checkout/checkout-form"

export default function CheckoutPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary dark:text-secondary">Checkout</h1>
            <p className="text-muted-foreground mt-2">Complete your DuneFlame order</p>
          </div>

          <CheckoutForm />
        </div>
      </div>
      <Footer />
    </main>
  )
}
