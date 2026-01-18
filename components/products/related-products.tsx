"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import type { PagedResult, Product } from "@/lib/services/products"
import { getProducts } from "@/lib/services/products"
import ProductCard from "./product-card"

interface RelatedProductsProps {
  categoryId: string
  currentProductId: string
}

export default function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await getProducts({
          categoryId,
          pageSize: 8,
          pageNumber: 1,
        })

        // Filter out the current product and limit to 4 items
        const filtered = (response.items || []).filter((product) => product.id !== currentProductId).slice(0, 4)

        setProducts(filtered)
      } catch (err) {
        console.error("Failed to fetch related products:", err)
        setError("Could not load related products")
      } finally {
        setLoading(false)
      }
    }

    if (categoryId) {
      fetchRelatedProducts()
    }
  }, [categoryId, currentProductId])

  if (loading) {
    return (
      <section className="space-y-6 border-t border-white/10 pt-12">
        <div className="space-y-2">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted/60" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass aspect-square rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (error || products.length === 0) {
    return null
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      viewport={{ once: true, margin: "-100px" }}
      className="space-y-6 border-t border-white/10 pt-12"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-primary dark:text-secondary">You May Also Like</h2>
        <p className="text-muted-foreground">Explore more from this collection</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <ProductCard
              id={product.id}
              name={product.name}
              price={product.price}
              images={product.images}
              roastLevel={product.roastLevel ? `Level ${product.roastLevel}` : "Medium"}
              origin={product.originName || product.categoryName || "DuneFlame"}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
