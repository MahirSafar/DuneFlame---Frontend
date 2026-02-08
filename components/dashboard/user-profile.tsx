"use client"

import { useTranslations, useLocale } from "next-intl"

interface UserProfileProps {
  profile: any // Handle dynamic data structure
}

export default function UserProfile({ profile }: UserProfileProps) {
  const t = useTranslations("dashboard")
  const locale = useLocale()
  const isArabic = locale === "ar"

  if (!profile) {
    return (
      <div className="w-full">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <p className="text-zinc-500 dark:text-zinc-400">{t("profileDataMissing")}</p>
        </div>
      </div>
    )
  }

  // FIX: Data structure can be nested in profile.user object
  const userData = profile.user || profile

  // Smart property mapping
  const firstName = userData.firstName || profile.firstName || ""
  const lastName = userData.lastName || profile.lastName || ""
  const email = userData.email || profile.email || userData.userName || profile.userName || "No email"
  const city = userData.city || profile.city
  const country = userData.country || profile.country
  const phone = userData.phone || profile.phone
  const address = userData.address || profile.address
  const avatarUrl = profile.avatarUrl || userData.avatarUrl

  // Display name: firstName + lastName or email
  const displayName = firstName || lastName
    ? `${firstName} ${lastName}`.trim()
    : email.split("@")[0] || "User"

  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="w-full space-y-4" dir={isArabic ? "rtl" : "ltr"}>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 md:p-6" style={{ boxShadow: "0 8px 16px rgba(230, 211, 191, 0.5)" }}>
        {/* Avatar with Initial */}
        <div className={`flex flex-col md:flex-row ${isArabic ? "md:flex-row-reverse" : ""} md:items-start gap-3 md:gap-4 mb-4`}>
          <div className="flex-shrink-0 w-12 md:w-16 h-12 md:h-16 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold text-white" style={{
            background: 'linear-gradient(0deg, hsla(6, 71%, 47%, 1) 0%, hsla(28, 67%, 66%, 1) 85%, hsla(33, 80%, 75%, 1) 100%)',
          }}>
            {initial}
          </div>

          {/* User Info Section */}
          <div className={`flex-1 text-center ${isArabic ? "md:text-right" : "md:text-left"}`}>
            <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {displayName}
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1 break-all">
              {email}
            </p>

            {/* Location Badge */}
            {city && (
              <div className={`mt-3 flex justify-center ${isArabic ? "md:justify-end" : "md:justify-start"}`}>
                <span className="inline-block px-2 md:px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs font-medium rounded-full text-zinc-700 dark:text-zinc-300">
                  {t("location")} {city}
                  {country && `, ${country}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {(address || phone) && (
          <div className={`mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 ${isArabic ? "text-right" : "text-left"}`}>
            {address && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 break-words">
                {t("address")} {address}
              </p>
            )}
            {phone && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {t("phone")} {phone}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
