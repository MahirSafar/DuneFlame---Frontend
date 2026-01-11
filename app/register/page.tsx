import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import RegisterForm from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <RegisterForm />
      </div>
      <Footer />
    </main>
  )
}
