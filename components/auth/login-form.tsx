"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/routing";
import { Mail, Lock, Chrome, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { API_URL } from "@/lib/config";
import { getErrorMessage } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function LoginForm() {
  const t = useTranslations('auth.login')
  const { login } = useAuthStore();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  
  const LoginSchema = z.object({
    email: z.string().min(1, t('email')).email(t('email')),
    password: z.string().min(1, t('password')),
  });

  type LoginValues = z.infer<typeof LoginSchema>;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(LoginSchema) });

const onSubmit = async (vals: LoginValues) => {
    // Clear previous errors
    setAuthError(null);
    
    try {
      await login(vals.email, vals.password);
      toast.success(t('success'));

      router.push("/"); // və ya "/dashboard"
      router.refresh(); // Bəzən header-i yeniləmək üçün lazımdır
      
    } catch (err: any) {
      // Extract error message from various possible locations
      const errorMessage = 
        err?.response?.data?.message || 
        err?.response?.data?.error ||
        err?.message || 
        getErrorMessage(err) ||
        "Login failed. Please try again.";
      
      // Display error in both toast and local state
      setAuthError(errorMessage);
      toast.error(errorMessage);
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
            border: '1px solid rgba(255, 255, 255, 0.25)',}}>
              
          <p style={{ fontFamily: "'Bank Gothic', sans-serif", letterSpacing: '0.04em', color: '#a3291c', fontSize: '28px', fontWeight: 'bold', marginBottom: '16px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {t('brandName')}
          </p>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
              <p className="text-red-700 text-sm font-medium">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <input {...register("email")} className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-[#1f6f78] focus:border-[#1f6f78]" />
              </div>
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <input type="password" {...register("password")} className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-[#1f6f78] focus:border-[#1f6f78]" />
              </div>
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
              <div className="mt-2 text-right">
                <Link href="/auth/forgot-password" className="text-sm text-muted-foreground underline">{t('forgotPassword')}</Link>
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
              {isSubmitting ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background dark:bg-matte-black text-muted-foreground">{t('orContinueWith')}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = `${API_URL}/auth/external-login?provider=Google`
              } else {
              }
            }}
            className="w-full mt-6 py-3 border border-border hover:bg-muted dark:hover:bg-white/5 rounded-lg font-semibold transition-smooth flex items-center justify-center gap-2"
          >
            <Chrome size={20} />
            {t('google')}
          </button>

          <div className="mt-4 text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>
              {t('noAccount')} <Link href="/register" className="text-accent font-semibold">{t('signUp')}</Link>
            </span>
            <Link href="/" className="text-accent font-semibold hover:underline">{t('returnToHome')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
