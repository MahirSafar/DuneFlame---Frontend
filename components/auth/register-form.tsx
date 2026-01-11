"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, User } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { register: doRegister, loggingIn, setFromStorage } = useAuthStore()

  useEffect(() => {
    setFromStorage()
  }, [setFromStorage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    try {
      await doRegister({ firstName, lastName, email, password })
      router.push("/auth/confirm")
    } catch (err: any) {
      setError(err?.message || "Registration failed")
    }
  }

  return (
    <div className="glass rounded-2xl p-8 max-w-md w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-secondary">Join DuneFlame</h1>
        <p className="text-muted-foreground mt-2">Create your account to start exploring</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">First Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">Last Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary dark:text-secondary mb-2">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="rounded accent-accent" required />
          <span className="text-sm text-muted-foreground">
            I agree to the{" "}
            <a href="#" className="text-accent hover:underline font-medium">
              Terms of Service
            </a>
          </span>
        </label>

        <button
          type="submit"
          disabled={loggingIn}
          className="w-full py-3 bg-accent hover:bg-accent/90 disabled:opacity-70 text-accent-foreground font-bold rounded-lg transition-smooth glow-accent"
        >
          {loggingIn ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <p className="text-center mt-6 text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-accent font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
