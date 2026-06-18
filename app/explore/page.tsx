"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { MapPin, SlidersHorizontal } from "lucide-react"
import WeightSliders from "@/components/WeightSliders"
import CityRankingList from "@/components/CityRankingList"
import { scoreCities } from "@/lib/scoring"
import type { Weights } from "@/lib/types"
import citiesRaw from "@/data/cities.json"

const CanadaMap = dynamic(() => import("@/components/CanadaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#e8673a] border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    </div>
  ),
})

const DEFAULT_WEIGHTS: Weights = {
  walkability: 25,
  affordability: 25,
  safety: 25,
  weather: 25,
}

export default function ExplorePage() {
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const [showSliders, setShowSliders] = useState(false)

  const rankedCities = useMemo(
    () => scoreCities(citiesRaw as Parameters<typeof scoreCities>[0], weights),
    [weights]
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-border flex items-center px-5 gap-4">
        <Link href="/" className="flex items-center gap-2 mr-4">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "#e8673a" }}>
            <MapPin size={12} className="text-white" />
          </div>
          <span className="font-semibold text-sm text-foreground">Maple Moving</span>
        </Link>
        <div className="h-4 w-px bg-border" />
        <span className="text-sm text-muted-foreground">Explore Canadian Cities</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {rankedCities.length} CMAs · Weights sum to 100%
          </span>
          {/* Mobile toggle */}
          <button
            onClick={() => setShowSliders(!showSliders)}
            className="sm:hidden flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-1.5 text-foreground"
          >
            <SlidersHorizontal size={12} />
            Priorities
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — weight sliders */}
        <aside
          className={`${
            showSliders ? "flex" : "hidden"
          } sm:flex flex-col w-full sm:w-72 lg:w-80 flex-shrink-0 border-r border-border bg-card overflow-y-auto absolute sm:relative z-20 sm:z-auto inset-0 top-14`}
        >
          <div className="p-5">
            <WeightSliders weights={weights} onChange={setWeights} />
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative min-h-0">
            <CanadaMap
              cities={rankedCities}
              selectedSlug={hoveredSlug ?? undefined}
              onCityClick={() => {}}
            />
          </div>

          {/* Bottom — ranked list */}
          <div className="flex-shrink-0 h-64 border-t border-border bg-background overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rankings
                </h3>
                <span className="text-xs text-muted-foreground">
                  Click any city for full breakdown
                </span>
              </div>
              <CityRankingList
                cities={rankedCities}
                selectedSlug={hoveredSlug ?? undefined}
                onHover={setHoveredSlug}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
