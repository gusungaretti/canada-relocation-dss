"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { SlidersHorizontal, Search } from "lucide-react"
import WeightSliders from "@/components/WeightSliders"
import CityRankingList from "@/components/CityRankingList"
import CityComparisonPanel from "@/components/CityComparisonPanel"
import { setHasActiveFactors } from "@/components/ScoreText"
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

const WEATHER_VALUES: WeatherType[] = ["warm", "mild", "four_seasons", "dry"]
const UNIT_VALUES: UnitType[] = ["studio", "one_bed", "two_bed", "three_bed"]

function usePersisted<T>(key: string, value: T, isValid: (v: unknown) => v is T, setValue: (v: T) => void) {
  const skipNextSave = useRef(true)

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }, [key, value]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return
      const parsed = JSON.parse(raw)
      if (isValid(parsed)) setValue(parsed)
    } catch {
      // ignore malformed storage
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

export default function ExplorePage() {
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [weatherType, setWeatherType] = useState<WeatherType>("four_seasons")
  const [unitType, setUnitType] = useState<UnitType>("one_bed")
  const [budget, setBudget] = useState(2000)
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const [showSliders, setShowSliders] = useState(false)
  const [compareSet, setCompareSet] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)

  usePersisted<WeatherType>(
    "mm_weatherType", weatherType,
    (v): v is WeatherType => typeof v === "string" && WEATHER_VALUES.includes(v as WeatherType),
    setWeatherType
  )
  usePersisted<UnitType>(
    "mm_unitType", unitType,
    (v): v is UnitType => typeof v === "string" && UNIT_VALUES.includes(v as UnitType),
    setUnitType
  )
  usePersisted<number>(
    "mm_budget", budget,
    (v): v is number => typeof v === "number" && Number.isFinite(v) && v >= 500 && v <= 5000,
    setBudget
  )

  function toggleCompare(slug: string) {
    setCompareSet(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug].slice(0, 4)
    )
  }

  const rankedCities = useMemo(
    () => scoreCities(citiesRaw as Parameters<typeof scoreCities>[0], weights, weatherType, unitType, budget),
    [weights, weatherType, unitType, budget]
  )

  const hasActiveFactors = useMemo(
    () => Object.values(weights).some(w => w > 0),
    [weights]
  )

  useEffect(() => {
    setHasActiveFactors(hasActiveFactors)
  }, [hasActiveFactors])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {showComparison && (
        <CityComparisonPanel
          cities={rankedCities}
          compareSet={compareSet}
          weights={weights}
          onClose={() => setShowComparison(false)}
        />
      )}
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-black/[0.06] flex items-center px-6 gap-4 bg-white">
        <Link href="/" className="text-sm font-semibold text-black mr-4 hover:opacity-70 transition-opacity">
          Maple Moving
        </Link>
        <div className="h-4 w-px bg-black/10" />
        <span className="text-sm text-neutral-400">Explore Canadian Cities</span>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/search"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-black transition-colors"
          >
            <Search size={12} />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <Link
            href="/methodology"
            className="text-xs text-neutral-400 hover:text-black transition-colors hidden sm:block"
          >
            How scoring works
          </Link>
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
              hasActiveFactors={hasActiveFactors}
            />
          </div>

          {/* Rankings */}
          <div className="flex-shrink-0 h-64 border-t border-black/[0.06] bg-white overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] sticky top-0 bg-white z-10">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Rankings</span>
              <div className="flex items-center gap-3">
                {compareSet.length >= 2 && (
                  <button
                    onClick={() => setShowComparison(true)}
                    className="text-xs font-medium px-3 py-1 bg-black text-white hover:bg-neutral-700 transition-colors"
                  >
                    Compare ({compareSet.length})
                  </button>
                )}
                <span className="text-xs text-neutral-400">+ to compare</span>
              </div>
            </div>
            <CityRankingList
              cities={rankedCities}
              selectedSlug={hoveredSlug ?? undefined}
              onHover={setHoveredSlug}
              unitType={unitType}
              hasActiveFactors={hasActiveFactors}
              compareSet={compareSet}
              onToggleCompare={toggleCompare}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
