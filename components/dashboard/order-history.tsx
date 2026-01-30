"use client"

import { Calendar, MapPin } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

interface Order {
  id: string
  number: string
  date: Date
  total: number
  status: "delivered" | "processing" | "shipped"
  items: number
}

const ORDERS: Order[] = [
  {
    id: "1",
    number: "#DF-2026-001234",
    date: new Date("2025-12-15"),
    total: 68,
    status: "delivered",
    items: 3,
  },
  {
    id: "2",
    number: "#DF-2025-001233",
    date: new Date("2025-11-28"),
    total: 45,
    status: "delivered",
    items: 2,
  },
  {
    id: "3",
    number: "#DF-2025-001232",
    date: new Date("2025-11-10"),
    total: 92,
    status: "delivered",
    items: 4,
  },
]

const statusColors = {
  delivered: "bg-oasis-teal/10 dark:bg-oasis-teal/20 text-oasis-teal dark:text-oasis-teal",
  processing: "bg-flame-caramel/10 dark:bg-flame-caramel/20 text-flame-caramel dark:text-flame-caramel",
  shipped: "bg-flame-apricot/10 dark:bg-flame-apricot/20 text-flame-apricot dark:text-flame-apricot",
}

export default function OrderHistory() {
  const t = useTranslations()
  const format = useFormatter()
    const statusTranslations = {
      delivered: t("dashboard.orderStatus.delivered", { defaultValue: "Delivered" }),
      processing: t("dashboard.orderStatus.processing", { defaultValue: "Processing" }),
      shipped: t("dashboard.orderStatus.shipped", { defaultValue: "Shipped" }),
    }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-primary dark:text-secondary">Order History</h3>
      {ORDERS.map((order) => (
        <div key={order.id} className="glass rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold text-primary dark:text-secondary mb-1">{order.number}</p>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                    {format.dateTime(order.date, { year: "numeric", month: "long", day: "numeric" })}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  {order.items} item{order.items > 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-accent">${order.total}</p>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[order.status]}`}
                >
                    {statusTranslations[order.status]}
                </span>
              </div>
              <button className="px-4 py-2 border border-border hover:bg-muted rounded-lg transition-smooth font-medium">
                  {t("common.actions.viewDetails")}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
