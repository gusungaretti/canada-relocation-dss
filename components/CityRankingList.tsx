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
}

export default function CityRankingList({ cities, selectedSlug, onHover, unitType }: Props) {
  const router = useRouter()

  return (
    <div className="flex flex-col">
      {cities.map((city, i) => {
        const isSelected = city.slug === selectedSlug
        const color = scoreHex(city.totalScore)

        return (
          <button
            key={city.slug}
            onClick={() => router.push(`/city/${city.slug}`)}
            onMouseEnter={() => onHover?.(city.slug)}
            onMouseLeave={() => onHover?.(null)}
            className={`group w-full text-left border-b border-black/[0.05] last:border-0 px-5 py-3 transition-colors cursor-pointer ${
              isSelected ? "bg-neutral-50" : "hover:bg-neutral-50/70"
            }`}
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
        )
      })}
    </div>
  )
}
