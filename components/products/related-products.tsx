"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import type { ProductResponse } from "@/lib/services/products"
import { getProducts } from "@/lib/services/products"
import ProductCard from "./product-card"
import { useTranslations } from "next-intl"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface RelatedProductsProps {
  categoryId: string
  currentProductId: string
}

export default function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('products')

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

        const filtered = (response.items || []).filter((product) => product.id !== currentProductId).slice(0, 8)
        setProducts(filtered)
      } catch (err) {
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
        <div className="flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass aspect-square w-72 flex-none rounded-xl animate-pulse" />
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
        <h2 className="font-heading text-[24px] font-bold text-primary dark:text-secondary uppercase">{t('youMayAlsoLike')}</h2>
        <p className="text-muted-foreground">{t('relatedRecommendations')}</p>
      </div>

      <Carousel
        opts={{ align: "start", loop: false }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4 hidden sm:flex" />
        <CarouselNext className="-right-4 hidden sm:flex" />
      </Carousel>
    </motion.section>
  )
}
