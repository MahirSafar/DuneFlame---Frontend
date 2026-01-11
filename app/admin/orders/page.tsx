"use client"

import { useState } from "react"
import { Search, Eye, Download } from "lucide-react"

const orders = [
  {
    id: "ORD-001",
    customer: "John Doe",
    email: "john@example.com",
    total: "$145.00",
    status: "Delivered",
    items: 3,
    date: "Jun 15, 2024",
    trackingId: "TRK-123456",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    email: "jane@example.com",
    total: "$89.50",
    status: "Shipped",
    items: 2,
    date: "Jun 14, 2024",
    trackingId: "TRK-123457",
  },
  {
    id: "ORD-003",
    customer: "Mike Johnson",
    email: "mike@example.com",
    total: "$210.00",
    status: "Processing",
    items: 4,
    date: "Jun 13, 2024",
    trackingId: "TRK-123458",
  },
  {
    id: "ORD-004",
    customer: "Sarah Williams",
    email: "sarah@example.com",
    total: "$75.25",
    status: "Pending",
    items: 1,
    date: "Jun 12, 2024",
    trackingId: "TRK-123459",
  },
]

export default function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<(typeof orders)[0] | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const filteredOrders = orders.filter(
    (o) =>
      (searchTerm === "" ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === "all" || o.status.toLowerCase() === filterStatus.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-500/20 text-green-700 dark:text-green-400"
      case "Shipped":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400"
      case "Processing":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400"
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-primary dark:text-secondary mb-2">Orders Management</h1>
        <p className="text-muted-foreground">Track and manage customer orders</p>
      </div>

      {/* Search and Filter */}
      <div className="glass rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by order ID or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-0 pl-12 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent border-0 px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass rounded-xl overflow-hidden card-depth">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/5">
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Order ID</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Customer</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Amount</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Items</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Date</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-accent/5 transition-smooth group">
                  <td className="py-4 px-6">
                    <p className="font-semibold text-foreground">{order.id}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-foreground">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">{order.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-primary dark:text-secondary">{order.total}</td>
                  <td className="py-4 px-6 text-foreground">{order.items}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-muted-foreground text-sm">{order.date}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-smooth">
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setIsDetailsOpen(true)
                        }}
                        className="p-2 hover:bg-accent/20 rounded-lg transition-smooth text-accent"
                      >
                        <Eye size={18} />
                      </button>
                      <button className="p-2 hover:bg-accent/20 rounded-lg transition-smooth text-accent">
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {isDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-dark dark:glass rounded-2xl p-8 max-w-2xl w-full card-depth animate-in zoom-in">
            <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-6">
              Order Details - {selectedOrder.id}
            </h2>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Customer</p>
                  <p className="font-semibold text-foreground">{selectedOrder.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-semibold text-foreground">{selectedOrder.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                  <p className="font-semibold text-primary dark:text-secondary">{selectedOrder.total}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tracking ID</p>
                  <p className="font-semibold text-foreground">{selectedOrder.trackingId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                  <p className="font-semibold text-foreground">{selectedOrder.date}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6 flex gap-4">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent/5 transition-smooth font-medium"
              >
                Close
              </button>
              <button className="flex-1 px-4 py-2 bg-gradient-warm-btn text-accent-foreground rounded-lg font-medium hover:shadow-lg transition-smooth">
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
