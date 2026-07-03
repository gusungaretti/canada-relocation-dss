"use client"

import { X } from "lucide-react"
import type { ScoredCity, Weights } from "@/lib/types"
import { FACTOR_DEFINITIONS } from "@/lib/factorDefinitions"
import FactorTooltip from "@/components/FactorTooltip"

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

  const hasActiveFactors = Object.values(weights).some(w => w > 0)

  function scoreColor(score: number) {
    const t = Math.max(0, Math.min(100, score)) / 100
    const red:    [number,number,number] = [239, 68,  68]
    const yellow: [number,number,number] = [234, 179, 8]
    const green:  [number,number,number] = [34,  197, 94]
    const lerp = (a: number, b: number, u: number) => Math.round(a + (b - a) * u)
    const lerpRgb = (a: [number,number,number], b: [number,number,number], u: number) =>
      `rgb(${lerp(a[0],b[0],u)},${lerp(a[1],b[1],u)},${lerp(a[2],b[2],u)})`
    return t <= 0.5 ? lerpRgb(red, yellow, t * 2) : lerpRgb(yellow, green, (t - 0.5) * 2)
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
                    style={hasActiveFactors ? { color: scoreColor(city.totalScore) } : { color: "#d1d5db" }}
                  >
                    {hasActiveFactors ? city.totalScore : "—"}
                  </div>
                  <div className="text-[10px] text-neutral-300 font-mono">overall</div>
                </th>
              ))}
              <th className="px-6 py-4 text-center border-l border-black/[0.04] w-24">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Spread</span>
              </th>
            </tr>
          </thead>

          {/* Factor rows */}
          <tbody>
            {FACTOR_META.map(({ key, label, color }) => {
              const scores = selected.map(c => c.factorScores[key])
              const best = Math.max(...scores)
              const worst = Math.min(...scores)
              const spread = best - worst
              const isWeighted = weights[key] > 0

              const dotColor = isWeighted ? color : "#d1d5db"

              return (
                <tr key={key} className="border-b border-black/[0.04] hover:bg-neutral-50/60 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: dotColor }} />
                      <FactorTooltip text={FACTOR_DEFINITIONS[key]}>
                        <span className={`text-sm ${isWeighted ? "text-neutral-600" : "text-neutral-300"}`}>{label}</span>
                      </FactorTooltip>
                    </div>
                    <div className="text-[10px] text-neutral-300 font-mono mt-0.5 pl-3.5">
                      {isWeighted ? `${weights[key]}% weight` : "not ranked"}
                    </div>
                  </td>
                  {selected.map(city => {
                    const score = city.factorScores[key]
                    const isBest = score === best
                    const highlight = isWeighted && isBest
                    return (
                      <td key={city.slug} className="px-6 py-3 text-center">
                        <div className={`text-lg font-mono font-bold ${highlight ? "" : "text-neutral-300"}`}
                          style={highlight ? { color } : undefined}>
                          {score}
                        </div>
                        <div className="mt-1.5 h-1 bg-neutral-100 mx-auto w-20 overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{ width: `${score}%`, backgroundColor: highlight ? color : "#e5e5e5" }}
                          />
                        </div>
                      </td>
                    )
                  })}
                  <td className="px-6 py-3 text-center border-l border-black/[0.04]">
                    <div className={`inline-flex items-baseline gap-1 font-mono font-semibold text-sm tabular-nums ${
                      isWeighted && spread > 0 ? "text-black" : "text-neutral-300"
                    }`}>
                      <span className="inline-block w-3 text-right">{spread > 0 ? "Δ" : ""}</span>
                      <span className="inline-block w-6 text-left">{spread > 0 ? spread : "—"}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
