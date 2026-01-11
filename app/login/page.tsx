import React, { Suspense } from "react"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import LoginForm from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
      <Footer />
    </main>
  )
}
