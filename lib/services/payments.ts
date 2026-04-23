import { apiFetch } from "@/lib/axios";

/**
 * Create a Stripe payment intent for the given basket.
 * Backend: POST /api/v1/payments/{basketId}
 * Returns the client secret for confirming the payment on the frontend.
 *
 * @param basketId - The authenticated user's basket ID (or "me")
 * @returns Stripe client secret
 */
export async function createPaymentIntent(basketId: string): Promise<string> {
  const response = await apiFetch<{ clientSecret: string }>(
    `/payments/${basketId}`,
    { method: "POST" }
  );

  if (!response.clientSecret) {
    throw new Error("Failed to create payment intent: No clientSecret in response");
  }

  return response.clientSecret;
}

/**
 * Handle the "Buy Now" flow for a basket.
 * Creates a payment intent and returns the client secret for Stripe confirmation.
 *
 * @param basketId - The authenticated user's basket ID (or "me")
 */
export async function handleBuyNow(basketId: string): Promise<string> {
  return createPaymentIntent(basketId);
}
