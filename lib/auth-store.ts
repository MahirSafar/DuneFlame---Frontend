"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios, { setAxiosAuthToken, apiFetch } from "./axios";
import { getErrorMessage } from "./utils";
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
  hasOrders?: boolean;
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
          const guestBasketId = typeof window !== "undefined" ? localStorage.getItem("guestBasketId") : null;
          const headers = guestBasketId ? { "X-Guest-Basket-Id": guestBasketId } : {};

          const res = await axios.post<AuthResponse>("/auth/login", { email, password }, { headers });
          const data = res.data;
          const { accessToken, refreshToken, ...user } = data;
          set({ user, accessToken, refreshToken, loggingIn: false });
          await get().setTokens(accessToken, refreshToken);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("token_refresh_time", Date.now().toString());
            // v17: Also persist user object to localStorage for offline restoration
            localStorage.setItem("df_user_object", JSON.stringify(user));

            localStorage.removeItem("guestBasketId");
            localStorage.removeItem("df_user_basket_id");
          }
          
          // Clear guest data and load authenticated user's basket from backend
          try {
            const { clearGuestData, loadBasket } = useCartStore.getState();
            clearGuestData();
            await loadBasket();
          } catch (cartError) {
            console.error("[Auth] Failed to load basket after login:", cartError);
            // Don't throw - login was successful, cart load failure shouldn't break login
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
        
        // 1. TƏHLÜKƏSİZLİK: Tokenləri və yaddaşı DƏRHAL silirik ki, backend-ə gedən
        // "səbəti boşalt" (clearCart) sorğusu anonim getsin və sənin şəxsi profilini silməsin!
        set({ user: null, accessToken: null, refreshToken: null, userBasketId: null });
        setAxiosAuthToken(null);
        
        if (typeof window !== "undefined") {
          localStorage.removeItem("guestBasketId");
          localStorage.removeItem("df_user_basket_id");
          localStorage.removeItem("df_tokens");
          localStorage.removeItem("df_user_object");
          sessionStorage.removeItem("token_refresh_time");
        }
        
        // 2. İndi səbəti UI-dan silmək təhlükəsizdir (Token olmadığı üçün profilinə toxunmayacaq)
        useCartStore.getState().clearCart();
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
            }
          }
          
          set({ accessToken, refreshToken, userBasketId: userBasketId || null, user });
          setAxiosAuthToken(accessToken);
          
          // If token exists but user is null, fetch user data from backend
          if (accessToken && !user) {
            get().fetchUser().catch(err => 
              console.error("[Auth] Failed to fetch user after storage restoration:", err)
            );
          }
        } catch {}
      },
      async setTokens(accessToken: string, refreshToken: string) {
        // 1. Update Zustand store state
        set({ accessToken, refreshToken });
        
        // 2. Update axios headers for axios instance
        setAxiosAuthToken(accessToken);
        
        // 4. Persist to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("df_tokens", JSON.stringify({ accessToken, refreshToken }));
          // Record the timestamp of this refresh to prevent bad rehydration
          sessionStorage.setItem("token_refresh_time", Date.now().toString());
          
          // 5. CRITICAL: Clear guest basket ID when user logs in
          // User now has an authenticated basket, guest ID must be removed
          localStorage.removeItem("guestBasketId");
        }
      },
      async fetchUser() {
        try {
          const state = get();
          
          if (!state.accessToken) {
            return;
          }
          
          const response = await apiFetch<Omit<AuthResponse, "accessToken" | "refreshToken">>("/users/me", {
            method: "GET",
          });
          
          if (response) {
            const normalizedUser = {
              ...response,
              id: response.id || (response as any).userId || (response as any).UserId
            };
            set({ user: normalizedUser as any });
            if (typeof window !== "undefined") {
              localStorage.setItem("df_user_object", JSON.stringify(normalizedUser));
            }
            
            // YENİ ƏLAVƏ: Səhifə yenilənəndə və ya Google ilə girəndə səbəti avtomatik yüklə
            try {
              const { loadBasket } = useCartStore.getState();
              await loadBasket();
            } catch (cartError) {
              console.error("[Auth] Failed to load basket after fetchUser:", cartError);
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
            const response = await basketService.getBasket(userId);
            const basketId = response?.id;

            if (basketId) {
              // v16 CRITICAL: REJECT guest_ IDs for authenticated users
              if (basketId.startsWith("guest_")) {
                return null;  // Signal to retry
              }
              
              set({ userBasketId: basketId });
              if (typeof window !== "undefined") {
                localStorage.setItem("df_user_basket_id", basketId);
              }
              
              return basketId;
            } else {
              return null;
            }
          }
          
          // v17 FALLBACK: If no user ID yet but accessToken exists, use token-based fetch
          // This handles page reload case where token is restored but user object not yet fetched
          const tokenToUse = optionalToken || accessToken;
          if (tokenToUse && typeof window !== "undefined") {
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
                    return null;  // Signal to retry
                  }
                  
                  set({ userBasketId: basketId });
                  if (typeof window !== "undefined") {
                    localStorage.setItem("df_user_basket_id", basketId);
                  }
                  return basketId;
                } else {
                  return null;
                }
              } else if (response.status === 404) {
                return null;
              } else {
                return null;
              }
            } catch (tokenError) {
              return null;
            }
          }
          
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
    { name: "df_auth" }
  )
);
