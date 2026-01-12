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

const RegisterSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterValues = z.infer<typeof RegisterSchema>

export default function RegisterForm() {
  const router = useRouter()
  const { register: doRegister } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(RegisterSchema) })

  const onSubmit = async (vals: RegisterValues) => {
    try {
      await doRegister({ firstName: vals.firstName, lastName: vals.lastName, email: vals.email, password: vals.password })
      router.push("/auth/confirm")
      toast.success("Registered — check your email to confirm")
    } catch (err: any) {
      const msg = getErrorMessage(err)
      toast.error(msg)
    }
  }

  return (
    <div className="glass rounded-2xl p-8 max-w-md w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-secondary">Join DuneFlame</h1>
        <p className="text-muted-foreground mt-2">Create your account to start exploring</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">First Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input {...register("firstName")} placeholder="John" className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground" />
            </div>
            {errors.firstName && <p className="text-destructive text-sm mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">Last Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input {...register("lastName")} placeholder="Doe" className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground" />
            </div>
            {errors.lastName && <p className="text-destructive text-sm mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input {...register("email")} placeholder="hello@example.com" className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground" />
          </div>
          {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input type="password" {...register("password")} placeholder="••••••••" className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground" />
          </div>
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input type="password" {...register("confirmPassword")} placeholder="••••••••" className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground" />
          </div>
          {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="rounded accent-accent" required />
          <span className="text-sm text-muted-foreground">
            I agree to the{" "}
            <a href="#" className="text-accent hover:underline font-medium">Terms of Service</a>
          </span>
        </label>

        <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-accent hover:bg-accent/90 disabled:opacity-70 text-accent-foreground font-bold rounded-lg transition-smooth glow-accent">{isSubmitting ? "Creating Account..." : "Create Account"}</button>
      </form>

      <p className="text-center mt-6 text-muted-foreground">Already have an account? <Link href="/login" className="text-accent font-semibold hover:underline">Sign in</Link></p>
    </div>
  )
}
