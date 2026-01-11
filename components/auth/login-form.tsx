"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, Lock, Chrome } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export default function LoginForm() {
  const search = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verified = search.get("verified");
    const error = search.get("error");
    if (verified === "true") {
      setMessage("Email Verified! You can now log in.");
    } else if (verified === "false" || error) {
      setWarning("Verification failed.");
    }
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setWarning(null);
    try {
      await login(email, password);
      // AuthProvider.login redirects to / on success
    } catch (err: any) {
      setWarning(err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="glass p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-primary mb-2">Sign in to DuneFlame</h2>
          <p className="text-sm text-muted-foreground mb-6">Welcome back — please enter your credentials.</p>

          {message && <div className="mb-4 p-3 rounded bg-green-50 text-green-800">{message}</div>}
          {warning && <div className="mb-4 p-3 rounded bg-yellow-50 text-amber-800">{warning}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-card"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-card"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background dark:bg-matte-black text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button className="w-full mt-6 py-3 border border-border hover:bg-muted dark:hover:bg-white/5 rounded-lg font-semibold transition-smooth flex items-center justify-center gap-2">
            <Chrome size={20} />
            Google
          </button>

          <p className="mt-4 text-sm text-muted-foreground">
            Don't have an account? <Link href="/register" className="text-accent font-semibold">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
