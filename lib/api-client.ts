import { API_URL } from "./config";
import toast from "react-hot-toast";

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let isHandlingTokenExpiry = false;
let currentLocale: string = "en";

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setTokens(tokens: { accessToken: string; refreshToken: string } | null) {
  accessToken = tokens?.accessToken ?? null;
  refreshToken = tokens?.refreshToken ?? null;
}

function clearAuthAndRedirect() {
  if (isHandlingTokenExpiry) return; // Prevent multiple redirects
  isHandlingTokenExpiry = true;

  // Clear tokens from memory
  setTokens(null);

  // Clear tokens from localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("df_tokens");
    
    const currentPath = window.location.pathname;

    // ONLY redirect for admin panel
    if (currentPath.startsWith("/admin")) {
      toast.error("Admin session expired. Please login again.");
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 500);
    } else {
      // Customer side: NO redirect to login
      // Just reload the page so UI (Navbar etc) switches to guest mode
      // User stays on current page (checkout, cart, etc) and continues as guest
      toast("Session expired. Continued as guest.", { icon: "ℹ️" });
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }
}

async function refreshTokens(): Promise<boolean> {
  try {
    if (!refreshToken) {
      clearAuthAndRedirect();
      return false;
    }
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ accessToken, refreshToken }),
    });
    if (!res.ok) {
      // Refresh failed (e.g., user not found, invalid token)
      clearAuthAndRedirect();
      return false;
    }
    const data = await res.json();
    if (data?.accessToken && data?.refreshToken) {
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      if (typeof window !== "undefined") {
        localStorage.setItem("df_tokens", JSON.stringify({ accessToken: data.accessToken, refreshToken: data.refreshToken }));
      }
      return true;
    }
    // Invalid response format
    clearAuthAndRedirect();
    return false;
  } catch (e) {
    // Network or parsing error during refresh
    clearAuthAndRedirect();
    return false;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit & { method?: HttpMethod } = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  let headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as any),
  };
  // If body is FormData, remove Content-Type so browser sets it (for file upload)
  if (typeof window !== "undefined" && init.body instanceof FormData) {
    // Remove Content-Type header for FormData
    const { ["Content-Type"]: _, ...rest } = headers;
    headers = rest;
  }
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  // Add locale header for language-specific responses
  if (currentLocale) {
    headers["Accept-Language"] = currentLocale;
  }

  const doFetch = async () =>
    fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });

  let res = await doFetch();

  if (res.status === 401) {
    // Only attempt refresh if we had a token
    if (accessToken) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        // Retry with new access token
        const retryHeaders = { ...headers };
        if (accessToken) retryHeaders["Authorization"] = `Bearer ${accessToken}`;
        res = await fetch(url, { ...init, headers: retryHeaders, credentials: "include" });
      } else {
        // Token refresh failed, redirect already triggered
        // Don't throw or show additional errors - the redirect handles it
        throw new Error("Session expired");
      }
    }
    // If no token, let the response be handled as-is (backend may allow anonymous requests)
  }

  if (!res.ok) {
    let data: any = undefined;
    try {
      data = await res.json();
    } catch {}
    const err: ApiError = new Error(data?.message || `Request failed with ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}

/**
 * Set the current locale for apiFetch requests
 * Call this from client components when locale changes
 * 
 * @param locale - The locale code (e.g., 'en', 'ar')
 */
export function setApiClientLocale(locale: string) {
  currentLocale = locale;
}
