"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, User } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { getErrorMessage } from "@/lib/utils"
import { useTranslations } from "next-intl"

export default function RegisterForm() {
  const t = useTranslations('auth.register')
  const router = useRouter()
  const { register: doRegister } = useAuthStore()

  const RegisterSchema = z
    .object({
      firstName: z.string().min(1, t('firstName')),
      lastName: z.string().min(1, t('lastName')),
      email: z.string().min(1, t('email')).email(t('email')),
      password: z.string().min(8, t('password')),
      confirmPassword: z.string().min(1, t('confirmPassword')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('confirmPassword'),
      path: ["confirmPassword"],
    })

  type RegisterValues = z.infer<typeof RegisterSchema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(RegisterSchema) })

  const onSubmit = async (vals: RegisterValues) => {
    try {
      await doRegister({ firstName: vals.firstName, lastName: vals.lastName, email: vals.email, password: vals.password })
      router.push("/auth/confirm")
      toast.success(t('success'))
    } catch (err: any) {
      const msg = getErrorMessage(err)
      toast.error(msg)
    }
  }

  return (
    <div className="glass rounded-2xl p-8 max-w-md w-full register-form">
      <div className="text-center mb-8">
        <h1 className="font-bold" style={{ color: '#2b1b13', fontSize: '24px', textTransform: 'uppercase' }}>{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">{t('firstName')}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input {...register("firstName")} placeholder={t('firstNamePlaceholder')} className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground" />
            </div>
            {errors.firstName && <p className="text-destructive text-sm mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">{t('lastName')}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input {...register("lastName")} placeholder={t('lastNamePlaceholder')} className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground" />
            </div>
            {errors.lastName && <p className="text-destructive text-sm mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">{t('email')}</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input {...register("email")} placeholder={t('emailPlaceholder')} className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground" />
          </div>
          {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">{t('password')}</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input type="password" {...register("password")} placeholder={t('passwordPlaceholder')} className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground" />
          </div>
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">{t('confirmPassword')}</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input type="password" {...register("confirmPassword")} placeholder={t('passwordPlaceholder')} className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground" />
          </div>
          {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="rounded accent-accent" required />
          <span className="text-sm text-muted-foreground">
            {t('termsLabel')}{" "}
            <a href="#" className="text-accent hover:underline font-medium">{t('termsLink')}</a>
          </span>
        </label>

        <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-accent hover:bg-accent/90 disabled:opacity-70 text-accent-foreground font-bold rounded-lg transition-smooth glow-accent">{isSubmitting ? t('creating') : t('createAccount')}</button>
      </form>

      <p className="text-center mt-6 text-muted-foreground">{t('haveAccount')} <Link href="/login" className="text-accent font-semibold hover:underline">{t('signIn')}</Link></p>
    </div>
  )
}
