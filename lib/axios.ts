import axios from "axios";
import { API_URL } from "./config";
import toast from "react-hot-toast";
import { getErrorMessage } from "./utils";
import { useAuthStore } from "@/lib/auth-store";
import { refreshAccessToken } from "./services/auth";
import { getCurrencyFromStorage } from "@/lib/currency-utils";

// Store for current locale (to be set from client components)
let currentLocale: string = "en";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor with currency and auth headers
instance.interceptors.request.use(
  async (config) => {
    // Add auth token (ONLY on client - SSR safe)
    if (typeof window !== "undefined") {
      const token = useAuthStore.getState().accessToken;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add currency header
    let currency = "AED";
    if (typeof window === "undefined") {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        currency = cookieStore.get("NEXT_CURRENCY")?.value || "AED";
      } catch (e) {
        // Fallback to AED on error
      }
    } else {
      const match = document.cookie.match(/(^| )NEXT_CURRENCY=([^;]+)/);
      if (match) {
        currency = match[2];
      }
    }

    if (config.headers) {
      config.headers["Currency"] = currency;
      config.headers["X-Currency"] = currency;
    }

    // Add locale header - uses the current locale from store
    if (config.headers && currentLocale) {
      config.headers["Accept-Language"] = currentLocale;
    }


    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track refresh token state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Determine correct login redirect URL based on current pathname
 * Admin routes → /admin/login
 * Customer routes → /login (routing handles locale)
 */
function getLoginRedirectUrl(): string {
  if (typeof window === "undefined") return "/login";
  const pathname = window.location.pathname;
  // If admin path, redirect to admin login
  if (pathname.includes("/admin")) {
    return "/admin/login";
  }
  // Otherwise, redirect to customer login
  return "/login";
}

// Response interceptor with refresh token logic
instance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const originalRequest = err.config;
    const message = getErrorMessage(err);

    // Handle 401 Unauthorized
    if (status === 401) {
      // Skip refresh logic for login, logout, or refresh requests
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/logout") ||
        originalRequest.url?.includes("/auth/refresh")
      ) {
        return Promise.reject(err);
      }

      // Skip if already retried
      if (originalRequest._retry) {
        if (typeof window !== "undefined") {
          toast.error("Session expired. Please login again.");
          useAuthStore.getState().logout();
          window.location.href = getLoginRedirectUrl();
        }
        return Promise.reject(err);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            if (typeof window !== "undefined") {
              const newToken = useAuthStore.getState().accessToken;
              if (newToken && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
            }
            return instance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Mark as retrying
      originalRequest._retry = true;
      isRefreshing = true;

      // SSR safety: Only proceed with refresh if we're on the client
      if (typeof window === "undefined") {
        isRefreshing = false;
        processQueue(new Error("No Zustand state available on server"));
        return Promise.reject(err);
      }

      const { accessToken, refreshToken } = useAuthStore.getState();

      if (!refreshToken || !accessToken) {
        isRefreshing = false;
        processQueue(new Error("No tokens available"));
        toast.error("Session expired. Please login again.");
        useAuthStore.getState().logout();
        window.location.href = getLoginRedirectUrl();
        return Promise.reject(err);
      }

      try {
        
        const newTokens = await refreshAccessToken(accessToken, refreshToken);

        // Record the refresh timestamp BEFORE updating store to prevent bad rehydration
        if (typeof window !== "undefined") {
          sessionStorage.setItem("token_refresh_time", Date.now().toString());
        }

        // AWAIT the store update to ensure localStorage write completes
        // This guarantees tokens are on disk BEFORE the retry request fires
        if (typeof window !== "undefined") {
          await useAuthStore.getState().setTokens(newTokens.accessToken, newTokens.refreshToken);
        }
      

        // Update the failed request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        }

        // Process the queue
        processQueue();
        isRefreshing = false;

        return instance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        const refreshErr = refreshError as any;
        console.error("[Axios Refresh] Refresh failed", {
          error: refreshError,
          status: refreshErr?.response?.status,
          data: refreshErr?.response?.data,
          originalUrl: originalRequest?.url,
        });
        processQueue(refreshError);
        isRefreshing = false;
        if (typeof window !== "undefined") {
          toast.error("Session expired. Please login again.");
          useAuthStore.getState().logout();
          window.location.href = getLoginRedirectUrl();
        }
        return Promise.reject(refreshError);
      }
    } else if (status >= 500) {
      toast.error(message || "Server error. Please try again later.");
    }

    try {
      err.userMessage = message;
    } catch {}
    return Promise.reject(err);
  }
);

export function setAxiosAuthToken(token: string | null) {
  if (token) instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete instance.defaults.headers.common["Authorization"];
}

/**
 * Set the current locale for axios requests
 * Call this from client components when locale changes
 * 
 * @param locale - The locale code (e.g., 'en', 'ar')
 */
export function setAxiosLocale(locale: string) {
  currentLocale = locale;
  // Also set as default header for consistency
  instance.defaults.headers.common["Accept-Language"] = locale;
}

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { method?: HttpMethod } = {}
): Promise<T> {
  const method = (init.method || "GET") as HttpMethod;
  const config: any = {
    method,
    headers: init.headers || {},
  };

  // Handle FormData - axios will auto-set Content-Type with boundary
  if (init.body instanceof FormData) {
    config.data = init.body;
  } else if (init.body) {
    config.data = typeof init.body === "string" ? init.body : JSON.stringify(init.body);
  }

  try {
    const response = await instance({
      url: path,
      ...config,
    });
    return response.data as T;
  } catch (error: any) {
    const apiError = new Error(error?.response?.data?.message || error?.message) as ApiError;
    apiError.status = error?.response?.status;
    apiError.data = error?.response?.data;
    throw apiError;
  }
}

export function setApiClientCurrency(currency: string) {
  instance.defaults.headers.common["X-Currency"] = currency;
}

export function setApiClientLocale(locale: string) {
  setAxiosLocale(locale);
}

export default instance;
