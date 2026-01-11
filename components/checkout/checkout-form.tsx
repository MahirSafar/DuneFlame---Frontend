"use client"

import type React from "react"
import { useState } from "react"
import { MapPin, CreditCard, CheckCircle } from "lucide-react"

type CheckoutStep = "address" | "payment" | "confirmation"

export default function CheckoutForm() {
  const [step, setStep] = useState<CheckoutStep>("address")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === "address") setStep("payment")
    else if (step === "payment") setStep("confirmation")
  }

  const progress = step === "address" ? 33 : step === "payment" ? 66 : 100

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-8">
            <div className={`text-center ${step === "address" ? "text-accent" : "text-muted-foreground"}`}>
              <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mx-auto mb-2 font-bold">
                1
              </div>
              <p className="text-xs font-semibold">Shipping</p>
            </div>
            <div
              className={`text-center ${step === "payment" || step === "confirmation" ? "text-accent" : "text-muted-foreground"}`}
            >
              <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mx-auto mb-2 font-bold">
                2
              </div>
              <p className="text-xs font-semibold">Payment</p>
            </div>
            <div className={`text-center ${step === "confirmation" ? "text-accent" : "text-muted-foreground"}`}>
              <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mx-auto mb-2 font-bold">
                3
              </div>
              <p className="text-xs font-semibold">Confirm</p>
            </div>
          </div>
        </div>
        <div className="w-full bg-border rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-orange-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {step !== "confirmation" && (
        <form onSubmit={handleNextStep} className="space-y-6">
          {step === "address" && (
            <div className="glass rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="text-accent" size={24} />
                <h2 className="text-2xl font-bold text-primary dark:text-secondary">Shipping Address</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />

              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />

              <input
                type="text"
                name="address"
                placeholder="Street Address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <input
                  type="text"
                  name="zipCode"
                  placeholder="ZIP Code"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg transition-smooth glow-accent"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="glass rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="text-accent" size={24} />
                <h2 className="text-2xl font-bold text-primary dark:text-secondary">Payment Details</h2>
              </div>

              <input
                type="text"
                name="cardName"
                placeholder="Cardholder Name"
                value={formData.cardName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />

              <input
                type="text"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <input
                  type="text"
                  name="cvv"
                  placeholder="CVV"
                  value={formData.cvv}
                  onChange={handleChange}
                  className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep("address")}
                  className="flex-1 py-3 border border-border hover:bg-muted rounded-lg font-bold transition-smooth"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg transition-smooth glow-accent"
                >
                  Review Order
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {step === "confirmation" && (
        <div className="glass rounded-2xl p-8 text-center space-y-6">
          <CheckCircle className="w-16 h-16 text-accent mx-auto" />
          <div>
            <h2 className="text-3xl font-bold text-primary dark:text-secondary mb-2">Order Confirmed!</h2>
            <p className="text-muted-foreground">Thank you for your purchase. Your coffee is on its way!</p>
          </div>
          <div className="bg-accent/10 rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Order Number</p>
            <p className="text-2xl font-bold text-accent">#DF-2026-001234</p>
          </div>
          <a
            href="/products"
            className="inline-block px-8 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg transition-smooth"
          >
            Continue Shopping
          </a>
        </div>
      )}
    </div>
  )
}
