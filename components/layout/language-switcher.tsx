'use client'

import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { useTransition } from 'react'

const localeNames: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
}

const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  ar: '🇸🇦',
}

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Get current locale from pathname
  const currentLocale = (pathname.split('/')[1] || 'en') as Locale

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return

    startTransition(() => {
      // Replace the locale in the pathname
      const pathnameWithoutLocale = pathname.replace(`/${currentLocale}`, '')
      const newPath = `/${newLocale}${pathnameWithoutLocale || '/'}`
      router.push(newPath)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-white hover:text-white"
          style={{ backgroundColor: '#4B2E2B', borderColor: '#4B2E2B' }}
          disabled={isPending}
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-medium">
            {localeFlags[currentLocale]} {localeNames[currentLocale]}
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
