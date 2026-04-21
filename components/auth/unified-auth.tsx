"use client";

import React, { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Mail, Lock, User, Chrome, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { API_URL } from "@/lib/config";
import { getErrorMessage } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

function LoginPanel() {
  const t = useTranslations("auth.login");
  const { login } = useAuthStore();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const LoginSchema = z.object({
    email: z.string().min(1, t("email")).email(t("email")),
    password: z.string().min(1, t("password")),
  });
  type LoginValues = z.infer<typeof LoginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (vals: LoginValues) => {
    setAuthError(null);
    try {
      await login(vals.email, vals.password);
      toast.success(t("success"));
      router.push("/");
      router.refresh();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        getErrorMessage(err) ||
        "Login failed.";
      setAuthError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="auth-form-box auth-login">
      <h2>{t("title")}</h2>

      {authError && (
        <div className="auth-error">
          <AlertCircle size={16} />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="auth-input-box">
          <input type="email" {...register("email")} required placeholder=" " />
          <label>{t("email")}</label>
          <Mail size={18} className="auth-input-icon" />
          {errors.email && <p className="auth-field-error">{errors.email.message}</p>}
        </div>

        <div className="auth-input-box">
          <input type="password" {...register("password")} required placeholder=" " />
          <label>{t("password")}</label>
          <Lock size={18} className="auth-input-icon" />
          {errors.password && <p className="auth-field-error">{errors.password.message}</p>}
          <Link href="/auth/forgot-password" className="auth-forgot">{t("forgotPassword")}</Link>
        </div>

        <button className="auth-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("signingIn") : t("signIn")}
        </button>

        <div className="auth-divider">
          <span>{t("orContinueWith")}</span>
        </div>

        <button
          type="button"
          className="auth-google-btn"
          onClick={() => { window.location.href = `${API_URL}/auth/external-login?provider=Google`; }}
        >
          <Chrome size={18} />
          {t("google")}
        </button>

        <div className="auth-logreg-link md:hidden">
          <p>
            {t("noAccount")}{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); document.querySelector(".auth-wrapper")?.classList.add("active"); }}>{t("signUp")}</a>
          </p>
        </div>
      </form>
    </div>
  );
}

function RegisterPanel() {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const { register: doRegister } = useAuthStore();

  const RegisterSchema = z
    .object({
      firstName: z.string().min(1, t("firstName")),
      lastName: z.string().min(1, t("lastName")),
      email: z.string().min(1, t("email")).email(t("email")),
      password: z.string().min(8, t("password")),
      confirmPassword: z.string().min(1, t("confirmPassword")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("confirmPassword"),
      path: ["confirmPassword"],
    });
  type RegisterValues = z.infer<typeof RegisterSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = async (vals: RegisterValues) => {
    try {
      await doRegister({ firstName: vals.firstName, lastName: vals.lastName, email: vals.email, password: vals.password });
      router.push("/auth/confirm");
      toast.success(t("success"));
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="auth-form-box auth-register">
      <h2>{t("title")}</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="auth-name-row">
          <div className="auth-input-box auth-half">
            <input {...register("firstName")} required placeholder=" " />
            <label>{t("firstName")}</label>
            <User size={18} className="auth-input-icon" />
            {errors.firstName && <p className="auth-field-error">{errors.firstName.message}</p>}
          </div>
          <div className="auth-input-box auth-half">
            <input {...register("lastName")} required placeholder=" " />
            <label>{t("lastName")}</label>
            <User size={18} className="auth-input-icon" />
            {errors.lastName && <p className="auth-field-error">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="auth-input-box">
          <input type="email" {...register("email")} required placeholder=" " />
          <label>{t("email")}</label>
          <Mail size={18} className="auth-input-icon" />
          {errors.email && <p className="auth-field-error">{errors.email.message}</p>}
        </div>

        <div className="auth-input-box">
          <input type="password" {...register("password")} required placeholder=" " />
          <label>{t("password")}</label>
          <Lock size={18} className="auth-input-icon" />
          {errors.password && <p className="auth-field-error">{errors.password.message}</p>}
        </div>

        <div className="auth-input-box">
          <input type="password" {...register("confirmPassword")} required placeholder=" " />
          <label>{t("confirmPassword")}</label>
          <Lock size={18} className="auth-input-icon" />
          {errors.confirmPassword && <p className="auth-field-error">{errors.confirmPassword.message}</p>}
        </div>

        <label className="auth-terms">
          <input type="checkbox" required />
          <span>{t("termsLabel")} <a href="/policies/terms" className="auth-terms-link">{t("termsLink")}</a></span>
        </label>

        <button className="auth-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("creating") : t("createAccount")}
        </button>

        <div className="auth-divider">
          <span>{t("orContinueWith")}</span>
        </div>

        <button
          type="button"
          className="auth-google-btn"
          onClick={() => { window.location.href = `${API_URL}/auth/external-login?provider=Google`; }}
        >
          <Chrome size={18} />
          {t("google")}
        </button>

        <div className="auth-logreg-link md:hidden">
          <p>
            {t("haveAccount")}{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); document.querySelector(".auth-wrapper")?.classList.remove("active"); }}>{t("signIn")}</a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default function UnifiedAuth({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const [isActive, setIsActive] = useState(initialMode === "register");
  const t = useTranslations("auth");

  return (
    <div className="auth-page">
      <div className={`auth-wrapper ${isActive ? "active" : ""}`}>
        <LoginPanel />
        <RegisterPanel />

        {/* Horizontal sliding overlay */}
        <div className="auth-overlay">
          {/* Shown when register mode is active (covers left/login side) */}
          <div className="auth-overlay-panel auth-overlay-left">
            <h2>{t("overlay.welcomeBack")}</h2>
            <p>{t("overlay.alreadyHaveAccount")}</p>
            <button className="auth-overlay-btn" onClick={() => setIsActive(false)}>
              {t("overlay.signIn")}
            </button>
          </div>

          {/* Shown when login mode is active (covers right/register side) */}
          <div className="auth-overlay-panel auth-overlay-right">
            <h2>{t("overlay.hello")}</h2>
            <p>{t("overlay.enterDetails")}</p>
            <button className="auth-overlay-btn" onClick={() => setIsActive(true)}>
              {t("overlay.signUp")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
