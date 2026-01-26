import { apiFetch } from "../api-client";

export interface BasketItem {
  id?: string;              // Unique basket item id from backend (used for DELETE /basket/{itemId})
  productId: string;        // Backend uses 'productId', not 'id'
  productPriceId: string;   // Required for variant tracking
  productName: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl: string;
  weightLabel: string;      // Critical field for weight display
  grams: number;
  roastLevelId: string;     // Backend stacking key (now always returned)
  roastLevelName: string;   // Critical field for roast display
  grindTypeId: string;      // Backend stacking key (now always returned)
  grindTypeName: string;    // Critical field for grind display
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
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productPriceId: item.productPriceId,
          productName: item.productName,
          slug: item.slug,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          weightLabel: item.weightLabel,
          grams: item.grams,
          roastLevelId: item.roastLevelId || "00000000-0000-0000-0000-000000000000",
          roastLevelName: item.roastLevelName,
          grindTypeId: item.grindTypeId || "00000000-0000-0000-0000-000000000000",
          grindTypeName: item.grindTypeName,
        })),
      }),
    }),

  // Delete a single basket item by its unique itemId (API: DELETE /basket/{itemId})
  deleteBasketItem: (itemId: string) =>
    apiFetch<void>(`/basket/${itemId}`, { method: "DELETE" }),

  // Delete basket from backend
  deleteBasket: () => apiFetch<void>("/basket", { method: "DELETE" }),
};
