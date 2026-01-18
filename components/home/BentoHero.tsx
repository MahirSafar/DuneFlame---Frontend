"use client"

import { useState, useEffect, useRef } from "react"
import { useDarkMode } from "@/lib/dark-mode-context"

interface Card {
  id: number
  title: string
  description: string
  image: string
  gradient: string
}

const CARDS: Card[] = [
  {
    id: 1,
    title: "Desert Awakening",
    description: "Where sand meets fire",
    image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&h=800&fit=crop&q=80",
    gradient: "from-amber-500/70 via-orange-500/60 to-rose-500/70"
  },
  {
    id: 2,
    title: "Crimson Dunes",
    description: "Eternal flame horizon",
    image: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1200&h=800&fit=crop&q=80",
    gradient: "from-rose-500/70 via-pink-500/60 to-orange-500/70"
  },
  {
    id: 3,
    title: "Golden Mirage",
    description: "Shifting ember waves",
    image: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200&h=800&fit=crop&q=80",
    gradient: "from-yellow-500/70 via-amber-500/60 to-orange-500/70"
  },
  {
    id: 4,
    title: "Volcanic Whisper",
    description: "Ancient fire speaks",
    image: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200&h=800&fit=crop&q=80",
    gradient: "from-orange-600/70 via-red-500/60 to-pink-600/70"
  },
  {
    id: 5,
    title: "Sunset Infinity",
    description: "Blazing eternity",
    image: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1200&h=800&fit=crop&q=80",
    gradient: "from-pink-500/70 via-rose-500/60 to-orange-500/70"
  },
  {
    id: 6,
    title: "Phoenix Rising",
    description: "Rebirth in flames",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=800&fit=crop&q=80",
    gradient: "from-amber-600/70 via-yellow-500/60 to-orange-600/70"
  },
]

export default function BootstrapHeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { isDarkMode } = useDarkMode()
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  const startAutoPlay = () => {
    stopAutoPlay()
    autoPlayRef.current = setInterval(() => {
      handleNext()
    }, 4000)
  }

  const stopAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      autoPlayRef.current = null
    }
  }

  useEffect(() => {
    startAutoPlay()
    return () => stopAutoPlay()
  }, [])

  const handleNext = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % CARDS.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const handlePrev = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + CARDS.length) % CARDS.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const getVisibleCards = () => {
    const cards = []
    for (let i = 0; i < 6; i++) {
      const index = (currentIndex + i) % CARDS.length
      cards.push({ ...CARDS[index], position: i })
    }
    return cards
  }

  const visibleCards = getVisibleCards()
  const mainCard = visibleCards[0]
  const sideCards = visibleCards.slice(1)

  return (
    <div className="min-h-screen overflow-hidden transition-colors duration-500" style={{ backgroundColor: isDarkMode ? 'rgb(0, 0, 0)' : 'rgb(250, 250, 250)' }}>
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Hero Container */}
      <div className="relative h-screen w-full flex items-center justify-center p-0">
        <div className="w-full max-w-[1400px] h-[77vh] relative overflow-hidden">
          
          {/* Carousel Track */}
          <div 
            className="h-full flex gap-3 transition-transform duration-600 ease-out"
            style={{
              transform: `translateX(0)`,
              willChange: 'transform'
            }}
          >
            {/* Main Card */}
            <div className="flex-shrink-0" style={{ width: '69%' }}>
              <div className="relative h-full rounded-3xl overflow-hidden shadow-2xl group">
                {/* Image */}
                <img
                  src={mainCard.image}
                  alt={mainCard.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />

                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${mainCard.gradient} mix-blend-multiply`} />

                {/* Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Animated Shine */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                    animation: "shine 2s infinite"
                  }}
                />

                {/* Border Glow */}
                <div className="absolute inset-0 ring-1 ring-white/20 rounded-3xl" />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-between p-8 sm:p-12 lg:p-16">
                  <div>
                    <span className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-bold text-white bg-white/10 backdrop-blur-xl rounded-full border border-white/30">
                      <div className="w-2.5 h-2.5 rounded-full bg-white shadow-lg animate-pulse" />
                      FEATURED
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-none tracking-tight drop-shadow-2xl">
                      {mainCard.title}
                    </h1>
                    <p className="text-xl sm:text-2xl lg:text-3xl text-white/95 font-light tracking-wide">
                      {mainCard.description}
                    </p>
                    <div className="flex items-center gap-4 pt-4">
                      <div className="h-0.5 w-20 bg-white/50 rounded-full" />
                      <span className="text-sm text-white/80 uppercase tracking-widest font-bold">Explore</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Cards */}
            <div className="flex-shrink-0 flex flex-col gap-3" style={{ width: '%' }}>
              {sideCards.map((card, idx) => (
                <div 
                  key={`${card.id}-${card.position}`}
                  className="flex-1 rounded-2xl overflow-hidden shadow-xl cursor-pointer group transition-transform hover:scale-[1.02]"
                  onClick={handleNext}
                  onMouseEnter={stopAutoPlay}
                  onMouseLeave={startAutoPlay}
                >
                  <div className="relative w-full h-full">
                    {/* Image */}
                    <img
                      src={card.image}
                      alt={card.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />

                    {/* Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} mix-blend-multiply opacity-70 group-hover:opacity-85 transition-opacity`} />

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                    {/* Border */}
                    <div className="absolute inset-0 ring-1 ring-white/20 group-hover:ring-white/40 transition-all rounded-2xl" />

                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-end p-4 lg:p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                        <span className="text-xs text-white/80 uppercase tracking-wider font-bold">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h3 className="text-base lg:text-lg font-bold text-white truncate tracking-tight mb-1">
                        {card.title}
                      </h3>
                      <p className="text-xs lg:text-sm text-white/85 truncate font-light">
                        {card.description}
                      </p>
                    </div>

                    {/* Hover Indicator */}
                    <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-white/70 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}