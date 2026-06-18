"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const IMAGE_URL =
  "https://images.unsplash.com/photo-1660143158587-bddffa026e06?auto=format&fit=crop&w=2560&q=85"

export default function ParallaxHero() {
  const bgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!bgRef.current) return
      const scrolled = window.scrollY
      bgRef.current.style.transform = `translateY(${scrolled * 0.38}px)`
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      {/* Parallax background */}
      <div
        ref={bgRef}
        className="absolute inset-0 -top-[15%] -bottom-[15%]"
        style={{
          backgroundImage: `url("${IMAGE_URL}")`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          willChange: "transform",
        }}
      />

      {/* Gradient overlays — bottom-heavy so we can read text + transition to white */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 max-w-6xl mx-auto">
        <p className="text-xs font-mono text-white/60 uppercase tracking-[0.2em] mb-6">
          Canada Relocation Decision Support · MSE 401
        </p>
        <h1 className="text-[clamp(3rem,8vw,6.5rem)] font-bold tracking-[-0.03em] leading-[0.92] text-white mb-8 max-w-4xl drop-shadow-sm">
          Find where you<br />belong in Canada.
        </h1>
        <p className="text-lg text-white/75 max-w-lg leading-relaxed mb-10">
          38 Canadian cities ranked across 9 dimensions — by what matters to you.
        </p>
        <div className="flex items-center gap-5">
          <Link
            href="/explore"
            className="flex items-center gap-2 text-sm font-semibold px-7 py-3.5 bg-white text-black hover:bg-white/90 transition-colors"
          >
            Start exploring
            <ArrowRight size={15} />
          </Link>
          <a
            href="https://github.com/gusungaretti/canada-relocation-dss"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            View source →
          </a>
        </div>
      </div>

      {/* Photo credit */}
      <div className="absolute bottom-36 right-6 z-10 text-[10px] text-white/30 font-mono">
        Photo: Unsplash / Anthony Maw
      </div>
    </section>
  )
}
