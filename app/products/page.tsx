"use client"

import { useEffect, useState } from "react"
import { Search, ChevronDown } from "lucide-react"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import Newsletter from "@/components/home/newsletter"
import ProductCard from "@/components/products/product-card"
import FilterSidebar, { type FilterState } from "@/components/products/filter-sidebar"
import { getProducts, type ProductResponse } from "@/lib/services/products"
import { useDebounce } from "@/hooks/use-debounce"
import { Input } from "@/components/ui/input"

export default function ProductsPage() {
  const [filters, setFilters] = useState<FilterState>({
    roastLevel: [],
    originIds: [],
    categoryIds: [],
    priceRange: [0, 100],
  })
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 500)
  const [sortBy, setSortBy] = useState("")

  const [products, setProducts] = useState<ProductResponse[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const params: any = {
      pageNumber: 1,
      pageSize: 100,
    }

    if (debouncedSearch) params.search = debouncedSearch
    if (sortBy) params.sort = sortBy
    
    // Always send price range
    params.minPrice = filters.priceRange[0]
    params.maxPrice = filters.priceRange[1]

    getProducts(params)
      .then((res) => {
        if (!cancelled) {
          // Calculate min and max prices from all items
          if (res.items.length > 0) {
            const prices = res.items.map(p => p.price)
            const calculatedMin = Math.floor(Math.min(...prices))
            const calculatedMax = Math.ceil(Math.max(...prices))
            setMinPrice(calculatedMin)
            setMaxPrice(calculatedMax)
            
            // Update filter ranges if they're at default values
            if (filters.priceRange[0] === 0 && filters.priceRange[1] === 100) {
              setFilters(prev => ({
                ...prev,
                priceRange: [calculatedMin, calculatedMax]
              }))
            }
          }
          
          let filteredItems = res.items
          
          // Client-side filtering for multiple selections
          if (filters.categoryIds.length > 0) {
            filteredItems = filteredItems.filter(p => filters.categoryIds.includes(p.categoryId))
          }
          
          if (filters.originIds.length > 0) {
            filteredItems = filteredItems.filter(p => p.originId && filters.originIds.includes(p.originId))
          }
          
          if (filters.roastLevel.length > 0) {
            filteredItems = filteredItems.filter(p => filters.roastLevel.includes(p.roastLevel))
          }
          
          // Client-side price range filtering as fallback
          filteredItems = filteredItems.filter(p => 
            p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
          )
          
          // Client-side sorting as fallback
          if (sortBy) {
            filteredItems = [...filteredItems].sort((a, b) => {
              switch (sortBy) {
                case 'price':
                  return a.price - b.price
                case 'price_desc':
                  return b.price - a.price
                case 'name':
                  return a.name.localeCompare(b.name)
                case 'name_desc':
                  return b.name.localeCompare(a.name)
                case 'createdAt_desc':
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                default:
                  return 0
              }
            })
          }
          
          setProducts(filteredItems)
          setTotalCount(filteredItems.length)
        }
      })
      .catch((e: any) => {
        if (!cancelled) {
          console.error("Failed to load products:", e)
          setError(e?.message || "Failed to load products")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters, debouncedSearch, sortBy])

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary dark:text-secondary">Our Collection</h1>
            <p className="text-muted-foreground mt-2">Discover premium coffee from around the world</p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <FilterSidebar onFilterChange={setFilters} minPrice={minPrice} maxPrice={maxPrice} />
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-8">
                <p className="text-sm text-muted-foreground">
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      Showing <span className="font-semibold">{products.length}</span> of{" "}
                      <span className="font-semibold">{totalCount}</span> products
                    </>
                  )}
                </p>
                <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted transition-smooth focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer min-w-[180px]"
                  >
                    <option value="">Default</option>
                    <option value="price">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                    <option value="name_desc">Name: Z to A</option>
                    <option value="createdAt_desc">Newest First</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" size={16} />
                </div>
              </div>

              {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="glass rounded-xl p-4 animate-pulse">
                      <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              )}
              
              {error && !loading && (
                <div className="glass rounded-xl p-12 text-center">
                  <p className="text-destructive">{error}</p>
                </div>
              )}
              
              {!loading && !error && products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p) => (
                    <ProductCard
                      key={p.id}
                      id={p.id}
                      slug={p.slug}
                      name={p.name}
                      price={p.price}
                      images={p.images}
                      roastLevel={""}
                      origin={p.originName || p.categoryName || ""}
                    />
                  ))}
                </div>
              ) : !loading && !error ? (
                <div className="glass rounded-xl p-12 text-center">
                  <p className="text-muted-foreground">No products found matching your filters.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <Newsletter />
      </div>
      <Footer />
    </main>
  )
}