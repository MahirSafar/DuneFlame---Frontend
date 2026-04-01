"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useCartStore } from "@/lib/cart-store";
import { Loader2 } from "lucide-react";

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const userParam = searchParams.get("user");

    if (!accessToken || !refreshToken) {
      toast.error("Google login failed: missing tokens");
      router.replace("/auth/login");
      return;
    }

    // Wrap async logic in internal function (React useEffect cannot be directly async)
    async function processLogin(token: string, refresh: string) {
      try {
        // CRITICAL FIX: Save tokens directly to Zustand store (not dummy axios helper)
        // This ensures Axios interceptor can read the token correctly
        await useAuthStore.getState().setTokens(token, refresh);

        // STEP 0: Fetch basketId with the token and await it
        await useAuthStore.getState().fetchAndStoreBasketId(token);

        // If backend returned user info, try to parse and set in store
        if (userParam) {
          try {
            const user = JSON.parse(decodeURIComponent(userParam));
            useAuthStore.setState({ user });
          } catch {
            // ignore parse errors
          }
        }

        // Clear guest data before loading the authenticated basket
        const { clearGuestData } = useCartStore.getState();
        clearGuestData();

        // STEP 1: Load authenticated user's basket
        try {
          const authState = useAuthStore.getState();
          if (!authState.user) {
            await authState.fetchUser();
          }

          try {
            const { loadBasket } = useCartStore.getState();
            await loadBasket();
          } catch (cartError) {
            console.error("[GoogleCallback] Failed to load basket after Google login:", cartError);
            // Don't break - login was successful
          }

          toast.success("Successfully logged in with Google");
          // Redirect to dashboard after successful login
          setTimeout(() => router.replace("/dashboard"), 700);
        } catch (error) {
          toast.success("Successfully logged in with Google");
          setTimeout(() => router.replace("/dashboard"), 700);
        }
      } catch (e) {
        toast.error("Failed to process Google login");
        router.replace("/auth/login");
      }
    }

    // Call the async function with tokens
    processLogin(accessToken, refreshToken);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 text-[#2b1b13] animate-spin mb-4" />
          <h2 className="text-lg font-semibold mb-2">Processing login…</h2>
          <p className="text-sm text-muted-foreground">Please wait while we sign you in.</p>
        </div>
      </div>
    </div>
  );
}
