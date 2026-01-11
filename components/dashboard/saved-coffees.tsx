"use client"

import { Heart } from "lucide-react"
import ProductCard from "@/components/products/product-card"

const SAVED_ITEMS = [
  {
    id: "1",
    name: "Ethiopian Yirgacheffe",
    price: 24,
    roastLevel: "Light",
    origin: "Ethiopia",
    image: "coffee-1",
  },
  {
    id: "4",
    name: "Kenya Peaberry",
    price: 28,
    roastLevel: "Medium",
    origin: "Kenya",
    image: "coffee-4",
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
          <ProductCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  )
}
