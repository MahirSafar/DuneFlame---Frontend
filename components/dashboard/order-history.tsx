"use client"

import { Link } from "@/i18n/routing"
import { useTranslations, useLocale } from "next-intl"

interface OrderHistoryProps {
  orders: any[]
}

// Helper function to handle both string and number statuses
const getStatusBadge = (status: string | number, t: (key: string) => string) => {
  // Convert to lowercase string for case-insensitive comparison
  const s = String(status).toLowerCase().trim()

  if (s === "pending" || s === "0") {
    return {
      label: t("orderStatus.pending"),
      color: "border rounded-full",
      style: { backgroundColor: "#e2a56e", color: "white", borderColor: "#e2a56e" },
    }
  }
  if (s === "paid" || s === "1") {
    return {
      label: t("orderStatus.paid"),
      color: "border rounded-full",
      style: { backgroundColor: "#1f6f78", color: "white", borderColor: "#1f6f78" },
    }
  }
  if (s === "shipped" || s === "2") {
    return {
      label: t("orderStatus.shipped"),
      color: "border rounded-full",
      style: { backgroundColor: "#2b1b13", color: "white", borderColor: "#2b1b13" },
    }
  }
  if (s === "delivered" || s === "3") {
    return {
      label: t("orderStatus.delivered"),
      color: "border rounded-full",
      style: { backgroundColor: "#3e4b3a", color: "white", borderColor: "#3e4b3a" },
    }
  }
  if (s === "cancelled" || s === "4") {
    return {
      label: t("orderStatus.cancelled"),
      color: "border rounded-full",
      style: { backgroundColor: "#a3291c", color: "white", borderColor: "#a3291c" },
    }
  }

  // Default: show actual status value
  return {
    label: String(status),
    color: "border rounded-full",
    style: { backgroundColor: "#cccccc", color: "#333333", borderColor: "#cccccc" },
  }
}

export default function OrderHistory({ orders }: OrderHistoryProps) {
  const t = useTranslations("dashboard")
  const locale = useLocale()
  const isArabic = locale === "ar"

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">{t("noOrders")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order: any) => {
        const statusInfo = getStatusBadge(order.status, t)

        return (
          <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:shadow-md transition-all hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer" style={{ boxShadow: "0 8px 16px rgba(230, 211, 191, 0.5)" }}>
              {/* Header: Status and Details */}
              <div className={`flex items-start justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-700 ${isArabic ? "flex-row-reverse" : ""}`}>
                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-bold border`} style={statusInfo.style}>
                  {statusInfo.label}
                </div>
                
                {/* Details Arrow */}
                <span style={{ fontSize: '20px', color: '#2b1b13' }}>{isArabic ? "‹" : "›"}</span>
              </div>

              {/* Order Content */}
              <div className="space-y-4" style={{ textAlign: isArabic ? "right" : "left" }}>
                {/* Order ID */}
                <div className={`flex items-center gap-3 ${isArabic ? "flex-row-reverse" : ""}`}>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{t("orderId")}:</span>
                  <span className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded text-zinc-900 dark:text-zinc-100">
                    #{String(order.id).slice(0, 8)}
                  </span>
                </div>

                {/* Price and Date */}
                <div>
                  <p className="font-bold" style={{ color: '#2b1b13', fontSize: '22px', fontFamily: '"DIN 2014", sans-serif' }}>
                    {order.currency || "USD"} {Number(order.totalAmount).toFixed(2)}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                    {new Date(order.createdAt).toLocaleDateString("en-US")} • {order.items?.length || 0} {(order.items?.length || 0) !== 1 ? t("productsPlural") : t("products")}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
