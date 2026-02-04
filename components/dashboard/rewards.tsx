"use client"

import type { MyRewards } from "@/lib/services/rewards"
import { Gift } from "lucide-react"

interface RewardsProps {
  rewards: MyRewards
}

export default function Rewards({ rewards }: RewardsProps) {
  // Debug
  console.log("Rewards Data:", rewards)

  // Get balance - handle null/undefined
  const balance = rewards?.stats?.balance ?? 0

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <Gift className="text-orange-600 dark:text-orange-400" size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Reward Points</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">DuneFlame Loyalty</p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="text-center py-6">
          <p className="text-5xl font-bold text-orange-600 dark:text-orange-400">
            {balance.toFixed(2)}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Available Points</p>
        </div>
      </div>
    </div>
  )
}
