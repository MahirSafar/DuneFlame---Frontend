"use client"

import ProductCard from "@/components/products/product-card"

const TRENDING_PRODUCTS = [
  {
    id: "1",
    name: "Ethiopian Yirgacheffe",
    price: 24,
    roastLevel: "Light",
    origin: "Ethiopia",
  },
  {
    id: "2",
    name: "Colombian Supremo",
    price: 22,
    roastLevel: "Medium",
    origin: "Colombia",
  },
  {
    id: "3",
    name: "Brazilian Santos",
    price: 20,
    roastLevel: "Dark",
    origin: "Brazil",
  },
  {
    id: "4",
    name: "Kenya Peaberry",
    price: 28,
    roastLevel: "Medium",
    origin: "Kenya",
  },
]

export default function Trending() {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {TRENDING_PRODUCTS.map((product) => (
          <ProductCard key={product.id} {...product} images={[]} />
        ))}
      </div>
    </section>
  )
}
