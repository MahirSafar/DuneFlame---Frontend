import React, { Suspense } from "react";
import LoginForm from "@/components/auth/login-form";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
