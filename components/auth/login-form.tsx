"use client";

import React from "react";
import Link from "next/link";
import { Mail, Lock, Chrome } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { API_URL } from "@/lib/config";
import { getErrorMessage } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function LoginForm() {
  const t = useTranslations()
  const { login } = useAuthStore();
  const router = useRouter();
  
  const LoginSchema = z.object({
    email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.emailInvalid')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
  });

  type LoginValues = z.infer<typeof LoginSchema>;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(LoginSchema) });

const onSubmit = async (vals: LoginValues) => {
    try {
      await login(vals.email, vals.password);
      toast.success(t('auth.login.success'));

      router.push("/"); // və ya "/dashboard"
      router.refresh(); // Bəzən header-i yeniləmək üçün lazımdır
      
    } catch (err: any) {
      // --- DÜZƏLİŞ BURADADIR ---
      
      // 1. Əgər xəta 401 (Login səhvdir) və ya 500 (Server) olarsa, 
      // Axios Interceptor artıq toast göstərib. Biz ikincini göstərmirik.
      if (err?.response?.status === 401 || err?.response?.status >= 500) {
        return; 
      }

      // 2. Digər xətalar (məsələn 400 - Validation) üçün toast göstər
      const msg = getErrorMessage(err);
      toast.error(msg);
      // -------------------------
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div
          className="glass p-8 rounded-2xl shadow-xl border border-white/20"
          style={{
            background: 'rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}
        >
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Playfair Display", serif', letterSpacing: '0.04em', color: '#4B2E2B' }}>
            Dune & Flame L.L.C
          </h2>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: '"Playfair Display", serif', color: '#4B2E2B' }}>
            {/* You can add a subtitle here if needed */}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.login.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <input {...register("email")} className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-card" />
              </div>
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.login.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <input type="password" {...register("password")} className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-card" />
              </div>
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
              <div className="mt-2 text-right">
                <Link href="/auth/forgot-password" className="text-sm text-muted-foreground underline">{t('auth.login.forgotPassword')}</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 text-white rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: 'rgb(56, 109, 118)' }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgb(46, 89, 98)')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = 'rgb(56, 109, 118)')}
            >
              {isSubmitting ? t('auth.login.signingIn') : t('auth.login.signIn')}
            </button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background dark:bg-matte-black text-muted-foreground">{t('auth.login.orContinueWith')}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => (window.location.href = `${API_URL}/auth/external-login?provider=Google`)}
            className="w-full mt-6 py-3 border border-border hover:bg-muted dark:hover:bg-white/5 rounded-lg font-semibold transition-smooth flex items-center justify-center gap-2"
          >
            <Chrome size={20} />
            Google
          </button>

          <div className="mt-4 text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>
              Don't have an account? <Link href="/register" className="text-accent font-semibold">Sign up</Link>
            </span>
            <Link href="/" className="text-accent font-semibold hover:underline">Return to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
