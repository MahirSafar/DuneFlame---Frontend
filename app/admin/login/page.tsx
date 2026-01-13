"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail, Lock, Shield, Activity, Users, Package } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/auth-store";
import { getErrorMessage } from "@/lib/utils";

const AdminSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type AdminValues = z.infer<typeof AdminSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminValues>({ 
    resolver: zodResolver(AdminSchema) 
  });

const onSubmit = async (vals: AdminValues) => {
    try {
      await login(vals.email, vals.password);
      const user = useAuthStore.getState().user;
      const roles = (user?.roles as string[] | undefined) || [];
      
      if (roles.includes("Admin")) {
        toast.success("Welcome, admin");
        router.push("/admin/dashboard");
      } else {
        toast.error("Access Denied: Admins only");
        try {
          await logout();
        } catch {}
      }
    } catch (err: any) {
      // --- DÜZƏLİŞ EDİLƏN HİSSƏ ---
      
      // 500 xətaları onsuz da qlobal axios.ts-də tutulur, amma 
      // 401 login zamanı "lokal" xətadır, onu burada göstərməliyik.
      
      // Backend-dən gələn dəqiq mesajı (Invalid credentials) almağa çalışırıq
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.detail || 
        "Invalid email or password"; // Əgər heç nə gəlməsə bu çıxacaq

      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-gradient-to-br from-slate-950 via-orange-950 to-purple-950">
      {/* Left side - 3D Animated Cubes with Bento Grid */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden p-8">
        {/* Animated 3D Cubes Background */}
        <div className="absolute inset-0 perspective-1000">
          {[
            { left: "18%", top: "18%" },
            { left: "62%", top: "26%" },
            { left: "42%", top: "62%" },
            { left: "12%", top: "68%" },
            { left: "72%", top: "44%" },
            { left: "30%", top: "36%" },
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 bg-gradient-to-br from-orange-500/20 to-purple-600/20 backdrop-blur-sm border border-white/10 rounded-2xl"
              style={{
                left: pos.left,
                top: pos.top,
              }}
              animate={{
                rotateX: [0, 360],
                rotateY: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        {/* Floating Orbs */}
        <motion.div
          animate={{ 
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-20 top-20 w-96 h-96 rounded-full bg-gradient-radial from-orange-500/30 via-orange-500/5 to-transparent blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, -40, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-0 bottom-0 w-96 h-96 rounded-full bg-gradient-radial from-purple-600/30 via-purple-600/5 to-transparent blur-3xl"
        />
      </div>

      {/* Right side - Glassmorphism Form */}
      <div className="flex-1 w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        {/* Mobile Background */}
        <div className="absolute inset-0 lg:hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute left-0 top-0 w-96 h-96 rounded-full bg-orange-500/20 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute right-0 bottom-0 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Glassmorphism Card */}
          <div className="relative rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            
            <div className="relative p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 mb-4 shadow-lg shadow-orange-500/50"
                >
                  <Shield className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">Admin Portal</h2>
                <p className="text-white/70">Enter your credentials to continue</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-orange-400 transition-colors" size={20} />
                    <input 
                      {...register("email")} 
                      type="email"
                      placeholder="admin@duneflame.com"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-2 flex items-center gap-1"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-orange-400 transition-colors" size={20} />
                    <input 
                      {...register("password")} 
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-2 flex items-center gap-1"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    "Sign In to Console"
                  )}
                </motion.button>
              </form>

              {/* Footer Note */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-center text-white/50 text-sm">
                  Protected by enterprise-grade security
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -z-10 -inset-4 bg-gradient-to-r from-orange-600/20 to-purple-600/20 rounded-3xl blur-2xl" />
        </motion.div>
      </div>
    </div>
  );
}