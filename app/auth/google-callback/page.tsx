"use client";

import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { setTokens } from "@/lib/api-client";
import { setAxiosAuthToken } from "@/lib/axios";
import { useAuthStore } from "@/lib/auth-store";

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

    try {
      // Persist tokens for api-client / axios
      setTokens({ accessToken, refreshToken });
      setAxiosAuthToken(accessToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("df_tokens", JSON.stringify({ accessToken, refreshToken }));
      }

      // If backend returned user info, try to parse and set in store
      if (userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          useAuthStore.setState({ user, accessToken, refreshToken });
        } catch {
          // ignore parse errors
          useAuthStore.setState({ accessToken, refreshToken });
        }
      } else {
        useAuthStore.setState({ accessToken, refreshToken });
      }

      toast.success("Successfully logged in with Google");
      // redirect to home / dashboard
      setTimeout(() => router.replace("/"), 700);
    } catch (e) {
      toast.error("Failed to process Google login");
      router.replace("/auth/login");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="glass p-8 rounded-2xl text-center">
          <h2 className="text-lg font-semibold mb-2">Processing login…</h2>
          <p className="text-sm text-muted-foreground">Please wait while we sign you in.</p>
        </div>
      </div>
    </div>
  );
}
