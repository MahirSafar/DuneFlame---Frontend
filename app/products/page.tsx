"use client"

import { useEffect, useMemo, useState } from "react"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import ProductCard from "@/components/products/product-card"
import FilterSidebar, { type FilterState } from "@/components/products/filter-sidebar"
import { getProducts, type ProductResponse } from "@/lib/services/products"

export default function ProductsPage() {
  const [filters, setFilters] = useState<FilterState>({
    roastLevel: [],
    origin: [],
    priceRange: [0, 100],
  })

  const [products, setProducts] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getProducts({ page: 1, size: 12 })
      .then((res) => {
        if (!cancelled) setProducts(res.items)
      })
      .catch((e: any) => !cancelled && setError(e?.message || "Failed to load products"))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Check roast level filter
      // Not available from API; skip or map if needed
      if (filters.roastLevel.length > 0) {
        return false
      }

      // Check origin filter
      if (filters.origin.length > 0) {
        return false
      }

      // Check price range
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false
      }

      return true
    })
  }, [filters, products])

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary dark:text-secondary">Our Collection</h1>
            <p className="text-muted-foreground mt-2">Discover premium coffee from around the world</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <FilterSidebar onFilterChange={setFilters} />
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-8">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold">{filteredProducts.length}</span> products
                </p>
                <select className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted transition-smooth focus:outline-none focus:ring-2 focus:ring-accent">
                  <option>Newest</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Best Sellers</option>
                </select>
              </div>

              {loading && (
                <div className="glass rounded-xl p-12 text-center">
                  <p className="text-muted-foreground">Loading products...</p>
                </div>
              )}
              {error && !loading && (
                <div className="glass rounded-xl p-12 text-center">
                  <p className="text-destructive">{error}</p>
                </div>
              )}
              {!loading && !error && filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((p) => {
                    const mainImage = p.images?.find((i) => i.isMain)?.imageUrl || p.images?.[0]?.imageUrl || "";
                    return (
                      <ProductCard
                        key={p.id}
                        id={p.id}
                        name={p.name}
                        price={p.price}
                        image={mainImage}
                        roastLevel={""}
                        origin={p.categoryName || ""}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="glass rounded-xl p-12 text-center">
                  <p className="text-muted-foreground">No products found matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
