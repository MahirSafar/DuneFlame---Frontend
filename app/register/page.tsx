import React, { Suspense } from "react";
import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-muted">
        <RegisterForm />
      </div>
    </Suspense>
  );
}
