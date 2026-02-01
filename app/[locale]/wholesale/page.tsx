'use client'

import type { Metadata } from "next"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function WholesalePage() {
  const wholesaleData = {
    title: "Wholesale Partners",
    description: "Join DuneFlame's growing network of wholesale partners and bring premium coffee to your business.",
    benefits: [
      {
        id: 1,
        title: "Competitive Pricing",
        description: "Enjoy exclusive wholesale rates on all coffee products with volume discounts available."
      },
      {
        id: 2,
        title: "Dedicated Support",
        description: "Get access to a dedicated account manager who understands your business needs."
      },
      {
        id: 3,
        title: "Marketing Materials",
        description: "Receive professionally designed marketing materials to promote DuneFlame products."
      },
      {
        id: 4,
        title: "Fast Delivery",
        description: "Reliable and quick delivery across UAE and neighboring regions."
      },
      {
        id: 5,
        title: "Product Training",
        description: "Train your staff on coffee preparation and product knowledge."
      },
      {
        id: 6,
        title: "Flexible Orders",
        description: "Customize order quantities and delivery schedules to fit your needs."
      }
    ],
    process: [
      {
        step: 1,
        title: "Contact Us",
        description: "Reach out to our wholesale team with details about your business."
      },
      {
        step: 2,
        title: "Schedule Consultation",
        description: "We'll arrange a meeting to discuss your needs and requirements."
      },
      {
        step: 3,
        title: "Custom Quote",
        description: "Receive a tailored pricing proposal based on your order volume."
      },
      {
        step: 4,
        title: "Sign Agreement",
        description: "Formalize the partnership with our wholesale agreement."
      },
      {
        step: 5,
        title: "Start Ordering",
        description: "Access your wholesale account and place your first order."
      }
    ]
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-transparent py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
              {wholesaleData.title}
            </h1>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto mb-8">
              {wholesaleData.description}
            </p>
            <Button size="lg" asChild>
              <Link href="/contact">Get Started</Link>
            </Button>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-12 text-center">
              Why Partner With Us?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {wholesaleData.benefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="p-6 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-foreground/70">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-12 text-center">
              Our Process
            </h2>
            <div className="grid md:grid-cols-5 gap-4 md:gap-2">
              {wholesaleData.process.map((item, index) => (
                <div key={item.step} className="relative">
                  <div className="flex flex-col items-center">
                    {/* Step Circle */}
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">
                      {item.step}
                    </div>
                    
                    {/* Connector Line */}
                    {index < wholesaleData.process.length - 1 && (
                      <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-primary/20 transform translate-x-6 -translate-y-1/2"></div>
                    )}

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="font-semibold text-foreground mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-foreground/60">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-4 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
              Ready to Join Our Network?
            </h2>
            <p className="text-lg text-foreground/80 mb-8">
              Contact our wholesale team today to discuss partnership opportunities and get personalized pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/products">View All Products</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
