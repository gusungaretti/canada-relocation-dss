"use client"

import { useRouter } from "next/navigation"
import type { ScoredCity } from "@/lib/types"
import ScoreText from "@/components/ScoreText"

function scoreHex(score: number) {
  if (score >= 70) return "#16a34a"
  if (score >= 50) return "#d97706"
  return "#dc2626"
}

interface Props {
  results: (ScoredCity & { parentName?: string })[]
  compareSet: string[]
  onToggleCompare: (slug: string) => void
}

export default function CitySearchResults({ results, compareSet, onToggleCompare }: Props) {
  const router = useRouter()

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-1.5">
        <span className="text-sm text-neutral-400">No matches</span>
        <span className="text-xs text-neutral-300 font-mono">Try a different city, suburb, or province</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {results.map((city) => {
        const isComparing = compareSet.includes(city.slug)
        const color = scoreHex(city.totalScore)

        return (
          <div
            key={city.slug}
            className={`flex items-center border-b border-black/[0.05] last:border-0 transition-colors ${
              isComparing ? "bg-neutral-100/70" : "hover:bg-neutral-50/70"
            }`}
          >
            <button
              onClick={() => router.push(`/city/${city.slug}`)}
              className="flex-1 text-left px-5 py-3 cursor-pointer min-w-0"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-black truncate">
                  {city.name.split("–")[0].trim()}
                </span>
                <span className="text-[11px] text-neutral-400 font-mono flex-shrink-0">
                  {city.province}
                </span>
                {city.parentName && (
                  <span className="text-[11px] text-neutral-300 flex-shrink-0 truncate">
                    · suburb of {city.parentName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[11px] text-neutral-400 font-mono">${city.avgRent1BR.toLocaleString()}/mo</span>
                <span className="text-[11px] text-neutral-300">·</span>
                <span className="text-[11px] text-neutral-400 font-mono">Walk {city.walkScore}</span>
                <span className="text-[11px] text-neutral-300">·</span>
                <span className="text-[11px] text-neutral-400 font-mono">CSI {city.crimeIndex}</span>
              </div>
            </button>
            <ScoreText
              score={city.totalScore}
              className="flex-shrink-0 text-sm font-mono font-bold"
              style={{ color }}
            />
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
