"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios, { setAxiosAuthToken } from "./axios";
import { getErrorMessage } from "./utils";
import { setTokens } from "./api-client";

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
  setTokens: (accessToken: string, refreshToken: string) => void;
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
          setTokens({ accessToken, refreshToken });
          setAxiosAuthToken(accessToken);
          if (typeof window !== "undefined") {
            localStorage.setItem("df_tokens", JSON.stringify({ accessToken, refreshToken }));
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
          setTokens({ accessToken, refreshToken });
          setAxiosAuthToken(accessToken);
          if (typeof window !== "undefined") {
            localStorage.setItem("df_tokens", JSON.stringify({ accessToken, refreshToken }));
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
        set({ user: null, accessToken: null, refreshToken: null });
        setTokens(null);
        setAxiosAuthToken(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("df_tokens");
        }
      },
      setFromStorage() {
        if (typeof window === "undefined") return;
        const raw = localStorage.getItem("df_tokens");
        if (!raw) return;
        try {
          const { accessToken, refreshToken } = JSON.parse(raw);
          set({ accessToken, refreshToken });
          setTokens({ accessToken, refreshToken });
          setAxiosAuthToken(accessToken);
        } catch {}
      },
      setTokens(accessToken: string, refreshToken: string) {
        set({ accessToken, refreshToken });
        setTokens({ accessToken, refreshToken });
        setAxiosAuthToken(accessToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("df_tokens", JSON.stringify({ accessToken, refreshToken }));
        }
      },
    }),
    { name: "df_auth" }
  )
);
