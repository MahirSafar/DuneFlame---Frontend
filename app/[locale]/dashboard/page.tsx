"use client"

import type { Metadata } from "next"
import { useEffect, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import UserProfile from "@/components/dashboard/user-profile"
import OrderHistory from "@/components/dashboard/order-history"
import Rewards from "@/components/dashboard/rewards"
import { getMyOrders } from "@/lib/services/orders"
import { getMyRewards } from "@/lib/services/rewards"
import { getUserProfile } from "@/lib/services/user"
import type { Order } from "@/lib/services/orders"
import type { MyRewards } from "@/lib/services/rewards"
import type { UserProfile as UserProfileType } from "@/lib/services/user"

export default function DashboardPage() {
  const t = useTranslations("dashboard")
  const locale = useLocale()
  const isArabic = locale === "ar"
  const [profile, setProfile] = useState<UserProfileType | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [rewards, setRewards] = useState<MyRewards | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [userProfileData, ordersData, rewardsData] = await Promise.all([
          getUserProfile(),
          getMyOrders(),
          getMyRewards(),
        ])

        setProfile(userProfileData)
        setOrders(ordersData)
        setRewards(rewardsData)
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
        setError(t("errorLoading"))
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
              <p className="text-muted-foreground mt-2">{t("loadingData")}</p>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t("loading")}</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
            </div>
            <div className="glass rounded-xl p-8 border border-destructive/50">
              <p className="text-destructive font-semibold">{error}</p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       

          <div className="space-y-12">
            {profile && <UserProfile profile={profile} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <OrderHistory orders={orders} />
              </div>
              <div className="lg:col-span-1">
                {rewards && <Rewards rewards={rewards} />}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
