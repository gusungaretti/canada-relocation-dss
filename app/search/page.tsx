"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { scoreCities } from "@/lib/scoring"
import CitySearchResults from "@/components/CitySearchResults"
import CityComparisonPanel from "@/components/CityComparisonPanel"
import citiesRaw from "@/data/cities.json"
import suburbsRaw from "@/data/suburbs.json"
import type { City, Weights } from "@/lib/types"

const cities = citiesRaw as City[]
const suburbs = suburbsRaw as City[]

const EQUAL_WEIGHTS: Weights = {
  walkability: 11, affordability: 11, safety: 11, weather: 11,
  income: 11, transit: 11, employment: 11, airQuality: 12, education: 11,
}

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [compareSet, setCompareSet] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)

  function toggleCompare(slug: string) {
    setCompareSet((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug].slice(0, 4)
    )
  }

  const parentBySlug = useMemo(() => {
    const map = new Map<string, string>()
    cities.forEach((c) => map.set(c.slug, c.name.split("–")[0].trim()))
    return map
  }, [])

  const scoredAll = useMemo(() => {
    const combined = [...cities, ...suburbs]
    return scoreCities(combined, EQUAL_WEIGHTS).map((c) => ({
      ...c,
      parentName: c.parentSlug ? parentBySlug.get(c.parentSlug) : undefined,
    }))
  }, [parentBySlug])

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) {
      return [...scoredAll].sort((a, b) => a.name.localeCompare(b.name))
    }
    return scoredAll.filter((c) => {
      const haystacks = [c.name, c.province, c.parentName ?? ""]
      return haystacks.some((h) => normalize(h).includes(q))
    })
  }, [query, scoredAll])

  return (
    <div className="min-h-screen bg-white">
      {showComparison && (
        <CityComparisonPanel
          cities={scoredAll}
          compareSet={compareSet}
          weights={EQUAL_WEIGHTS}
          onClose={() => setShowComparison(false)}
        />
      )}

      <header className="border-b border-black/[0.06] sticky top-0 bg-white/90 backdrop-blur-sm z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold text-black hover:opacity-70 transition-opacity">
            Maple Moving
          </Link>
          <div className="h-4 w-px bg-black/10" />
          <Link href="/explore" className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-black transition-colors">
            <ArrowLeft size={14} />
            Back to explore
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs font-mono text-neutral-400 uppercase tracking-[0.2em] mb-4">Search</p>
        <h1 className="text-4xl font-bold tracking-tight text-black mb-8">Find a city or suburb</h1>

        <div className="relative mb-2">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 38 cities and 49 suburbs — try “Toronto”, “Mississauga”, or “BC”"
            autoFocus
            className="w-full pl-11 pr-4 py-3 text-sm border border-black/10 focus:outline-none focus:border-black/30 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-neutral-400 font-mono">
            {results.length} result{results.length === 1 ? "" : "s"}
          </span>
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

        <div className="border border-black/[0.05]">
          <CitySearchResults
            results={results}
            compareSet={compareSet}
            onToggleCompare={toggleCompare}
          />
        </div>
      </main>
    </div>
  )
}
