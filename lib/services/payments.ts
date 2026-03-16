import { apiFetch } from "@/lib/api-client";
import { loadStripe } from "@stripe/stripe-js";

/**
 * Product Code Mapping
 * Maps product names to their backend item codes
 */
export const PRODUCT_CODES: Record<string, string> = {
  "Brazil Lencois": "BLRB",
  "Ethiopia Guji Hamebla": "EGHRB",
  "Puro Localo": "PLRB",
  "Tutti Frutti": "TFRB",
};

/**
 * Get product code by name
 * @param productName - The product name from the API
 * @returns The item code for the backend (e.g., "BLRB")
 */
export function getProductCode(productName: string): string {
  return PRODUCT_CODES[productName] || productName;
}

/**
 * Get localized redirect URLs
 * Constructs success and cancel URLs based on current page locale
 */
function getRedirectUrls(): { successUrl: string; cancelUrl: string } {
  if (typeof window === "undefined") {
    return {
      successUrl: "/payment-success",
      cancelUrl: "/payment-cancelled",
    };
  }

  // Extract locale from current URL path (e.g., /en/products -> 'en', /ar/products -> 'ar')
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const locale = pathParts[0]?.match(/^(en|ar)$/) ? pathParts[0] : "en";

  return {
    successUrl: `${window.location.origin}/${locale}/payment-success`,
    cancelUrl: `${window.location.origin}/${locale}/payment-cancelled`,
  };
}

/**
 * Create a Stripe Checkout Session
 * @param productCode - Product code (BLRB, EGHRB, PLRB, TFRB)
 * @param quantity - Quantity to purchase
 * @returns Session ID for Stripe redirect
 */
export async function createCheckoutSession(
  productCode: string,
  quantity: number = 1
): Promise<string> {
  const { successUrl, cancelUrl } = getRedirectUrls();

  const response = await apiFetch<{ sessionId: string }>(
    "/payments/checkout-session",
    {
      method: "POST",
      body: JSON.stringify({
        itemCode: productCode,
        quantity,
        successUrl,
        cancelUrl,
      }),
    }
  );

  if (!response.sessionId) {
    throw new Error("Failed to create checkout session: No sessionId in response");
  }

  return response.sessionId;
}

/**
 * Redirect to Stripe Checkout
 * @param sessionId - The session ID from the backend
 */
export async function redirectToStripeCheckout(sessionId: string): Promise<void> {
  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!stripeKey) {
    throw new Error("Stripe publishable key is not configured");
  }

  const stripe = await loadStripe(stripeKey);

  if (!stripe) {
    throw new Error("Failed to load Stripe");
  }

  // Use the redirectToCheckout method if available (type assertion for compatibility)
  const stripeAny = stripe as any;
  if (stripeAny.redirectToCheckout && typeof stripeAny.redirectToCheckout === "function") {
    const result = await stripeAny.redirectToCheckout({ sessionId });
    if (result.error) {
      throw new Error(result.error.message || "Redirect to checkout failed");
    }
  } else {
    // Fallback: construct the URL and redirect directly
    if (typeof window !== "undefined") {
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    }
  }
}

/**
 * Handle the "Buy Now" flow
 * Creates a checkout session and redirects to Stripe
 */
export async function handleBuyNow(productCode: string, quantity: number = 1): Promise<void> {
  try {
    const sessionId = await createCheckoutSession(productCode, quantity);
    await redirectToStripeCheckout(sessionId);
  } catch (error) {
    throw error;
  }
}
