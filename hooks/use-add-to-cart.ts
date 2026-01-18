"use client"

import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { useAuthStore } from "@/lib/auth-store"
import { useCartStore } from "@/lib/cart-store"
import { getImageUrl } from "@/lib/utils"

export interface AddToCartProduct {
  id: string
  slug?: string
  name: string
  price: number
  images?: { imageUrl: string; isMain: boolean; id?: string }[]
}

export function useAddToCart() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { addItem } = useCartStore()

  const addToCart = (product: AddToCartProduct, quantity: number = 1) => {
    const isAuthenticated = !!accessToken

    if (!isAuthenticated) {
      toast.error("Please log in to shop")
      router.push("/auth/login")
      return
    }

    const imageUrl =
      product.images?.find((i) => i.isMain)?.imageUrl || product.images?.[0]?.imageUrl || ""

    addItem(
      {
        id: product.id,
        slug: product.slug ?? "",
        name: product.name,
        price: product.price,
        quantity,
        imageUrl,
      },
      isAuthenticated
    )

    toast.success("Added to basket!")
  }

  return { addToCart }
}
