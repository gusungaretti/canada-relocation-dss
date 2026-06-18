"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { SlidersHorizontal } from "lucide-react"
import WeightSliders from "@/components/WeightSliders"
import CityRankingList from "@/components/CityRankingList"
import { scoreCities } from "@/lib/scoring"
import type { Weights, WeatherType, UnitType } from "@/lib/types"
import citiesRaw from "@/data/cities.json"

const CanadaMap = dynamic(() => import("@/components/CanadaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-50">
      <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
    </div>
  ),
})

const DEFAULT_WEIGHTS: Weights = {
  walkability: 0,
  affordability: 0,
  safety: 0,
  weather: 0,
  income: 0,
  transit: 0,
  employment: 0,
  airQuality: 0,
  education: 0,
}

export default function ExplorePage() {
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [weatherType, setWeatherType] = useState<WeatherType>("four_seasons")
  const [unitType, setUnitType] = useState<UnitType>("one_bed")
  const [budget, setBudget] = useState(2000)
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const [showSliders, setShowSliders] = useState(false)

  const rankedCities = useMemo(
    () => scoreCities(citiesRaw as Parameters<typeof scoreCities>[0], weights, weatherType, unitType, budget),
    [weights, weatherType, unitType, budget]
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-black/[0.06] flex items-center px-6 gap-4 bg-white">
        <Link href="/" className="text-sm font-semibold text-black mr-4 hover:opacity-70 transition-opacity">
          Maple Moving
        </Link>
        <div className="h-4 w-px bg-black/10" />
        <span className="text-sm text-neutral-400">Explore Canadian Cities</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-neutral-400 hidden sm:block font-mono">
            {rankedCities.length} CMAs · weights sum to 100%
          </span>
          <button
            onClick={() => setShowSliders(!showSliders)}
            className="sm:hidden flex items-center gap-1.5 text-xs border border-black/10 px-3 py-1.5 text-black"
          >
            <SlidersHorizontal size={12} />
            Priorities
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside
          className={`${
            showSliders ? "flex" : "hidden"
          } sm:flex flex-col w-full sm:w-72 lg:w-80 flex-shrink-0 border-r border-black/[0.06] bg-white overflow-y-auto absolute sm:relative z-20 sm:z-auto inset-0 top-14`}
        >
          <div className="p-6 pt-8">
            <WeightSliders
              weights={weights}
              onChange={setWeights}
              weatherType={weatherType}
              onWeatherTypeChange={setWeatherType}
              unitType={unitType}
              onUnitTypeChange={setUnitType}
              budget={budget}
              onBudgetChange={setBudget}
            />
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative min-h-0 bg-neutral-50">
            <CanadaMap
              cities={rankedCities}
              selectedSlug={hoveredSlug ?? undefined}
              onCityClick={() => {}}
            />
          </div>

          {/* Rankings */}
          <div className="flex-shrink-0 h-64 border-t border-black/[0.06] bg-white overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] sticky top-0 bg-white z-10">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Rankings</span>
              <span className="text-xs text-neutral-400">Click any city for details</span>
            </div>
            <CityRankingList
              cities={rankedCities}
              selectedSlug={hoveredSlug ?? undefined}
              onHover={setHoveredSlug}
              unitType={unitType}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
