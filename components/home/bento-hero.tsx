"use client"
import { ArrowRight } from "lucide-react"

export default function BentoHero() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
        {/* Large featured item */}
        <div className="md:col-span-2 md:row-span-2 glass-dark dark:glass rounded-2xl p-8 overflow-hidden group cursor-pointer relative card-depth animate-in fade-in duration-700">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-caramel-gold/20 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out" />
          <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-smooth" />
          <div className="relative h-full flex flex-col justify-between">
            <div>
              <span className="text-accent font-semibold text-sm">Featured Blend</span>
              <h2 className="text-4xl font-bold text-primary dark:text-secondary mt-4 leading-tight text-pretty">
                Sunrise Espresso
              </h2>
            </div>
            <div className="flex items-center gap-2 text-accent hover:gap-3 transition-smooth group-hover:translate-x-1">
              <span className="font-semibold">Explore</span>
              <ArrowRight size={20} className="group-hover:scale-125 transition-smooth" />
            </div>
          </div>
        </div>

        {/* Category cards with staggered animation */}
        <div className="glass rounded-2xl p-6 flex flex-col justify-between group cursor-pointer hover:glow-warm card-float transition-all duration-500 ease-in-out animate-in fade-in duration-700 delay-100">
          <span className="text-sm font-semibold text-accent">Category</span>
          <h3 className="text-xl font-bold text-primary dark:text-secondary group-hover:text-accent transition-smooth">
            Coffee Beans
          </h3>
          <p className="text-sm text-muted-foreground">12 Origins</p>
        </div>

        <div className="glass rounded-2xl p-6 flex flex-col justify-between group cursor-pointer hover:glow-warm card-float transition-all duration-500 ease-in-out animate-in fade-in duration-700 delay-200">
          <span className="text-sm font-semibold text-accent">Category</span>
          <h3 className="text-xl font-bold text-primary dark:text-secondary group-hover:text-accent transition-smooth">
            Capsules
          </h3>
          <p className="text-sm text-muted-foreground">8 Varieties</p>
        </div>

        <div className="glass rounded-2xl p-6 flex flex-col justify-between group cursor-pointer hover:glow-warm card-float transition-all duration-500 ease-in-out animate-in fade-in duration-700 delay-300">
          <span className="text-sm font-semibold text-accent">Category</span>
          <h3 className="text-xl font-bold text-primary dark:text-secondary group-hover:text-accent transition-smooth">
            Equipment
          </h3>
          <p className="text-sm text-muted-foreground">Premium Gear</p>
        </div>
      </div>
    </div>
  )
}
