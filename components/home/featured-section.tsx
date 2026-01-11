"use client"

import { ArrowRight } from "lucide-react"

interface FeaturedItem {
  id: string
  title: string
  description: string
  image?: string
  tag: string
}

const FEATURED_ITEMS: FeaturedItem[] = [
  {
    id: "1",
    title: "Limited Edition",
    description: "Ethiopian Yirgacheffe - Floral & Bright",
    tag: "New Arrival",
  },
  {
    id: "2",
    title: "Roaster's Selection",
    description: "Exclusive single-origin blends",
    tag: "Curated",
  },
]

export default function FeaturedSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <span className="text-accent font-semibold text-sm uppercase tracking-wider">Discover</span>
        <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-secondary mt-2 leading-tight">
          The Art of <span className="text-accent">Exceptional Coffee</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURED_ITEMS.map((item) => (
          <div key={item.id} className="glass rounded-2xl p-8 group cursor-pointer hover:glow-accent transition-smooth">
            <div className="flex flex-col justify-between h-full">
              <div>
                <span className="text-accent font-semibold text-xs uppercase tracking-wider">{item.tag}</span>
                <h3 className="text-3xl font-bold text-primary dark:text-secondary mt-4 mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-accent group-hover:gap-4 transition-all">
                <span className="font-semibold">Learn More</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
