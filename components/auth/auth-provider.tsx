"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuthStore } from "@/lib/auth-store";

type AuthContextType = {
  isLoggedIn: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // use the existing zustand store for state and actions
  const { user, accessToken, refreshToken, login: storeLogin, logout: storeLogout, setFromStorage } = useAuthStore();

  // Rehydrate on mount
  React.useEffect(() => {
    setFromStorage?.();
  }, [setFromStorage]);

  const login = async (email: string, password: string) => {
    // call the zustand store login (which uses apiFetch and API_URL). If your backend is local, set NEXT_PUBLIC_API_BASE_URL accordingly.
    await storeLogin(email, password);
    router.push("/");
  };

  const logout = async () => {
    await storeLogout();
    router.push("/");
  };

  const value = useMemo(
    () => ({ isLoggedIn: Boolean(accessToken), user, login, logout }),
    [accessToken, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
