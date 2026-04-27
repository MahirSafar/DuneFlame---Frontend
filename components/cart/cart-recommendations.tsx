"use client"

import { motion } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import { useCartStore } from "@/lib/cart-store"
import type { ProductResponse } from "@/lib/services/products"
import { getProducts } from "@/lib/services/products"
import ProductCard from "@/components/products/product-card"
import { useTranslations } from "next-intl"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

function SkeletonCard() {
  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col h-full">
      <div className="h-64 bg-muted animate-pulse" />
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-3 w-1/2 bg-muted/60 animate-pulse rounded mt-1" />
        <div className="mt-auto pt-3 h-8 w-full bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  )
}

export default function CartRecommendations() {
  const cartItems = useCartStore((state) => state.items)
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const t = useTranslations("products")

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        setError(null)
        if (cartItems.length === 0) return

        const response = await getProducts({ pageSize: 8, pageNumber: 1 })
        const cartItemIds = new Set(cartItems.map((item) => item.id))
        const filtered = (response.items || [])
          .filter((product) => !cartItemIds.has(product.id))
          .slice(0, 8)
        setProducts(filtered)
      } catch {
        setError("Could not load recommendations")
      } finally {
        setLoading(false)
      }
    }

    if (cartItems.length > 0) fetchRecommendations()
  }, [cartItems])

  useEffect(() => {
    if (!api) return
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on("select", onSelect)
    return () => { api.off("select", onSelect) }
  }, [api])

  const scrollTo = useCallback((index: number) => api?.scrollTo(index), [api])

  if (loading) {
    return (
      <section className="space-y-5 border-t border-white/10 pt-12 mt-12">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-24 animate-pulse rounded-full bg-accent/20" />
            <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-80 animate-pulse rounded bg-muted/60" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[82%] sm:w-[46%] lg:w-[31%] xl:w-1/4 shrink-0">
              <SkeletonCard />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error || products.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      viewport={{ once: true, margin: "-80px" }}
      className="space-y-5 border-t border-white/10 pt-12 mt-12"
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Discover
          </span>
          <h2 className="font-heading text-[24px] font-bold text-primary dark:text-secondary uppercase leading-tight">
            {t("youMayAlsoLike")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("recommendations")}</p>
        </div>

        {count > 1 && (
          <div className="hidden sm:flex items-center gap-2 shrink-0 pb-1">
            <button
              onClick={() => api?.scrollPrev()}
              disabled={current === 0}
              aria-label="Previous"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background/80 hover:bg-accent/10 hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-muted-foreground w-10 text-center tabular-nums">
              {current + 1} / {count}
            </span>
            <button
              onClick={() => api?.scrollNext()}
              disabled={current === count - 1}
              aria-label="Next"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background/80 hover:bg-accent/10 hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Carousel ───────────────────────────────────── */}
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: false, dragFree: false }}
        className="w-full cursor-grab active:cursor-grabbing"
      >
        <CarouselContent className="-ml-4">
          {products.map((product, index) => (
            <CarouselItem
              key={product.id}
              className="pl-4 basis-[82%] sm:basis-[46%] lg:basis-[31%] xl:basis-[31%] h-full"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.07, 0.3), ease: "easeOut" }}
                viewport={{ once: true }}
                className="h-full"
              >
                <ProductCard product={product} />
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* ── Dot indicators ─────────────────────────────── */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-300 ease-out",
                i === current
                  ? "w-5 h-1.5 bg-accent"
                  : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              )}
            />
          ))}
        </div>
      )}
    </motion.section>
  )
}
