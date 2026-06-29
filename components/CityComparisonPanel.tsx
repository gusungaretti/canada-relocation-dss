"use client"

import { X } from "lucide-react"
import type { ScoredCity, Weights } from "@/lib/types"

const FACTOR_META: { key: keyof Weights; label: string; color: string }[] = [
  { key: "walkability",   label: "Walkability",    color: "#3b82f6" },
  { key: "affordability", label: "Affordability",  color: "#10b981" },
  { key: "safety",        label: "Safety",         color: "#f97316" },
  { key: "weather",       label: "Weather",        color: "#0ea5e9" },
  { key: "income",        label: "Socioeconomic",  color: "#8b5cf6" },
  { key: "transit",       label: "Transit",        color: "#06b6d4" },
  { key: "employment",    label: "Employment",     color: "#84cc16" },
  { key: "airQuality",    label: "Air Quality",    color: "#64748b" },
  { key: "education",     label: "Education",      color: "#f59e0b" },
]

interface Props {
  cities: ScoredCity[]
  compareSet: string[]
  weights: Weights
  onClose: () => void
}

export default function CityComparisonPanel({ cities, compareSet, weights, onClose }: Props) {
  const selected = compareSet
    .map(slug => cities.find(c => c.slug === slug))
    .filter((c): c is ScoredCity => !!c)

  const activeFactors = FACTOR_META.filter(f => weights[f.key] > 0)

  function scoreColor(score: number) {
    const t = Math.max(0, Math.min(100, score)) / 100
    const amber:  [number,number,number] = [245, 158, 11]
    const violet: [number,number,number] = [124, 58,  237]
    const blue:   [number,number,number] = [29,  78,  216]
    const lerp = (a: number, b: number) => Math.round(a + (b - a) * (t <= 0.5 ? t * 2 : (t - 0.5) * 2))
    const [r, g, b2] = t <= 0.5
      ? [lerp(amber[0], violet[0]), lerp(amber[1], violet[1]), lerp(amber[2], violet[2])]
      : [lerp(violet[0], blue[0]),  lerp(violet[1], blue[1]),  lerp(violet[2], blue[2])]
    return `rgb(${r},${g},${b2})`
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 h-14 border-b border-black/[0.06] flex items-center px-6 gap-4">
        <span className="text-sm font-semibold text-black">City Comparison</span>
        <span className="text-xs text-neutral-400 font-mono">{selected.length} cities selected</span>
        <button
          onClick={onClose}
          className="ml-auto flex items-center gap-1.5 text-xs text-neutral-400 hover:text-black transition-colors"
        >
          <X size={14} />
          Close
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-max">
          {/* City headers */}
          <thead>
            <tr className="border-b border-black/[0.06]">
              <th className="text-left px-6 py-4 w-36">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Factor</span>
              </th>
              {selected.map(city => (
                <th key={city.slug} className="px-6 py-4 text-center min-w-[160px]">
                  <div className="text-sm font-semibold text-black">{city.name.split("–")[0].trim()}</div>
                  <div className="text-xs text-neutral-400 font-mono mt-0.5">{city.province}</div>
                  <div
                    className="text-2xl font-bold font-mono mt-2"
                    style={{ color: scoreColor(city.totalScore) }}
                  >
                    {city.totalScore}
                  </div>
                  <div className="text-[10px] text-neutral-300 font-mono">overall</div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Factor rows */}
          <tbody>
            {activeFactors.map(({ key, label, color }) => {
              const scores = selected.map(c => c.factorScores[key])
              const best = Math.max(...scores)

              return (
                <tr key={key} className="border-b border-black/[0.04] hover:bg-neutral-50/60 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm text-neutral-600">{label}</span>
                    </div>
                    <div className="text-[10px] text-neutral-300 font-mono mt-0.5 pl-3.5">{weights[key]}% weight</div>
                  </td>
                  {selected.map(city => {
                    const score = city.factorScores[key]
                    const isBest = score === best
                    return (
                      <td key={city.slug} className="px-6 py-3 text-center">
                        <div className={`text-lg font-mono font-bold ${isBest ? "" : "text-neutral-400"}`}
                          style={isBest ? { color } : undefined}>
                          {score}
                        </div>
                        <div className="mt-1.5 h-1 bg-neutral-100 mx-auto w-20 overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{ width: `${score}%`, backgroundColor: isBest ? color : "#d1d5db" }}
                          />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>

        {activeFactors.length === 0 && (
          <div className="flex items-center justify-center h-48 text-sm text-neutral-400">
            Assign factors to tiers to see a comparison
          </div>
        )}
      </div>
    </div>
  )
}
