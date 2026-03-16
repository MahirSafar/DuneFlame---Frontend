'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Link } from '@/i18n/routing'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'

type Status = 'loading' | 'success' | 'error'

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    const handleUnsubscribe = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dune-flame-backend-180239181668.me-central1.run.app/api/v1'
        const response = await fetch(`${apiUrl}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`)

        if (!response.ok) {
          throw new Error('Failed to unsubscribe')
        }

        setStatus('success')
      } catch (error) {
        setStatus('error')
      }
    }

    handleUnsubscribe()
  }, [token])

  return (
    <div className="flex items-center justify-center min-h-screen bg-charcoal-roast px-4">
      <Card className="w-full max-w-md bg-dune-paper border-dune-taupe/20 shadow-2xl">
        <CardHeader className="flex flex-col items-center gap-4 text-center">
          {/* Loading State */}
          {status === 'loading' && (
            <>
              <Loader className="h-16 w-16 text-flame-red animate-spin" />
              <h1 className="text-2xl font-bold text-espresso-brown">Processing...</h1>
              <p className="text-sm text-espresso-brown/70">
                Please wait while we process your unsubscribe request.
              </p>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-emerald-600" />
              <h1 className="text-2xl font-bold text-espresso-brown">
                Unsubscribed Successfully
              </h1>
              <p className="text-sm text-espresso-brown/70">
                We're sorry to see you go. You will no longer receive our newsletter campaigns.
              </p>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <AlertCircle className="h-16 w-16 text-red-600" />
              <h1 className="text-2xl font-bold text-espresso-brown">
                Invalid or Expired Link
              </h1>
              <p className="text-sm text-espresso-brown/70">
                The unsubscribe link is no longer valid. It may have expired or already been used.
              </p>
            </>
          )}

          {/* Return Button */}
          {(status === 'success' || status === 'error') && (
            <div className="w-full pt-4">
              <Link href="/" className="block">
                <Button
                  className="w-full bg-flame-red text-white hover:bg-flame-deep transition-colors duration-200"
                  size="lg"
                >
                  Return to Homepage
                </Button>
              </Link>
            </div>
          )}
        </CardHeader>
      </Card>
    </div>
  )
}
