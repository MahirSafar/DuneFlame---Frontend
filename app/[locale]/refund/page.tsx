"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function RefundRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("./policies?tab=refund")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to refund policy...</p>
    </div>
  )
}
