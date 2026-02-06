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
      color: "border rounded-full",
      style: { backgroundColor: "#e2a56e", color: "white", borderColor: "#e2a56e" },
    }
  }
  if (s === "paid" || s === "1") {
    return {
      label: "Paid",
      color: "border rounded-full",
      style: { backgroundColor: "#1f6f78", color: "white", borderColor: "#1f6f78" },
    }
  }
  if (s === "shipped" || s === "2") {
    return {
      label: "Shipped",
      color: "border rounded-full",
      style: { backgroundColor: "#2b1b13", color: "white", borderColor: "#2b1b13" },
    }
  }
  if (s === "delivered" || s === "3") {
    return {
      label: "Delivered",
      color: "border rounded-full",
      style: { backgroundColor: "#3e4b3a", color: "white", borderColor: "#3e4b3a" },
    }
  }
  if (s === "cancelled" || s === "4") {
    return {
      label: "Cancelled",
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
            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:shadow-md transition-all hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer" style={{ boxShadow: "0 8px 16px rgba(230, 211, 191, 0.5)" }}>
              {/* Status Badge - Top Right */}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`} style={statusInfo.style}>
                {statusInfo.label}
              </div>

              {/* Details Button - Bottom Right */}
              <button className="absolute bottom-4 right-4 px-2 py-2 text-sm font-medium rounded-lg hover:opacity-70 transition-opacity flex items-center gap-1" style={{ color: '#2b1b13', backgroundColor: 'transparent' }}>
                Details 
                <span style={{ fontSize: '24px', color: '#2b1b13', lineHeight: '1' }}>&rsaquo;</span>
              </button>
              
              {/* Order Content */}
              <div className="flex flex-col gap-3">
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
                    <p className="font-bold" style={{ color: '#2b1b13', fontSize: '24px', fontFamily: '"DIN 2014", sans-serif' }}>
                      {order.currency || "USD"} {Number(order.totalAmount).toFixed(2)}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {new Date(order.createdAt).toLocaleDateString("en-US")} • {order.items?.length || 0} product{(order.items?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
