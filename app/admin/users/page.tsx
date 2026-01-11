"use client"

import { useState } from "react"
import { Search, Lock, Unlock, Trash2 } from "lucide-react"

const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "Customer",
    joinDate: "Jan 15, 2024",
    orders: 5,
    spent: "$450.00",
    status: "Active",
    locked: false,
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "Customer",
    joinDate: "Feb 20, 2024",
    orders: 12,
    spent: "$1,250.00",
    status: "Active",
    locked: false,
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    role: "Customer",
    joinDate: "Mar 10, 2024",
    orders: 3,
    spent: "$280.50",
    status: "Active",
    locked: false,
  },
  {
    id: 4,
    name: "Sarah Williams",
    email: "sarah@example.com",
    role: "Premium",
    joinDate: "Apr 5, 2024",
    orders: 8,
    spent: "$890.00",
    status: "Active",
    locked: false,
  },
  {
    id: 5,
    name: "Tom Brown",
    email: "tom@example.com",
    role: "Customer",
    joinDate: "May 1, 2024",
    orders: 1,
    spent: "$75.00",
    status: "Inactive",
    locked: true,
  },
]

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<(typeof users)[0] | null>(null)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-primary dark:text-secondary mb-2">Users Management</h1>
        <p className="text-muted-foreground">Manage customer accounts and permissions</p>
      </div>

      {/* Search */}
      <div className="glass rounded-lg p-4">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-0 pl-12 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-xl overflow-hidden card-depth">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/5">
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Name</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Email</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Role</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Orders</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Spent</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Joined</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-accent/5 transition-smooth group">
                  <td className="py-4 px-6">
                    <p className="font-medium text-foreground">{user.name}</p>
                  </td>
                  <td className="py-4 px-6 text-sm text-muted-foreground">{user.email}</td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setIsRoleModalOpen(true)
                      }}
                      className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium hover:bg-accent/20 transition-smooth"
                    >
                      {user.role}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-foreground">{user.orders}</td>
                  <td className="py-4 px-6 font-semibold text-primary dark:text-secondary">{user.spent}</td>
                  <td className="py-4 px-6 text-sm text-muted-foreground">{user.joinDate}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-smooth">
                      <button className="p-2 hover:bg-accent/20 rounded-lg transition-smooth text-accent">
                        {user.locked ? <Unlock size={18} /> : <Lock size={18} />}
                      </button>
                      <button className="p-2 hover:bg-red-500/20 rounded-lg transition-smooth text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {isRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-dark dark:glass rounded-2xl p-8 max-w-md w-full card-depth animate-in zoom-in">
            <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-6">Change User Role</h2>

            <div className="space-y-4 mb-6">
              <p className="text-foreground">
                <span className="text-muted-foreground">Current User:</span> {selectedUser.name}
              </p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Select Role</label>
                <div className="space-y-2">
                  {["Customer", "Premium", "VIP", "Admin"].map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/5 transition-smooth cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        defaultChecked={role === selectedUser.role}
                        className="w-4 h-4 accent-accent"
                      />
                      <span className="text-foreground">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent/5 transition-smooth font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gradient-warm-btn text-accent-foreground rounded-lg font-medium hover:shadow-lg transition-smooth"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
