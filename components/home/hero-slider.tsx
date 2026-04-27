"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { PublicSlider } from "@/lib/services/sliderService";

interface HeroSliderProps {
  sliders: PublicSlider[];
}

const AUTOPLAY_INTERVAL = 5000;

export default function HeroSlider({ sliders }: HeroSliderProps) {
  if (sliders.length === 0) return null;

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setCurrent((prev) => (prev + 1) % sliders.length);
  }, [sliders.length]);

  useEffect(() => {
    if (paused || sliders.length <= 1) return;
    intervalRef.current = setInterval(advance, AUTOPLAY_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, advance, sliders.length]);

  const slide = sliders[current];

  return (
    <section
      className="relative w-full h-screen overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background image crossfade */}
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          <Image
            src={slide.imageUrl}
            alt={slide.title}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/40 to-black/20 pointer-events-none" />

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${slide.id}`}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h1
            className="text-white font-heading font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl leading-tight drop-shadow-lg"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {slide.title}
          </motion.h1>

          {slide.subtitle && (
            <motion.p
              className="mt-4 text-white/85 text-lg sm:text-xl md:text-2xl max-w-2xl drop-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {slide.subtitle}
            </motion.p>
          )}

          {(slide.buttonText || slide.linkUrl) && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Button asChild size="lg" className="text-base px-8 py-6 rounded-full shadow-xl">
                <Link href={slide.linkUrl || "/shop"}>
                  {slide.buttonText || "Shop Now"}
                </Link>
              </Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dot navigation (only when > 1 slide) */}
      {sliders.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
          {sliders.map((s, i) => (
            <button
              key={s.id}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "bg-white w-7"
                  : "bg-white/50 w-2 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
