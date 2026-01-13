import axios from "axios";
import { API_URL } from "./config";
import toast from "react-hot-toast";
import { getErrorMessage } from "./utils";
import { useAuthStore } from "@/lib/auth-store";
import { refreshAccessToken } from "./services/auth";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
      // Skip refresh logic for login, logout, or refresh-token requests
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/logout") ||
        originalRequest.url?.includes("/auth/refresh-token")
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

      if (!accessToken || !refreshToken) {
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
        // Attempt to refresh the token
        const newTokens = await refreshAccessToken(accessToken, refreshToken);

        // Update store with new tokens
        useAuthStore.getState().setTokens(newTokens.accessToken, newTokens.refreshToken);

        // Update the failed request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        }

        // Process the queue
        processQueue();
        isRefreshing = false;

        // Retry the original request
        return instance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
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

export default instance;