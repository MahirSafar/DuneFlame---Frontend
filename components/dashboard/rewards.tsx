"use client"

import { Gift, Zap } from "lucide-react"

export default function Rewards() {
  const pointsEarned = 1240
  const pointsNeeded = 5000
  const progress = (pointsEarned / pointsNeeded) * 100

  return (
    <div className="glass rounded-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <Gift className="text-accent" size={24} />
        <h3 className="text-xl font-bold text-primary dark:text-secondary">DuneFlame Rewards</h3>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-muted-foreground">Points Progress</span>
            <span className="text-xl font-bold text-accent">
              {pointsEarned} / {pointsNeeded}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-orange-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-accent/10 rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-semibold mb-1">NEXT REWARD</p>
            <p className="text-lg font-bold text-accent">${(50 * pointsNeeded) / 5000}</p>
            <p className="text-xs text-muted-foreground mt-1">Free Coffee</p>
          </div>
          <div className="bg-accent/10 rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-semibold mb-1">LIFETIME EARNED</p>
            <p className="text-lg font-bold text-accent">3,420</p>
            <p className="text-xs text-muted-foreground mt-1">Total Points</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-smooth cursor-pointer">
            <Zap size={18} className="text-accent" />
            <span className="text-sm font-medium">Earn 2x points on next purchase</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-smooth cursor-pointer">
            <Zap size={18} className="text-accent" />
            <span className="text-sm font-medium">Birthday bonus (50 points)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
