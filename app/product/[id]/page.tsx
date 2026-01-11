import { notFound } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import ProductDetailApi from "@/components/products/product-detail-api"
import { getProduct } from "@/lib/services/products"

export default async function ProductPage({ params }: { params: { id: string } }) {
  let product: Awaited<ReturnType<typeof getProduct>> | null = null
  try {
    product = await getProduct(params.id)
  } catch (e) {
    notFound()
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <a
            href="/products"
            className="text-accent hover:text-accent/80 font-semibold mb-8 inline-block transition-smooth"
          >
            ← Back to Products
          </a>
          {product && <ProductDetailApi product={product} />}
        </div>
      </div>
      <Footer />
    </main>
  )
}
