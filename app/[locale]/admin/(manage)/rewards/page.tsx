"use client"

import { useState } from "react"
import { Search, Trash2, Edit2 } from "lucide-react"

const rewards = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    balance: 2500,
    earned: 5200,
    redeemed: 2700,
    tier: "Gold",
    lastActivity: "Jun 15, 2024",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    balance: 8500,
    earned: 12500,
    redeemed: 4000,
    tier: "Platinum",
    lastActivity: "Jun 14, 2024",
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    balance: 1200,
    earned: 2800,
    redeemed: 1600,
    tier: "Silver",
    lastActivity: "Jun 13, 2024",
  },
]

export default function AdminRewards() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReward, setSelectedReward] = useState<(typeof rewards)[0] | null>(null)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState(0)

  const filteredRewards = rewards.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-400"
      case "Gold":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400"
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary dark:text-secondary mb-2">Rewards Management</h1>
          <p className="text-muted-foreground">Manage customer loyalty points and rewards</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-xl p-6 card-depth card-float">
          <p className="text-sm text-muted-foreground mb-2">Total Points Distributed</p>
          <h3 className="text-3xl font-bold text-primary dark:text-secondary">156.2K</h3>
          <p className="text-xs text-accent mt-2">All time</p>
        </div>
        <div className="glass rounded-xl p-6 card-depth card-float">
          <p className="text-sm text-muted-foreground mb-2">Points Outstanding</p>
          <h3 className="text-3xl font-bold text-primary dark:text-secondary">52.1K</h3>
          <p className="text-xs text-accent mt-2">Redeemable</p>
        </div>
        <div className="glass rounded-xl p-6 card-depth card-float">
          <p className="text-sm text-muted-foreground mb-2">Avg Points per User</p>
          <h3 className="text-3xl font-bold text-primary dark:text-secondary">1,847</h3>
          <p className="text-xs text-accent mt-2">This month</p>
        </div>
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

      {/* Rewards Table */}
      <div className="glass rounded-xl overflow-hidden card-depth">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/5">
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">User</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Balance</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Earned</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Redeemed</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Tier</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Last Activity</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRewards.map((reward) => (
                <tr key={reward.id} className="border-b border-border hover:bg-accent/5 transition-smooth group">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-foreground">{reward.name}</p>
                      <p className="text-xs text-muted-foreground">{reward.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-lg font-bold text-accent">{reward.balance.toLocaleString()} pts</span>
                  </td>
                  <td className="py-4 px-6 text-foreground">{reward.earned.toLocaleString()} pts</td>
                  <td className="py-4 px-6 text-foreground">{reward.redeemed.toLocaleString()} pts</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTierColor(reward.tier)}`}>
                      {reward.tier}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-muted-foreground">{reward.lastActivity}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-smooth">
                      <button
                        onClick={() => {
                          setSelectedReward(reward)
                          setIsAdjustModalOpen(true)
                        }}
                        className="p-2 hover:bg-accent/20 rounded-lg transition-smooth text-accent"
                      >
                        <Edit2 size={18} />
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

      {/* Adjust Points Modal */}
      {isAdjustModalOpen && selectedReward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-dark dark:glass rounded-2xl p-8 max-w-md w-full card-depth animate-in zoom-in">
            <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-6">Adjust Rewards</h2>

            <div className="space-y-6 mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">User</p>
                <p className="font-semibold text-foreground">{selectedReward.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
                <p className="text-2xl font-bold text-accent">{selectedReward.balance.toLocaleString()} pts</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Adjustment Amount</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number.parseInt(e.target.value))}
                  placeholder="Enter amount (positive or negative)"
                  className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">New Balance</p>
                <p className="text-xl font-bold text-accent">
                  {(selectedReward.balance + adjustAmount).toLocaleString()} pts
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent/5 transition-smooth font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gradient-warm-btn text-accent-foreground rounded-lg font-medium hover:shadow-lg transition-smooth"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
