import { NextRequest, NextResponse } from "next/server";
import { readCurrencyCookie, DEFAULT_CURRENCY } from "@/lib/currency-utils";

/**
 * Middleware to handle currency cookie and ensure SSR components are aware
 * of the selected currency before rendering.
 * 
 * This middleware:
 * 1. Reads the currency cookie from the request
 * 2. Ensures the cookie is passed to server components
 * 3. Sets X-Currency header for API requests
 * 4. Ensures currency cookie exists (sets default if missing)
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Read the currency from the cookie string
  const cookieHeader = request.headers.get("cookie") || "";
  const currency = readCurrencyCookie(cookieHeader);

  // Set X-Currency header for downstream API requests
  response.headers.set("X-Currency", currency);

  // Optional: Ensure the currency cookie exists (set default if missing)
  const hasCurrencyCookie = request.cookies.has("df_currency");
  if (!hasCurrencyCookie) {
    response.cookies.set("df_currency", currency, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

// Optionally, you can configure which paths this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
