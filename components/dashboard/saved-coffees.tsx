"use client"

import { Heart } from "lucide-react"
import ProductCard from "@/components/products/product-card"
import type { ProductResponse } from "@/lib/services/products"

const TODAY_ISO = new Date().toISOString()

const SAVED_ITEMS: ProductResponse[] = [
  {
    id: "1",
    slug: "ethiopian-yirgacheffe",
    name: "Ethiopian Yirgacheffe",
    description: "Floral and tea-like with citrus brightness.",
    stockInKg: 0,
    isActive: true,
    categoryId: "signature",
    categoryName: "Signature",
    availablePrices: [
      { productPriceId: "1-250", weightLabel: "250g", grams: 250, price: 24 },
      { productPriceId: "1-1000", weightLabel: "1kg", grams: 1000, price: 82 },
    ],
    roastLevelNames: ["Light"],
    roastLevelIds: ["light"],
    grindTypeNames: ["Whole Bean", "Filter"],
    grindTypeIds: ["whole", "filter"],
    createdAt: TODAY_ISO,
    updatedAt: TODAY_ISO,
    images: [],
    originName: "Ethiopia",
  },
  {
    id: "4",
    slug: "kenya-peaberry",
    name: "Kenya Peaberry",
    description: "Juicy berry sweetness with a wine-like finish.",
    stockInKg: 0,
    isActive: true,
    categoryId: "signature",
    categoryName: "Signature",
    availablePrices: [
      { productPriceId: "4-250", weightLabel: "250g", grams: 250, price: 28 },
      { productPriceId: "4-1000", weightLabel: "1kg", grams: 1000, price: 96 },
    ],
    roastLevelNames: ["Medium"],
    roastLevelIds: ["medium"],
    grindTypeNames: ["Whole Bean", "Espresso"],
    grindTypeIds: ["whole", "espresso"],
    createdAt: TODAY_ISO,
    updatedAt: TODAY_ISO,
    images: [],
    originName: "Kenya",
  },
]

export default function SavedCoffees() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="text-accent" size={24} />
        <h3 className="text-xl font-bold text-primary dark:text-secondary">Saved Coffees</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {SAVED_ITEMS.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </div>
  )
}
