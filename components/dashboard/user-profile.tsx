"use client"

interface UserProfileProps {
  profile: any // Handle dynamic data structure
}

export default function UserProfile({ profile }: UserProfileProps) {
  if (!profile) {
    return (
      <div className="w-full">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <p className="text-zinc-500 dark:text-zinc-400">Profile data is missing.</p>
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
    <div className="w-full space-y-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        {/* Avatar with Initial */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-2xl font-bold text-white">
            {initial}
          </div>

          {/* User Info Section */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {displayName}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {email}
            </p>

            {/* Location Badge */}
            {city && (
              <div className="mt-3">
                <span className="inline-block px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs font-medium rounded-full text-zinc-700 dark:text-zinc-300">
                  📍 Location: {city}
                  {country && `, ${country}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {(address || phone) && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            {address && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                📮 Address: {address}
              </p>
            )}
            {phone && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                📱 Phone: {phone}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
