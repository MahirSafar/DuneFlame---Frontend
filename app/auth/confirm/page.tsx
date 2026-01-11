export default function ConfirmPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-xl w-full glass rounded-2xl p-10 text-center">
        <h1 className="text-3xl font-bold text-primary mb-4">Please confirm your account</h1>
        <p className="text-muted-foreground mb-6">
          We've sent a confirmation email to the address you provided. Click the verification link in that email to
          activate your account.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          If you don't see the email, check your spam folder or click the button below to resend.
        </p>
        <div className="flex justify-center gap-4">
          <a href="/login" className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold">
            Back to Login
          </a>
        </div>
      </div>
    </main>
  )
}
