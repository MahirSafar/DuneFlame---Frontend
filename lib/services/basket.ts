import { apiFetch } from "../axios";

export interface BasketItem {
  id?: string;              // Unique basket item id from backend (used for DELETE /basket/{id}/{itemId})
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

// Request payload for updating basket (includes ID for guest baskets)
export interface UpdateBasketPayload {
  id: string;               // Basket ID (user.id or guest_xxxxx)
  items: BasketItem[];
  currencyCode?: string;    // Optional currency for order calculation
}

export const basketService = {
  // Fetch basket from Redis backend
  // URL: GET /api/v1/basket/{id} (where id is either user.id or guestBasketId)
  getBasket: (id: string) => apiFetch<CustomerBasketDto>(`/basket/${id}`, { 
    method: "GET",
  }),

  // Fetch authenticated user's basket using token
  // URL: GET /api/v1/basket/me (requires Bearer token)
  getBasketMe: (token: string) => apiFetch<CustomerBasketDto>(`/basket/me`, { 
    method: "GET",
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }),

  // Update basket on backend (replaces entire basket)
  // URL: POST /api/v1/basket (ID in body, not in URL)
  // Now accepts full basket object with ID to support guest baskets
  updateBasket: (payload: UpdateBasketPayload | BasketItem[]) => {
    // Support both old (array) and new (payload) formats for backward compatibility
    const basketPayload = Array.isArray(payload)
      ? {
          id: "client-update",
          items: payload,
        }
      : payload

    return apiFetch<CustomerBasketDto>(`/basket`, {
      method: "POST",
      body: JSON.stringify({
        id: basketPayload.id,
        items: basketPayload.items.map((item) => ({
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
    })
  },

  // Delete a single basket item by its unique itemId
  // URL: DELETE /api/v1/basket/{basketId}/{itemId}
  deleteBasketItem: (basketId: string, itemId: string) =>
    apiFetch<void>(`/basket/${basketId}/${itemId}`, { method: "DELETE" }),

  // Clear basket by sending empty items array
  // URL: POST /api/v1/basket (ID in body, not in URL)
  clearBasket: (basketId: string) =>
    apiFetch<CustomerBasketDto>(`/basket`, {
      method: "POST",
      body: JSON.stringify({ 
        id: basketId,
        items: [] 
      }),
    }),
};
