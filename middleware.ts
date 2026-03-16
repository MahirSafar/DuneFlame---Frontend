import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { readCurrencyCookie, DEFAULT_CURRENCY } from "@/lib/currency-utils";

// Create next-intl middleware using the routing config
const intlMiddleware = createMiddleware(routing);

/**
 * Middleware to handle:
 * 1. Locale detection and redirection (next-intl)
 * 2. Currency cookie management
 * 3. Locale header for API requests
 */
export function middleware(request: NextRequest) {
  // Handle locale routing first
  const intlResponse = intlMiddleware(request);

  // If the path was redirected due to locale, return early
  if (intlResponse.status !== 200) {
    return intlResponse;
  }

  const response = intlResponse || NextResponse.next();

  // Extract locale from pathname (format: /locale/...)
  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;

  // Read the currency from the cookie string
  const cookieHeader = request.headers.get("cookie") || "";
  const currency = readCurrencyCookie(cookieHeader);

  // Set X-Currency header for downstream API requests
  response.headers.set("X-Currency", currency);

  // Set Accept-Language header for API requests to indicate preferred language
  response.headers.set("Accept-Language", locale);

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

// Configure which paths this middleware runs on
export const config = {
  matcher: [
    // Apply middleware to all paths except:
    // - api, _next/static, _next/image (Next.js internals)
    // - Static files (images, fonts, manifests, etc.)
    // - apple-touch-icon and favicon
    '/((?!api|_next/static|_next/image|favicon|apple-touch-icon|manifest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
