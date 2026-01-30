"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

const ForgotSchema = z.object({ email: z.string().min(1, "Email is required").email("Invalid email") });
type ForgotValues = z.infer<typeof ForgotSchema>;

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotValues>({ resolver: zodResolver(ForgotSchema) });

  const onSubmit = async (vals: ForgotValues) => {
    try {
      await forgotPassword(vals.email);
      toast.success("If an account exists, a reset link has been sent.");
    } catch (e: any) {
      // auth-store / axios interceptor may have shown messages; show specific if available
      toast.error(e?.userMessage || e?.message || "Failed to send reset link");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="glass p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-primary mb-2">Forgot password</h2>
          <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send a reset link if an account exists.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input {...register("email")} className="w-full pl-3 pr-3 py-2 border border-border rounded-lg bg-card" />
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
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
                {isSubmitting ? "Sending..." : "Send reset link"}
              </button>
              <Link href="/auth/login" className="text-sm text-muted-foreground underline">Back to login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
