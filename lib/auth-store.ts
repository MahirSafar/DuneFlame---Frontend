"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios, { setAxiosAuthToken } from "./axios";
import { getErrorMessage } from "./utils";
import { setTokens, getAccessToken, getRefreshToken, apiFetch } from "./api-client";
import { useCartStore } from "./cart-store";
import { basketService } from "./services/basket";

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
  userBasketId: string | null; // Store the authenticated user's actual basketId from backend
  login: (email: string, password: string) => Promise<void>;
  register: (input: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (payload: { email: string; token: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
  setFromStorage: () => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  fetchUser: () => Promise<void>; // Restore user object from backend when accessToken exists but user is null
  fetchAndStoreBasketId: (optionalToken?: string) => Promise<string | null>; // Fetch basketId from backend and store it
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      loggingIn: false,
      userBasketId: null,
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
            // v17: Also persist user object to localStorage for offline restoration
            localStorage.setItem("df_user_object", JSON.stringify(user));
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
            // v17: Also persist user object to localStorage for offline restoration
            localStorage.setItem("df_user_object", JSON.stringify(user));
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
        
        // Clear guest basket ID and user basket ID
        if (typeof window !== "undefined") {
          localStorage.removeItem("guestBasketId");
          localStorage.removeItem("df_user_basket_id");
        }
        
        // Clear local cart state (do NOT delete backend basket - user should see it on next login)
        useCartStore.getState().clearCart();
        
        // Clear auth state
        set({ user: null, accessToken: null, refreshToken: null, userBasketId: null });
        setTokens(null); // Clear from api-client memory
        setAxiosAuthToken(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("df_tokens");
          localStorage.removeItem("df_user_object");
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
          const userBasketId = localStorage.getItem("df_user_basket_id");
          const userRaw = localStorage.getItem("df_user_object");
          let user = null;
          
          // Try to restore user object from localStorage
          if (userRaw) {
            try {
              user = JSON.parse(userRaw);
            } catch {
              console.warn("[Auth] Failed to parse user object from localStorage");
            }
          }
          
          set({ accessToken, refreshToken, userBasketId: userBasketId || null, user });
          setTokens({ accessToken, refreshToken });
          setAxiosAuthToken(accessToken);
          
          // If token exists but user is null, fetch user data from backend
          if (accessToken && !user) {
            console.log("[Auth] ⚠️ Token exists but user is null - fetching user data from backend");
            get().fetchUser().catch(err => 
              console.error("[Auth] Failed to fetch user after storage restoration:", err)
            );
          }
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
          
          // 5. CRITICAL: Clear guest basket ID when user logs in
          // User now has an authenticated basket, guest ID must be removed
          localStorage.removeItem("df_guest_basket_id");
          console.log("[Auth] ✅ Cleared guest basket ID - user is now authenticated");
        }
      },
      async fetchUser() {
        try {
          const state = get();
          
          if (!state.accessToken) {
            console.warn("[Auth] No accessToken available for fetchUser");
            return;
          }
          
          // Fetch user data from /users/me endpoint (correct backend endpoint)
          console.log("[Auth] 🔄 Fetching user from /users/me...");
          const response = await apiFetch<Omit<AuthResponse, "accessToken" | "refreshToken">>("/users/me", {
            method: "GET",
          });
          
          if (response) {
            console.log("[Auth] ✅ Successfully fetched user:", response);
            set({ user: response });
            if (typeof window !== "undefined") {
              localStorage.setItem("df_user_object", JSON.stringify(response));
            }
          } else {
            console.error("[Auth] ❌ Failed to fetch user - empty response");
          }
        } catch (error) {
          console.error("[Auth] ❌ Failed to fetch user from /users/me:", error);
        }
      },
      async fetchAndStoreBasketId(optionalToken?: string) {
        try {
          const state = get();
          const userId = state.user?.id;
          const accessToken = state.accessToken;
          
          // v17 CRITICAL: Use userId if available
          if (userId) {
            console.log("[Auth] 🔑 Using user ID for basket fetch:", userId);
            const response = await basketService.getBasket(userId);
            const basketId = response?.id;

            if (basketId) {
              // v16 CRITICAL: REJECT guest_ IDs for authenticated users
              if (basketId.startsWith("guest_")) {
                console.warn("[Auth] ⚠️ Backend returned guest_ ID for authenticated user (sync in progress):", basketId);
                return null;  // Signal to retry
              }
              
              set({ userBasketId: basketId });
              if (typeof window !== "undefined") {
                localStorage.setItem("df_user_basket_id", basketId);
              }
              
              console.log("[Auth] ✅ Fetched basketId via user ID:", basketId);
              return basketId;
            } else {
              console.error("[Auth] ❌ Backend returned no basketId for user:", userId);
              return null;
            }
          }
          
          // v17 FALLBACK: If no user ID yet but accessToken exists, use token-based fetch
          // This handles page reload case where token is restored but user object not yet fetched
          const tokenToUse = optionalToken || accessToken;
          if (tokenToUse && typeof window !== "undefined") {
            console.log("[Auth] 🔑 User ID not available yet, using token-based backup basket fetch");
            try {
              const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dune-flame-backend-180239181668.me-central1.run.app';
              const response = await fetch(`${apiBaseUrl}/api/v1/basket/me`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${tokenToUse}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                const basket = await response.json();
                const basketId = basket?.id;
                
                if (basketId) {
                  // v16 CRITICAL: REJECT guest_ IDs for authenticated users
                  if (basketId.startsWith("guest_")) {
                    console.warn("[Auth] ⚠️ Token-based fetch returned guest_ ID (sync in progress)");
                    return null;  // Signal to retry
                  }
                  
                  set({ userBasketId: basketId });
                  if (typeof window !== "undefined") {
                    localStorage.setItem("df_user_basket_id", basketId);
                  }
                  console.log("[Auth] ✅ Fetched basketId via token (user object not yet ready):", basketId);
                  return basketId;
                } else {
                  console.error("[Auth] ❌ Backend returned no basketId via token");
                  return null;
                }
              } else if (response.status === 404) {
                console.error("[Auth] ❌ Backend /basket/me endpoint not found (404). Check backend endpoint name.");
                return null;
              } else {
                console.error("[Auth] ❌ Failed to fetch basket with token. Status:", response.status);
                return null;
              }
            } catch (tokenError) {
              console.error("[Auth] Failed to fetch basket with token:", tokenError);
              return null;
            }
          }
          
          console.warn("[Auth] ⚠️ No user ID or access token available for basket fetch");
          return null;
        } catch (error) {
          console.error("[Auth] Failed to fetch basketId:", error);
          return null;
        }
      },
    }),
    { name: "df_auth" }
  )
);
