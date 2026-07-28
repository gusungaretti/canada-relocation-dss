"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ScoredCity, UnitType, Weights, Tiers } from "@/lib/types"
import { TIER_ORDER } from "@/lib/priorities"

type FactorKey = keyof Weights
type SortKey = FactorKey | "score"

const FACTOR_META: { key: FactorKey; label: string; color: string; higherBetter: boolean }[] = [
  { key: "walkability",   label: "Walk",     color: "#3b82f6", higherBetter: true },
  { key: "affordability", label: "Rent",     color: "#10b981", higherBetter: false },
  { key: "safety",        label: "CSI",      color: "#f97316", higherBetter: false },
  { key: "weather",       label: "Temp",     color: "#0ea5e9", higherBetter: true },
  { key: "income",        label: "Income",   color: "#8b5cf6", higherBetter: true },
  { key: "transit",       label: "Transit",  color: "#06b6d4", higherBetter: true },
  { key: "employment",    label: "Unemp.",   color: "#84cc16", higherBetter: false },
  { key: "airQuality",    label: "PM2.5",    color: "#64748b", higherBetter: false },
  { key: "education",     label: "Schools",  color: "#f59e0b", higherBetter: true },
]

function scoreHex(score: number) {
  if (score >= 70) return "#16a34a"
  if (score >= 50) return "#d97706"
  return "#dc2626"
}

function getRent(city: ScoredCity, unitType: UnitType): number {
  switch (unitType) {
    case "studio":    return city.avgRentStudio
    case "one_bed":   return city.avgRent1BR
    case "two_bed":   return city.avgRent2BR
    case "three_bed": return city.avgRent3BR
  }
}

/** Raw display value for a factor (not the 0–100 normalized score). */
function rawValue(city: ScoredCity, factor: FactorKey, unitType: UnitType): number {
  switch (factor) {
    case "walkability":   return city.walkScore
    case "affordability": return getRent(city, unitType)
    case "safety":        return city.crimeIndex
    case "weather":       return city.avgTempC
    case "income":        return city.medianHouseholdIncome
    case "transit":       return city.transitScore
    case "employment":    return city.unemploymentRate
    case "airQuality":    return city.pm25
    case "education":     return city.schoolRating
  }
}

/** Value used for CMA ranking / column sort. Weather uses climate-match score. */
function rankValue(city: ScoredCity, factor: FactorKey, unitType: UnitType): number {
  if (factor === "weather") return city.factorScores.weather
  return rawValue(city, factor, unitType)
}

function formatRaw(factor: FactorKey, value: number): string {
  switch (factor) {
    case "affordability":
      return `$${Math.round(value).toLocaleString()}`
    case "income":
      return `$${Math.round(value / 1000)}k`
    case "weather":
      return `${value.toFixed(1)}°`
    case "safety":
    case "employment":
    case "airQuality":
    case "education":
      return Number.isInteger(value) ? String(value) : value.toFixed(1)
    default:
      return String(Math.round(value))
  }
}

/** Competition rank: 1 = best on this factor among all cities. Ties share the same rank. */
function computeRanks(
  cities: ScoredCity[],
  factor: FactorKey,
  unitType: UnitType,
  higherBetter: boolean
): Map<string, number> {
  const sorted = cities
    .map((c) => ({ slug: c.slug, value: rankValue(c, factor, unitType) }))
    .sort((a, b) => higherBetter ? b.value - a.value : a.value - b.value)

  const ranks = new Map<string, number>()
  let i = 0
  while (i < sorted.length) {
    const rank = i + 1
    let j = i
    while (j < sorted.length && sorted[j].value === sorted[i].value) j++
    for (let k = i; k < j; k++) ranks.set(sorted[k].slug, rank)
    i = j
  }
  return ranks
}

interface Props {
  cities: ScoredCity[]
  tiers: Tiers
  selectedSlug?: string
  onHover?: (slug: string | null) => void
  unitType: UnitType
  hasActiveFactors: boolean
  compareSet: string[]
  onToggleCompare: (slug: string) => void
}

