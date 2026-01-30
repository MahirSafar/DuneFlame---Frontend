"use client"

import { useState } from "react"
import { Save, RotateCcw, Bell, Lock, Palette } from "lucide-react"

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    storeName: "DuneFlame Coffee",
    email: "admin@duneflame.com",
    phone: "+1 (555) 000-0000",
    currency: "USD",
    taxRate: "8.5",
    freeShippingThreshold: "50",
    notifyOnOrder: true,
    notifyOnLowStock: true,
    lowStockThreshold: "10",
    primaryColor: "#ff6b00",
    accentColor: "#c68e4a",
    enableRewards: true,
    pointsPerDollar: "1",
    analyticsTrackingId: "GA-123456789",
  })

  const handleChange = (field: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = () => {
    // Save settings
    alert("Settings saved successfully!")
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-primary dark:text-secondary mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage store configuration and preferences</p>
      </div>

      {/* Store Settings */}
      <div className="glass rounded-xl p-8 card-depth space-y-6">
        <h2 className="text-2xl font-bold text-primary dark:text-secondary flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">🏪</span>
          Store Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Store Name</label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => handleChange("storeName", e.target.value)}
              className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Admin Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => handleChange("currency", e.target.value)}
              className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>CAD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing & Shipping */}
      <div className="glass rounded-xl p-8 card-depth space-y-6">
        <h2 className="text-2xl font-bold text-primary dark:text-secondary flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">📦</span>
          Pricing & Shipping
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tax Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings.taxRate}
              onChange={(e) => handleChange("taxRate", e.target.value)}
              className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Free Shipping Threshold ($)</label>
            <input
              type="number"
              value={settings.freeShippingThreshold}
              onChange={(e) => handleChange("freeShippingThreshold", e.target.value)}
              className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass rounded-xl p-8 card-depth space-y-6">
        <h2 className="text-2xl font-bold text-primary dark:text-secondary flex items-center gap-2">
          <Bell size={24} />
          Notifications
        </h2>

        <div className="space-y-4">
          <label className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:bg-accent/5 transition-smooth">
            <input
              type="checkbox"
              checked={settings.notifyOnOrder}
              onChange={(e) => handleChange("notifyOnOrder", e.target.checked)}
              className="w-4 h-4 accent-accent cursor-pointer"
            />
            <div>
              <p className="font-medium text-foreground">Notify on New Orders</p>
              <p className="text-sm text-muted-foreground">Receive email when customers place orders</p>
            </div>
          </label>

          <label className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:bg-accent/5 transition-smooth">
            <input
              type="checkbox"
              checked={settings.notifyOnLowStock}
              onChange={(e) => handleChange("notifyOnLowStock", e.target.checked)}
              className="w-4 h-4 accent-accent cursor-pointer"
            />
            <div>
              <p className="font-medium text-foreground">Notify on Low Stock</p>
              <p className="text-sm text-muted-foreground">Receive alert when inventory is low</p>
            </div>
          </label>

          {settings.notifyOnLowStock && (
            <div className="ml-8">
              <label className="block text-sm font-medium text-foreground mb-2">Low Stock Threshold</label>
              <input
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => handleChange("lowStockThreshold", e.target.value)}
                className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Theme & Branding */}
      <div className="glass rounded-xl p-8 card-depth space-y-6">
        <h2 className="text-2xl font-bold text-primary dark:text-secondary flex items-center gap-2">
          <Palette size={24} />
          Theme & Branding
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => handleChange("primaryColor", e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border border-border"
              />
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => handleChange("primaryColor", e.target.value)}
                className="flex-1 bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => handleChange("accentColor", e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border border-border"
              />
              <input
                type="text"
                value={settings.accentColor}
                onChange={(e) => handleChange("accentColor", e.target.value)}
                className="flex-1 bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className="glass rounded-xl p-8 card-depth space-y-6">
        <h2 className="text-2xl font-bold text-primary dark:text-secondary flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">🎁</span>
          Rewards Program
        </h2>

        <label className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:bg-accent/5 transition-smooth">
          <input
            type="checkbox"
            checked={settings.enableRewards}
            onChange={(e) => handleChange("enableRewards", e.target.checked)}
            className="w-4 h-4 accent-accent cursor-pointer"
          />
          <div>
            <p className="font-medium text-foreground">Enable Rewards Program</p>
            <p className="text-sm text-muted-foreground">Allow customers to earn and redeem loyalty points</p>
          </div>
        </label>

        {settings.enableRewards && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Points Per Dollar</label>
            <input
              type="number"
              step="0.1"
              value={settings.pointsPerDollar}
              onChange={(e) => handleChange("pointsPerDollar", e.target.value)}
              className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        )}
      </div>

      {/* Analytics */}
      <div className="glass rounded-xl p-8 card-depth space-y-6">
        <h2 className="text-2xl font-bold text-primary dark:text-secondary flex items-center gap-2">
          <Lock size={24} />
          Analytics & Tracking
        </h2>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Google Analytics Tracking ID</label>
          <input
            type="text"
            value={settings.analyticsTrackingId}
            onChange={(e) => handleChange("analyticsTrackingId", e.target.value)}
            placeholder="GA-xxxxxxxxxx"
            className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">Optional: Enter your tracking ID for analytics</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 sticky bottom-8">
        <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg text-foreground hover:bg-accent/5 transition-smooth font-semibold">
          <RotateCcw size={20} />
          Reset Changes
        </button>
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-warm-btn text-accent-foreground rounded-lg font-semibold hover:shadow-lg transition-smooth"
        >
          <Save size={20} />
          Save Settings
        </button>
      </div>
    </div>
  )
}
