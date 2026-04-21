"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface TruckButtonProps {
  defaultText: string
  successText: string
  loadingText?: string
  disabled?: boolean
  onClick?: () => boolean | void | Promise<boolean | void>
  className?: string
}

export function TruckButton({
  defaultText,
  successText,
  loadingText,
  disabled = false,
  onClick,
  className = "",
}: TruckButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const truckRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<"idle" | "animating" | "done">("idle")

  // Reset CSS custom properties
  const resetButton = useCallback(() => {
    const btn = buttonRef.current
    const box = boxRef.current
    if (!btn || !box) return

    btn.style.setProperty("--progress", "0")
    btn.style.setProperty("--hx", "0")
    btn.style.setProperty("--bx", "0")
    btn.style.setProperty("--box-s", "0.5")
    btn.style.setProperty("--box-o", "0")
    btn.style.setProperty("--truck-y", "0")
    btn.style.setProperty("--truck-y-n", "-26")
    btn.style.setProperty("--truck-x", "4")
    box.style.transform = ""
    setPhase("idle")
  }, [])

  // Animate a CSS custom property on an element
  const animateProp = useCallback(
    (el: HTMLElement, prop: string, from: number, to: number, duration: number) =>
      new Promise<void>((resolve) => {
        const start = performance.now()
        const step = (now: number) => {
          const t = Math.min((now - start) / duration, 1)
          // ease in-out cubic
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
          const val = from + (to - from) * eased
          el.style.setProperty(prop, String(val))
          if (t < 1) requestAnimationFrame(step)
          else resolve()
        }
        requestAnimationFrame(step)
      }),
    []
  )

  // Animate box translateX via inline transform
  const animateBoxX = useCallback(
    (el: HTMLElement, from: number, to: number, duration: number) =>
      new Promise<void>((resolve) => {
        const start = performance.now()
        const step = (now: number) => {
          const t = Math.min((now - start) / duration, 1)
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
          const val = from + (to - from) * eased
          el.style.transform = `translateX(${val}px)`
          if (t < 1) requestAnimationFrame(step)
          else resolve()
        }
        requestAnimationFrame(step)
      }),
    []
  )

  // Imperative animation using requestAnimationFrame + CSS custom properties
  const runAnimation = useCallback(async () => {
    const btn = buttonRef.current
    const box = boxRef.current
    const truck = truckRef.current
    if (!btn || !box || !truck) return

    setPhase("animating")

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

    // Execute the callback (e.g. form submission) BEFORE the truck animation
    if (onClick) {
      try {
        const result = await onClick()
        if (result === false) {
          resetButton()
          return
        }
      } catch {
        resetButton()
        return
      }
    }

    // Phase 1: Box appears
    await delay(150)
    btn.style.setProperty("--box-s", "1")
    btn.style.setProperty("--box-o", "1")

    // Phase 2: Box slides in
    await delay(100)
    await animateBoxX(box, -24, 0, 250)

    // Phase 3: Box closes
    btn.style.setProperty("--hx", "-5")
    btn.style.setProperty("--bx", "50")
    await delay(100)

    // Phase 4: Box drops
    box.style.transform = "translateX(0px) translateY(0px)"
    await delay(60)

    // Phase 5: Truck bounce
    btn.style.setProperty("--truck-y", "0")
    btn.style.setProperty("--truck-y-n", "-26")
    await delay(30)
    btn.style.setProperty("--truck-y", "1")
    btn.style.setProperty("--truck-y-n", "-25")

    await delay(100)

    // Phase 6: Truck drives across + progress bar fill IN PARALLEL
    // Calculate dynamic end position based on actual button width
    const btnWidth = btn.offsetWidth
    const truckEnd = btnWidth + 20 // drive off the right edge
    const midPoint = Math.round(btnWidth * 0.45)
    const brakePoint = Math.round(btnWidth * 0.35)

    // Start progress bar (runs on its own via rAF)
    const progressStart = performance.now()
    const progressDuration = 1400
    const progressStep = (now: number) => {
      const t = Math.min((now - progressStart) / progressDuration, 1)
      const eased = t * t
      btn.style.setProperty("--progress", String(eased))
      if (t < 1) requestAnimationFrame(progressStep)
    }
    requestAnimationFrame(progressStep)

    // Truck moves via --truck-x custom property (in parallel with progress)
    await animateProp(btn, "--truck-x", 4, 0, 200)
    await animateProp(btn, "--truck-x", 0, midPoint, 500)
    await animateProp(btn, "--truck-x", midPoint, brakePoint, 300)
    await animateProp(btn, "--truck-x", brakePoint, truckEnd, 400)

    setPhase("done")
  }, [onClick, resetButton, animateProp, animateBoxX])

  const handleClick = useCallback(() => {
    if (disabled || phase !== "idle") return
    runAnimation()
  }, [disabled, phase, runAnimation])

  // Allow resetting from outside if needed
  useEffect(() => {
    return () => resetButton()
  }, [resetButton])

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`truck-button ${phase === "animating" ? "animation" : ""} ${phase === "done" ? "animation done" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className="default">
        {phase === "animating" && loadingText ? loadingText : defaultText}
      </span>
      <span className="success">
        {successText}
        <svg viewBox="0 0 12 10">
          <polyline points="1.5 6 4.5 9 10.5 1" />
        </svg>
      </span>
      <div className="truck" ref={truckRef}>
        <div className="wheel" />
        <div className="back" />
        <div className="front" />
        <div className="box" ref={boxRef} />
      </div>
    </button>
  )
}
