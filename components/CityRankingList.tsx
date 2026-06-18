"use client"

import { useRouter } from "next/navigation"
import { Footprints, DollarSign, Shield, Cloud, ChevronRight } from "lucide-react"
import type { ScoredCity } from "@/lib/types"

function scoreColor(score: number) {
  if (score >= 70) return { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" }
  if (score >= 50) return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" }
  return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" }
}

const FACTOR_META = [
  { key: "walkability", icon: Footprints, color: "#6366f1" },
  { key: "affordability", icon: DollarSign, color: "#22c55e" },
  { key: "safety", icon: Shield, color: "#e8673a" },
  { key: "weather", icon: Cloud, color: "#38bdf8" },
] as const

interface Props {
  cities: ScoredCity[]
  selectedSlug?: string
  onHover?: (slug: string | null) => void
}

export default function CityRankingList({ cities, selectedSlug, onHover }: Props) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-1.5">
      {cities.map((city, i) => {
        const colors = scoreColor(city.totalScore)
        const isSelected = city.slug === selectedSlug

        return (
          <button
            key={city.slug}
            onClick={() => router.push(`/city/${city.slug}`)}
            onMouseEnter={() => onHover?.(city.slug)}
            onMouseLeave={() => onHover?.(null)}
            className={`group w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 cursor-pointer ${
              isSelected
                ? "border-[rgba(232,103,58,0.4)] bg-[rgba(232,103,58,0.06)]"
                : "border-border bg-card hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.03)]"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.04)] border border-border flex items-center justify-center">
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  {i + 1}
                </span>
              </div>

              {/* City info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {city.name}
                  </span>
                  <span className="flex-shrink-0 text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 font-mono">
                    {city.province}
                  </span>
                </div>

                {/* Factor mini bars */}
                <div className="flex items-center gap-2 mt-2">
                  {FACTOR_META.map(({ key, icon: Icon, color }) => (
                    <div key={key} className="flex items-center gap-1">
                      <Icon size={10} style={{ color, opacity: 0.7 }} />
                      <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${city.factorScores[key]}%`,
                            backgroundColor: color,
                            opacity: 0.8,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score badge */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`flex items-center justify-center w-11 h-11 rounded-xl border font-mono font-bold text-sm ${colors.text} ${colors.bg} ${colors.border}`}
                >
                  {city.totalScore}
                </div>
                <ChevronRight
                  size={14}
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -ml-1"
                />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
