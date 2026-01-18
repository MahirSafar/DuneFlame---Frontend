import Link from "next/link"
import { notFound } from "next/navigation"
import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"
import Newsletter from "@/components/home/newsletter"
import ProductDetailView from "@/components/products/product-detail-view"
import RelatedProducts from "@/components/products/related-products"
import type { ApiError } from "@/lib/api-client"
import { getProduct, type ProductResponse } from "@/lib/services/products"

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let product: ProductResponse | null = null
  try {
    product = await getProduct(slug)
  } catch (error) {
    const status = (error as ApiError | undefined)?.status
    if (status === 404) {
      notFound()
    }
    throw error
  }

  if (!product) {
    notFound()
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/70">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/products"
            className="text-accent hover:text-accent/80 font-semibold mb-8 inline-flex items-center gap-2 transition-smooth"
          >
            <span aria-hidden>←</span> Back to Products
          </Link>
          {product && <ProductDetailView product={product} />}
          {product.categoryId && <RelatedProducts categoryId={product.categoryId} currentProductId={product.id} />}
        </div>
        <Newsletter />
      </div>
      <Footer />
    </main>
  )
}
