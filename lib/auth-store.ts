"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios, { setAxiosAuthToken } from "./axios";
import { getErrorMessage } from "./utils";
import { setTokens, getAccessToken, getRefreshToken } from "./api-client";
import { useCartStore } from "./cart-store";

export interface AuthResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accessToken: string;
  refreshToken: string;
  roles: string[];
}

interface AuthState {
  user: Omit<AuthResponse, "accessToken" | "refreshToken"> | null;
  accessToken: string | null;
  refreshToken: string | null;
  loggingIn: boolean;
  error?: string;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (payload: { email: string; token: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
  setFromStorage: () => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      loggingIn: false,
      async login(email, password) {
        set({ loggingIn: true, error: undefined });
        try {
          const res = await axios.post<AuthResponse>("/auth/login", { email, password });
          const data = res.data;
          const { accessToken, refreshToken, ...user } = data;
          set({ user, accessToken, refreshToken, loggingIn: false });
          await get().setTokens(accessToken, refreshToken);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("token_refresh_time", Date.now().toString());
          }
          
          // Sync guest cart items to authenticated user's basket
          try {
            const { syncGuestItemsToAuthenticatedBasket } = useCartStore.getState();
            await syncGuestItemsToAuthenticatedBasket();
            // After syncing, reload the basket from server to get the merged state
            const { loadBasket } = useCartStore.getState();
            await loadBasket();
          } catch (cartError) {
            console.error("[Auth] Failed to sync cart after login:", cartError);
            // Don't throw - login was successful, cart sync failure shouldn't break login
          }
        } catch (e: any) {
          const msg = getErrorMessage(e) || "Login failed";
          set({ error: msg, loggingIn: false });
          throw e;
        }
      },
      async register(input) {
        set({ loggingIn: true, error: undefined });
        try {
          const res = await axios.post<AuthResponse>("/auth/register", input);
          const data = res.data;
          const { accessToken, refreshToken, ...user } = data;
          set({ user, accessToken, refreshToken, loggingIn: false });
          await get().setTokens(accessToken, refreshToken);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("token_refresh_time", Date.now().toString());
          }
          
          // Sync guest cart items to authenticated user's basket
          try {
            const { syncGuestItemsToAuthenticatedBasket } = useCartStore.getState();
            await syncGuestItemsToAuthenticatedBasket();
            // After syncing, reload the basket from server to get the merged state
            const { loadBasket } = useCartStore.getState();
            await loadBasket();
          } catch (cartError) {
            console.error("[Auth] Failed to sync cart after registration:", cartError);
            // Don't throw - registration was successful, cart sync failure shouldn't break registration
          }
        } catch (e: any) {
          const msg = getErrorMessage(e) || "Registration failed";
          set({ error: msg, loggingIn: false });
          throw e;
        }
      },
      async forgotPassword(email: string) {
        set({ loggingIn: true, error: undefined });
        try {
          await axios.post("/auth/forgot-password", { email });
          set({ loggingIn: false });
        } catch (e: any) {
          const msg = getErrorMessage(e) || "Failed to send reset link";
          set({ error: msg, loggingIn: false });
          throw e;
        }
      },

      async resetPassword(payload: { email: string; token: string; newPassword: string; confirmPassword: string }) {
        set({ loggingIn: true, error: undefined });
        try {
          await axios.post("/auth/reset-password", payload);
          set({ loggingIn: false });
        } catch (e: any) {
          const msg = getErrorMessage(e) || "Failed to reset password";
          set({ error: msg, loggingIn: false });
          throw e;
        }
      },
      async logout() {
        try {
          await axios.post("/auth/logout");
        } catch {}
        
        // Clear guest basket ID
        if (typeof window !== "undefined") {
          localStorage.removeItem("guestBasketId");
        }
        
        // Clear local cart state (do NOT delete backend basket - user should see it on next login)
        useCartStore.getState().clearCart();
        
        // Clear auth state
        set({ user: null, accessToken: null, refreshToken: null });
        setTokens(null); // Clear from api-client memory
        setAxiosAuthToken(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("df_tokens");
          sessionStorage.removeItem("token_refresh_time");
        }
      },
      setFromStorage() {
        if (typeof window === "undefined") return;
        
        // Don't overwrite if we just refreshed tokens (within last 1 second)
        const lastRefresh = sessionStorage.getItem("token_refresh_time");
        if (lastRefresh && Date.now() - parseInt(lastRefresh) < 1000) {
          return; // Skip rehydration immediately after token refresh
        }
        
        const raw = localStorage.getItem("df_tokens");
        if (!raw) return;
        try {
          const { accessToken, refreshToken } = JSON.parse(raw);
          set({ accessToken, refreshToken });
          setTokens({ accessToken, refreshToken });
          setAxiosAuthToken(accessToken);
        } catch {}
      },
      async setTokens(accessToken: string, refreshToken: string) {
        // 1. Update Zustand store state
        set({ accessToken, refreshToken });
        
        // 2. Update api-client local variables (used by apiFetch)
        setTokens({ accessToken, refreshToken });
        
        // 3. Update axios headers for axios instance
        setAxiosAuthToken(accessToken);
        
        // 4. Persist to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("df_tokens", JSON.stringify({ accessToken, refreshToken }));
          // Record the timestamp of this refresh to prevent bad rehydration
          sessionStorage.setItem("token_refresh_time", Date.now().toString());
        }
      },
    }),
    { name: "df_auth" }
  )
);
