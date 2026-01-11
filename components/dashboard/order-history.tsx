"use client"

import { Calendar, MapPin } from "lucide-react"

interface Order {
  id: string
  number: string
  date: string
  total: number
  status: "delivered" | "processing" | "shipped"
  items: number
}

const ORDERS: Order[] = [
  {
    id: "1",
    number: "#DF-2026-001234",
    date: "Dec 15, 2025",
    total: 68,
    status: "delivered",
    items: 3,
  },
  {
    id: "2",
    number: "#DF-2025-001233",
    date: "Nov 28, 2025",
    total: 45,
    status: "delivered",
    items: 2,
  },
  {
    id: "3",
    number: "#DF-2025-001232",
    date: "Nov 10, 2025",
    total: 92,
    status: "delivered",
    items: 4,
  },
]

const statusColors = {
  delivered: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200",
  processing: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200",
  shipped: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200",
}

export default function OrderHistory() {
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
                  {order.date}
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
                  {order.status}
                </span>
              </div>
              <button className="px-4 py-2 border border-border hover:bg-muted rounded-lg transition-smooth font-medium">
                View Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
