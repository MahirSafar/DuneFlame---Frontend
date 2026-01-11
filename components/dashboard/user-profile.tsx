"use client"

import { Edit2, LogOut } from "lucide-react"

export default function UserProfile() {
  return (
    <div className="glass rounded-xl p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl">
          ☕
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary dark:text-secondary">Sarah Johnson</h2>
          <p className="text-sm text-muted-foreground">sarah@example.com</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="p-2 hover:bg-accent/10 rounded-lg transition-smooth">
          <Edit2 size={20} />
        </button>
        <button className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-smooth">
          <LogOut size={20} />
        </button>
      </div>
    </div>
  )
}
