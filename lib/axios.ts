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
  (config) => {
    // Add auth token
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add currency header - ALWAYS reads from latest storage value
    const currency = getCurrencyFromStorage();
    if (config.headers) {
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
        toast.error("Session expired. Please login again.");
        useAuthStore.getState().logout();
        if (window.location.pathname !== "/admin/login") {
          window.location.href = "/admin/login";
        }
        return Promise.reject(err);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            const newToken = useAuthStore.getState().accessToken;
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
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

      const { accessToken, refreshToken } = useAuthStore.getState();

      if (!refreshToken || !accessToken) {
        isRefreshing = false;
        processQueue(new Error("No tokens available"));
        toast.error("Session expired. Please login again.");
        useAuthStore.getState().logout();
        if (window.location.pathname !== "/admin/login") {
          window.location.href = "/admin/login";
        }
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
        await useAuthStore.getState().setTokens(newTokens.accessToken, newTokens.refreshToken);
      

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
        toast.error("Session expired. Please login again.");
        useAuthStore.getState().logout();
        if (window.location.pathname !== "/admin/login") {
          window.location.href = "/admin/login";
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

// Helper functions for token management (kept for backward compatibility)
let accessToken: string | null = null;
let refreshToken: string | null = null;

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
  instance.defaults.headers.common["X-Currency"] = currency;
}

export function setApiClientLocale(locale: string) {
  setAxiosLocale(locale);
}

export default instance;
