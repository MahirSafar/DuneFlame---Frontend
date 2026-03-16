'use client'

import { usePathname, useRouter } from '@/i18n/routing'
import { locales, type Locale } from '@/i18n/routing'
import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useTransition } from 'react'

const localeNames: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
}

const localeFlags: Record<Locale, string> = {
  en: '',
  ar: '',
}

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const locale = useLocale() as Locale
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const currentLocale = locale

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return

    startTransition(() => {
      router.replace(
        // @ts-expect-error - next-intl type is strict on pathnames but we just reuse current one directly
        { pathname, params },
        { locale: newLocale }
      )
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-white hover:text-white text-xs font-medium"
          style={{ backgroundColor: '#2b1b13', borderColor: '#2b1b13' }}
          disabled={isPending}
          aria-label="Select language"
        >
          <span>
            {localeNames[currentLocale]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {locales.map((locale) => (
          <DropdownMenuCheckboxItem
            key={locale}
            checked={locale === currentLocale}
            onCheckedChange={() => handleLocaleChange(locale)}
            className="cursor-pointer"
          >
            <span className="mr-2">{localeFlags[locale]}</span>
            {localeNames[locale]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
