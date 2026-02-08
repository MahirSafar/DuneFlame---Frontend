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
let currentCurrency: string = "AED";

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

export function setApiClientCurrency(currency: string) {
  currentCurrency = currency;
}

function clearAuthAndRedirect() {
  if (isHandlingTokenExpiry) return; // Prevent multiple redirects
  isHandlingTokenExpiry = true;

  // Clear tokens from memory
  setTokens(null);

  // Clear tokens from localStorage
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname;

    // ONLY redirect for admin panel
    if (currentPath.startsWith("/admin")) {
      toast.error("Admin session expired. Please login again.");
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 500);
    } else {
      // Customer side: Complete cleanup and reload once
      // Check if we've already done the reload to prevent infinite loop
      const sessionExpiredReloadFlag = sessionStorage.getItem("session_expired_reload_flag");
      
      if (!sessionExpiredReloadFlag) {
        // First time handling session expiry - do complete cleanup
        toast("Session expired. Continued as guest.", { icon: "ℹ️" });
        
        setTimeout(() => {
          // 1. Clear all localStorage
          localStorage.clear();
          
          // 2. Clear all sessionStorage
          sessionStorage.clear();
          
          // 3. Delete all cookies by setting expiration to past
          const cookies = document.cookie.split(";");
          for (let cookie of cookies) {
            const cookieName = cookie.split("=")[0].trim();
            if (cookieName) {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            }
          }
          
          // 4. Set flag so next reload is allowed (reset after next reload)
          sessionStorage.setItem("session_expired_reload_flag", "true");
          
          // 5. Reload the page
          window.location.reload();
        }, 500);
      } else {
        // Already reloaded once - prevent infinite loop
        console.warn("⚠️ Session expiry cleanup already performed, preventing infinite reload loop");
        // Clear the flag for future sessions
        sessionStorage.removeItem("session_expired_reload_flag");
      }
    }
  }
}

async function refreshTokens(): Promise<boolean> {
  try {
    console.log("🔄 [TOKEN REFRESH] Starting refresh attempt...");
    
    if (!refreshToken) {
      console.error("❌ [TOKEN REFRESH] No refreshToken available in memory");
      clearAuthAndRedirect();
      return false;
    }

    // Log the exact payload being sent
    const refreshPayload = { accessToken, refreshToken };
    console.log("📤 [TOKEN REFRESH] Sending payload to /auth/refresh:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length,
    });

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Send cookies if backend stores refresh token there
      body: JSON.stringify(refreshPayload),
    });

    console.log("📥 [TOKEN REFRESH] Response status:", res.status);

    if (!res.ok) {
      console.error(`❌ [TOKEN REFRESH] Refresh failed with status ${res.status}`);
      
      // Try to parse error response
      let errorData;
      try {
        const contentType = res.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          errorData = await res.json();
          console.error("📋 [TOKEN REFRESH] Error response body:", errorData);
        } else {
          const text = await res.text();
          console.error("📋 [TOKEN REFRESH] Error response (text):", text);
        }
      } catch (parseError) {
        console.error("⚠️ [TOKEN REFRESH] Could not parse error response:", parseError);
      }

      clearAuthAndRedirect();
      return false;
    }

    const data = await res.json();
    console.log("✅ [TOKEN REFRESH] Refresh response received:", {
      hasAccessToken: !!data?.accessToken,
      hasRefreshToken: !!data?.refreshToken,
      responseKeys: Object.keys(data || {}),
    });

    if (data?.accessToken && data?.refreshToken) {
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      
      if (typeof window !== "undefined") {
        localStorage.setItem("df_tokens", JSON.stringify({ 
          accessToken: data.accessToken, 
          refreshToken: data.refreshToken 
        }));
      }

      console.log("✅ [TOKEN REFRESH] Tokens updated successfully");
      return true;
    }

    console.error("❌ [TOKEN REFRESH] Invalid response format - missing tokens:", data);
    clearAuthAndRedirect();
    return false;
  } catch (e) {
    console.error("❌ [TOKEN REFRESH] Network or parsing error:", {
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
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
  // Add currency header for currency-specific responses
  if (currentCurrency) {
    headers["X-Currency"] = currentCurrency;
  }

  const doFetch = async () =>
    fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });

  let res = await doFetch();

  console.log(`🌐 [API FETCH] ${init.method || "GET"} ${path} -> Status: ${res.status}, Headers: Accept-Language=${headers["Accept-Language"]}, X-Currency=${headers["X-Currency"]}`);

  if (res.status === 401) {
    console.log("🔐 [API FETCH] 401 Unauthorized - Token may be expired");
    
    // --- DÜZƏLİŞ BURADADIR ---
    // Əvvəl yalnız "accessToken" yoxlanılırdı. İndi "refreshToken" varsa, yeniləməyə cəhd edirik.
    // Çünki accessToken null ola bilər (siz sildiyiniz kimi), amma refreshToken hələ də ola bilər.
    if (refreshToken) { 
      console.log("🔄 [API FETCH] Attempting token refresh (RefreshToken found)...");
      const refreshed = await refreshTokens();
      
      if (refreshed) {
        console.log("✅ [API FETCH] Token refreshed successfully, retrying request...");
        // Retry with new access token
        const retryHeaders = { ...headers };
        if (accessToken) retryHeaders["Authorization"] = `Bearer ${accessToken}`;
        res = await fetch(url, { ...init, headers: retryHeaders, credentials: "include" });
        console.log(`🔄 [API FETCH] Retry response status: ${res.status}`);
      } else {
        console.error("❌ [API FETCH] Token refresh failed, throwing session expired error");
        // Token refresh failed, redirect already triggered
        throw new Error("Session expired");
      }
    } else {
      console.log("⚠️ [API FETCH] 401 and NO refreshToken in memory - treating as guest request");
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

export function setApiClientLocale(locale: string) {
  currentLocale = locale;
}