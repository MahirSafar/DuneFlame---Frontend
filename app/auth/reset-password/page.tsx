"use client";

import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/auth-store";

const ResetSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetValues = z.infer<typeof ResetSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resetPassword } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetValues>({ resolver: zodResolver(ResetSchema) });

  const onSubmit = async (vals: ResetValues) => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");
    if (!email || !token) {
      toast.error("Invalid reset link");
      router.replace("/auth/login");
      return;
    }

    try {
      await resetPassword({ email, token, newPassword: vals.newPassword, confirmPassword: vals.confirmPassword });
      toast.success("Password reset successful. Please login.");
      router.replace("/auth/login");
    } catch (e: any) {
      toast.error(e?.userMessage || e?.message || "Failed to reset password");
    }
  };

  useEffect(() => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");
    if (!email || !token) {
      // show error and redirect
      toast.error("Invalid or expired reset link");
      router.replace("/auth/forgot-password");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="glass p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-primary mb-2">Reset password</h2>
          <p className="text-sm text-muted-foreground mb-6">Enter a new password for your account.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">New password</label>
              <input type="password" {...register("newPassword")} className="w-full pr-3 py-2 border border-border rounded-lg bg-card" />
              {errors.newPassword && <p className="text-destructive text-sm mt-1">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm password</label>
              <input type="password" {...register("confirmPassword")} className="w-full pr-3 py-2 border border-border rounded-lg bg-card" />
              {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-center justify-between gap-4">
              <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold">
                {isSubmitting ? "Resetting..." : "Reset password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
