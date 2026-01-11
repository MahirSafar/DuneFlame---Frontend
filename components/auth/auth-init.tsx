"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";

export default function AuthInit() {
  const { setFromStorage } = useAuthStore();
  useEffect(() => {
    setFromStorage();
  }, [setFromStorage]);
  return null;
}
