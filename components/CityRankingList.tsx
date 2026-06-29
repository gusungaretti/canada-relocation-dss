"use client"

import { useRouter } from "next/navigation"
import type { ScoredCity, UnitType } from "@/lib/types"

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

interface Props {
  cities: ScoredCity[]
  selectedSlug?: string
  onHover?: (slug: string | null) => void
  unitType: UnitType
  hasActiveFactors: boolean
  compareSet: string[]
  onToggleCompare: (slug: string) => void
}

export default function CityRankingList({ cities, selectedSlug, onHover, unitType, hasActiveFactors, compareSet, onToggleCompare }: Props) {
  const router = useRouter()

  if (!hasActiveFactors) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-1.5">
        <span className="text-sm text-neutral-400">No factors selected</span>
        <span className="text-xs text-neutral-300 font-mono">Drag factors into tiers to rank cities</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {cities.map((city, i) => {
        const isSelected = city.slug === selectedSlug
        const isComparing = compareSet.includes(city.slug)
        const color = scoreHex(city.totalScore)

        return (
          <div
            key={city.slug}
            className={`flex items-center border-b border-black/[0.05] last:border-0 transition-colors ${
              isComparing ? "bg-neutral-100/70" : isSelected ? "bg-neutral-50" : "hover:bg-neutral-50/70"
            }`}
            onMouseEnter={() => onHover?.(city.slug)}
            onMouseLeave={() => onHover?.(null)}
          >
            <button
              onClick={() => router.push(`/city/${city.slug}`)}
              className="flex-1 text-left px-5 py-3 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <span className="flex-shrink-0 w-5 text-xs font-mono text-neutral-300 text-right">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-black truncate">
                      {city.name.split("–")[0].trim()}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono flex-shrink-0">
                      {city.province}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-neutral-400 font-mono">${getRent(city, unitType).toLocaleString()}/mo</span>
                    <span className="text-[11px] text-neutral-300">·</span>
                    <span className="text-[11px] text-neutral-400 font-mono">Walk {city.walkScore}</span>
                    <span className="text-[11px] text-neutral-300">·</span>
                    <span className="text-[11px] text-neutral-400 font-mono">CSI {city.crimeIndex}</span>
                  </div>
                </div>
                <span className="flex-shrink-0 text-sm font-mono font-bold" style={{ color }}>
                  {Number.isFinite(city.totalScore) ? city.totalScore : "—"}
                </span>
              </div>
            </button>
            <button
              onClick={() => onToggleCompare(city.slug)}
              title={isComparing ? "Remove from comparison" : "Add to comparison"}
              className={`flex-shrink-0 w-6 h-6 mx-3 flex items-center justify-center border transition-colors text-xs font-mono ${
                isComparing
                  ? "border-black bg-black text-white"
                  : "border-black/[0.12] text-neutral-300 hover:border-black/30 hover:text-black"
              }`}
            >
              {isComparing ? "−" : "+"}
            </button>
          </div>
        )
      })}
    </div>
  )
}
