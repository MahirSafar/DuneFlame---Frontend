"use client"

import { useEffect, useState } from "react"
import ProductCard from "@/components/products/product-card"
import { getProducts, type ProductResponse } from "@/lib/services/products"

// Helper function to convert roast level number to descriptive text
const getRoastLevelText = (level: number): string => {
  if (level <= 3) return "Light"
  if (level <= 6) return "Medium"
  return "Dark"
}

export default function Trending() {
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts({ pageNumber: 1, pageSize: 4 })
      .then((res) => setProducts(res.items))
      .catch((err) => console.error("Failed to fetch trending products:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex justify-between items-center mb-12">
        <div>
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">Trending Now</span>
          <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-secondary mt-2">Customer Favorites</h2>
        </div>
        <a
          href="/products"
          className="text-accent font-semibold hover:gap-2 flex items-center gap-1 transition-smooth group"
        >
          View All
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-xl h-80 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            return (
              <ProductCard key={product.id} product={product} />
            )
          })}
        </div>
      )}
    </section>
  )
}
