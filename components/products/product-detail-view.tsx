"use client"

import { motion } from "framer-motion"
import { useMemo, useState } from "react"
import { Leaf, ShoppingCart, Sparkles } from "lucide-react"
import type { ProductResponse } from "@/lib/services/products"
import { useAddToCart } from "@/hooks/use-add-to-cart"
import { getImageUrl } from "@/lib/utils"

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

interface ProductDetailViewProps {
  product: ProductResponse
}

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const { addToCart } = useAddToCart()
  const [quantity, setQuantity] = useState(1)
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>(
    product.images?.find((image) => image.isMain)?.id || product.images?.[0]?.id,
  )

  const mainImage = useMemo(
    () => {
      const rawUrl =
        product.images?.find((image) => image.id === selectedImageId)?.imageUrl ||
        product.images?.find((image) => image.isMain)?.imageUrl ||
        product.images?.[0]?.imageUrl
      return getImageUrl(rawUrl)
    },
    [product.images, selectedImageId],
  )

  const galleryImages = useMemo(() => product.images?.filter((img) => img.imageUrl) ?? [], [product.images])

  const handleAddToCart = () => {
    addToCart(product, quantity)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="grid gap-10 lg:grid-cols-[1.05fr_1fr]"
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background via-background/60 to-background/30 shadow-[0_25px_80px_-40px_rgba(0,0,0,0.55)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_30%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-secondary/10" />

        {mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <motion.img
            src={mainImage}
            alt={product.name}
            loading="lazy"
            className="relative z-10 h-full w-full object-cover"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ) : (
          <div className="relative z-10 flex h-full min-h-[420px] items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200 text-8xl dark:from-amber-900 dark:to-orange-900">
            ☕
          </div>
        )}

        <div className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white backdrop-blur">
          <Sparkles size={14} />
          Artisan Roast
        </div>
        <div className="absolute right-6 bottom-6 z-20 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white backdrop-blur">
          {product.stockQuantity > 0 ? "In stock" : "Limited"}
        </div>

        {galleryImages.length > 1 && (
          <div className="absolute bottom-6 left-6 right-6 z-20 flex gap-2">
            {galleryImages.map((image) => (
              <motion.button
                key={image.id}
                onClick={() => setSelectedImageId(image.id)}
                whileHover={{ scale: 1.05 }}
                className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                  selectedImageId === image.id ? "border-accent" : "border-white/20 hover:border-white/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getImageUrl(image.imageUrl) || ""} alt="Product thumbnail" className="h-full w-full object-cover" />
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {product.categoryName || "Signature"}
            </span>
            <div className="flex items-center gap-2">
              <Leaf size={14} className="text-accent" />
              <span>{product.originName || "DuneFlame Reserve"}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold leading-tight text-primary dark:text-secondary md:text-5xl">{product.name}</h1>
              <p className="mt-2 text-base text-muted-foreground md:text-lg">{product.description}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 px-4 py-3 text-right shadow-inner">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Starting at</p>
              <p className="text-3xl font-semibold text-primary dark:text-secondary">{currency.format(product.price)}</p>
              <p className="text-xs text-muted-foreground">Taxes included</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="glass rounded-2xl border border-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Roast Level</p>
            <p className="mt-1 text-lg font-semibold text-primary dark:text-secondary">
              {product.roastLevel ? `${product.roastLevel}/10` : "Balanced"}
            </p>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 10 }).map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 w-4 rounded-full ${index < (product.roastLevel ?? 6) ? "bg-accent" : "bg-muted"}`}
                />
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl border border-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Flavor Notes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(product.flavorNotes?.split(",") || ["Caramel", "Cocoa", "Citrus"])
                .map((note) => note.trim())
                .filter(Boolean)
                .map((note) => (
                  <span
                    key={note}
                    className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent shadow-[0_10px_30px_-15px_rgba(0,0,0,0.4)]"
                  >
                    {note}
                  </span>
                ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Crafted for indulgent mornings</p>
              <p className="text-2xl font-bold text-primary dark:text-secondary">{currency.format(product.price * quantity)}</p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-background/60 px-3 py-2 shadow-inner">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="h-10 w-10 rounded-full border border-white/20 bg-white/5 text-lg font-bold transition hover:border-accent hover:bg-accent/10"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-[2.5rem] text-center text-lg font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="h-10 w-10 rounded-full border border-white/20 bg-white/5 text-lg font-bold transition hover:border-accent hover:bg-accent/10"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stockQuantity <= 0}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-orange-500 px-6 py-4 text-lg font-semibold text-accent-foreground shadow-[0_20px_60px_-30px_rgba(255,115,29,0.8)] transition hover:shadow-[0_20px_60px_-22px_rgba(255,115,29,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <ShoppingCart size={20} />
            Add to Basket
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
              <Sparkles size={14} className="text-accent" />
              Free 2-day shipping on orders over $50
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
              <Leaf size={14} className="text-accent" />
              Sustainable sourcing guaranteed
            </span>
          </div>
        </div>
      </motion.div>
    </motion.section>
  )
}