export default function CityRankingList({
  cities, tiers, selectedSlug, onHover, unitType, hasActiveFactors, compareSet, onToggleCompare,
}: Props) {
  const router = useRouter()
  // null = default GP ranking order from `cities`; otherwise sort by that column.
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  // true = best-first for that column (score high, rent low, etc.)
  const [bestFirst, setBestFirst] = useState(true)

  // Active factor columns, ordered Must Have → Nice to Have → Bonus (then within-tier order).
  const activeFactors = useMemo(() => {
    const keys: FactorKey[] = []
    for (const tier of TIER_ORDER) {
      for (const key of tiers[tier]) keys.push(key)
    }
    return keys
      .map((key) => FACTOR_META.find((f) => f.key === key)!)
      .filter(Boolean)
  }, [tiers])

  // If the sorted factor was removed, fall back to the default GP order without an effect.
  const effectiveSortKey: SortKey | null =
    sortKey && sortKey !== "score" && !activeFactors.some((f) => f.key === sortKey)
      ? null
      : sortKey

  const ranksByFactor = useMemo(() => {
    const map = new Map<FactorKey, Map<string, number>>()
    for (const f of activeFactors) {
      map.set(f.key, computeRanks(cities, f.key, unitType, f.higherBetter))
    }
    return map
  }, [cities, activeFactors, unitType])

  const displayedCities = useMemo(() => {
    if (!effectiveSortKey) return cities
    const list = [...cities]
    if (effectiveSortKey === "score") {
      list.sort((a, b) => bestFirst ? b.totalScore - a.totalScore : a.totalScore - b.totalScore)
      return list
    }
    const meta = FACTOR_META.find((f) => f.key === effectiveSortKey)!
    // "best first" means higherBetter direction when bestFirst, reversed otherwise.
    const preferHigher = bestFirst ? meta.higherBetter : !meta.higherBetter
    list.sort((a, b) => {
      const av = rankValue(a, effectiveSortKey, unitType)
      const bv = rankValue(b, effectiveSortKey, unitType)
      return preferHigher ? bv - av : av - bv
    })
    return list
  }, [cities, effectiveSortKey, bestFirst, unitType])

  function toggleSort(key: SortKey) {
    if (effectiveSortKey === key) {
      if (bestFirst) setBestFirst(false)
      else { setSortKey(null); setBestFirst(true) } // third click → back to GP order
    } else {
      setSortKey(key)
      setBestFirst(true)
    }
  }

  function sortIndicator(key: SortKey) {
    if (effectiveSortKey !== key) return null
    return (
      <span className="ml-0.5 text-[9px] opacity-70">
        {bestFirst ? "▼" : "▲"}
      </span>
    )
  }

  if (!hasActiveFactors) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-1.5">
        <span className="text-sm text-neutral-400">No factors selected</span>
        <span className="text-xs text-neutral-300 font-mono">Add factors to see rankings</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse">
        <thead>
          <tr className="border-b border-black/[0.06] bg-white">
            <th className="text-left px-5 py-2 text-[10px] font-mono text-neutral-400 uppercase tracking-widest w-8">#</th>
            <th className="text-left px-2 py-2 text-[10px] font-mono text-neutral-400 uppercase tracking-widest min-w-[140px]">City</th>
            {activeFactors.map((f) => {
              const active = effectiveSortKey === f.key
              return (
                <th
                  key={f.key}
                  className="text-right px-3 py-2 text-[10px] font-mono uppercase tracking-widest whitespace-nowrap"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(f.key)}
                    title={`Sort by ${f.label}`}
                    className={`cursor-pointer hover:opacity-80 transition-opacity ${active ? "font-bold" : ""}`}
                    style={{ color: f.color }}
                  >
                    {f.label}
                    {sortIndicator(f.key)}
                  </button>
                </th>
              )
            })}
            <th className="text-right px-3 py-2 text-[10px] font-mono uppercase tracking-widest">
              <button
                type="button"
                onClick={() => toggleSort("score")}
                title="Sort by score"
                className={`cursor-pointer hover:text-black transition-colors ${
                  effectiveSortKey === "score" ? "text-black font-bold" : "text-neutral-400"
                }`}
              >
                Score
                {sortIndicator("score")}
              </button>
            </th>
            <th className="w-10 px-2 py-2" aria-label="Compare" />
          </tr>
        </thead>
        <tbody>
          {displayedCities.map((city, i) => {
            const isSelected = city.slug === selectedSlug
            const isComparing = compareSet.includes(city.slug)
            const color = scoreHex(city.totalScore)

            return (
              <tr
                key={city.slug}
                className={`border-b border-black/[0.05] last:border-0 transition-colors ${
                  isComparing ? "bg-neutral-100/70" : isSelected ? "bg-neutral-50" : "hover:bg-neutral-50/70"
                }`}
                onMouseEnter={() => onHover?.(city.slug)}
                onMouseLeave={() => onHover?.(null)}
              >
                <td className="px-5 py-2.5 text-xs font-mono text-neutral-300 text-right tabular-nums">
                  {i + 1}
                </td>
                <td className="px-2 py-2.5">
                  <button
                    onClick={() => router.push(`/city/${city.slug}`)}
                    className="text-left cursor-pointer min-w-0"
                  >
                    <span className="text-sm font-medium text-black">
                      {city.name.split("–")[0].trim()}
                    </span>
                    <span className="ml-1.5 text-[11px] text-neutral-400 font-mono">
                      {city.province}
                    </span>
                  </button>
                </td>
                {activeFactors.map((f) => {
                  const value = rawValue(city, f.key, unitType)
                  const rank = ranksByFactor.get(f.key)?.get(city.slug) ?? "—"
                  return (
                    <td key={f.key} className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className="text-[12px] font-mono text-neutral-700 tabular-nums">
                        {formatRaw(f.key, value)}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-300 tabular-nums ml-1">
                        ({rank})
                      </span>
                    </td>
                  )
                })}
                <td className="px-3 py-2.5 text-right">
                  <span className="text-sm font-mono font-bold tabular-nums" style={{ color }}>
                    {Number.isFinite(city.totalScore) ? city.totalScore : "—"}
                  </span>
                </td>
                <td className="px-2 py-2.5 text-center">
                  <button
                    onClick={() => onToggleCompare(city.slug)}
                    title={isComparing ? "Remove from comparison" : "Add to comparison"}
                    className={`inline-flex w-6 h-6 items-center justify-center border transition-colors text-xs font-mono ${
                      isComparing
                        ? "border-black bg-black text-white"
                        : "border-black/[0.12] text-neutral-300 hover:border-black/30 hover:text-black"
                    }`}
                  >
                    {isComparing ? "−" : "+"}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
