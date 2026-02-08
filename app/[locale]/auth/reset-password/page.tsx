"use client";

import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/auth-store";

export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resetPassword } = useAuthStore();

  const ResetSchema = z
    .object({
      newPassword: z.string().min(8, t("newPassword")),
      confirmPassword: z.string().min(1, t("confirmPassword")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("confirmPassword"),
      path: ["confirmPassword"],
    });

  type ResetValues = z.infer<typeof ResetSchema>;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetValues>({ resolver: zodResolver(ResetSchema) });

  const onSubmit = async (vals: ResetValues) => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");
    if (!email || !token) {
      toast.error(t("invalidLink"));
      router.replace("/auth/login");
      return;
    }

    try {
      await resetPassword({ email, token, newPassword: vals.newPassword, confirmPassword: vals.confirmPassword });
      toast.success(t("successMessage"));
      router.replace("/auth/login");
    } catch (e: any) {
      toast.error(e?.userMessage || e?.message || "Failed to reset password");
    }
  };

  useEffect(() => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");
    if (!email || !token) {
      toast.error(t("invalidLink"));
      router.replace("/auth/forgot-password");
    }
  }, [searchParams, router, t]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="glass p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-primary mb-2">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t("description")}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("newPassword")}</label>
              <input type="password" {...register("newPassword")} className="w-full pl-3 pr-3 py-2 border border-border rounded-lg bg-card" />
              {errors.newPassword && <p className="text-destructive text-sm mt-1">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("confirmPassword")}</label>
              <input type="password" {...register("confirmPassword")} className="w-full pl-3 pr-3 py-2 border border-border rounded-lg bg-card" />
              {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-4 text-white rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: 'rgb(56, 109, 118)' }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgb(46, 89, 98)')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = 'rgb(56, 109, 118)')}
              >
                {isSubmitting ? t("resetting") : t("resetButton")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
