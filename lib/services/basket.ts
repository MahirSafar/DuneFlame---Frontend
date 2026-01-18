import { apiFetch } from "../api-client";

export interface BasketItem {
  productId: string;
  productName: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface CustomerBasketDto {
  id: string;
  customerId: string;
  items: BasketItem[];
  createdAt?: string;
  updatedAt?: string;
}

export const basketService = {
  // Fetch basket from Redis backend
  getBasket: () => apiFetch<CustomerBasketDto>("/basket"),

  // Update basket on backend (replaces entire basket)
  updateBasket: (items: BasketItem[]) =>
    apiFetch<CustomerBasketDto>("/basket", {
      method: "POST",
      body: JSON.stringify({ 
        id: "client-update",
        items: items 
      }),
    }),

  // Delete basket from backend
  deleteBasket: () => apiFetch<void>("/basket", { method: "DELETE" }),
};
