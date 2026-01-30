'use client'

import { useLocale } from 'next-intl'
import { Toaster } from 'react-hot-toast'

/**
 * ToasterWrapper - Dynamically positions toast notifications based on locale
 * In Arabic (RTL), toasts appear at top-left
 * In English/LTR, toasts appear at top-right
 */
export function ToasterWrapper() {
  const locale = useLocale()
  const toasterPosition = locale === 'ar' ? 'top-left' : 'top-right'

  return <Toaster position={toasterPosition} />
}
