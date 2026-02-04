"use client"

import Link from "next/link"

interface OrderHistoryProps {
  orders: any[]
}

// Helper function to handle both string and number statuses
const getStatusBadge = (status: string | number) => {
  // Convert to lowercase string for case-insensitive comparison
  const s = String(status).toLowerCase().trim()

  if (s === "pending" || s === "0") {
    return {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200",
    }
  }
  if (s === "paid" || s === "1") {
    return {
      label: "Paid",
      color: "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200",
    }
  }
  if (s === "shipped" || s === "2") {
    return {
      label: "Shipped",
      color: "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200",
    }
  }
  if (s === "delivered" || s === "3") {
    return {
      label: "Delivered",
      color: "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200",
    }
  }
  if (s === "cancelled" || s === "4") {
    return {
      label: "Cancelled",
      color: "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200",
    }
  }

  // Default: show actual status value
  return {
    label: String(status),
    color: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-900 dark:text-gray-300",
  }
}

export default function OrderHistory({ orders }: OrderHistoryProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">No orders found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order: any) => {
        const statusInfo = getStatusBadge(order.status)

        return (
          <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer">
              {/* Status Badge - Top Right */}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                {statusInfo.label}
              </div>

              {/* Order Content */}
              <div className="flex flex-col gap-3 pr-24">
                {/* Order ID */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Order ID:</span>
                  <span className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-900 dark:text-zinc-100">
                    #{String(order.id).slice(0, 8)}
                  </span>
                </div>

                {/* Price and Date */}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {order.currency || "USD"} {Number(order.totalAmount).toFixed(2)}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {new Date(order.createdAt).toLocaleDateString("en-US")} • {order.items?.length || 0} product{(order.items?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* View Details Button */}
                  <button className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
