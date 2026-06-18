"use client"

import type { Weights } from "@/lib/types"

const FACTORS = [
  { key: "walkability"   as keyof Weights, label: "Walkability",   sub: "Walk Score",      color: "#3b82f6", trackColor: "rgba(59,130,246,0.2)" },
  { key: "affordability" as keyof Weights, label: "Affordability", sub: "Avg. 1BR rent",   color: "#10b981", trackColor: "rgba(16,185,129,0.2)" },
  { key: "safety"        as keyof Weights, label: "Safety",        sub: "Crime severity",  color: "#f97316", trackColor: "rgba(249,115,22,0.2)"  },
  { key: "weather"       as keyof Weights, label: "Weather",       sub: "Temp & precip",   color: "#0ea5e9", trackColor: "rgba(14,165,233,0.2)"  },
]

interface Props {
  weights: Weights
  onChange: (weights: Weights) => void
}

export default function WeightSliders({ weights, onChange }: Props) {
  function handleChange(key: keyof Weights, newValue: number) {
    const clamped = Math.max(0, Math.min(100, newValue))
    const others = FACTORS.filter((f) => f.key !== key)
    const currentOthersTotal = others.reduce((sum, f) => sum + weights[f.key], 0)
    const remaining = 100 - clamped
    const updated = { ...weights, [key]: clamped }

    if (currentOthersTotal === 0) {
      const each = remaining / others.length
      others.forEach((f) => { updated[f.key] = Math.round(each) })
    } else {
      others.forEach((f) => {
        updated[f.key] = Math.round((weights[f.key] / currentOthersTotal) * remaining)
      })
    }

    const newTotal = Object.values(updated).reduce((a, b) => a + b, 0)
    const diff = 100 - newTotal
    if (diff !== 0) updated[others[0].key] = Math.max(0, updated[others[0].key] + diff)

    onChange(updated)
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Priorities</span>
        <span className="text-xs font-mono text-neutral-400">sum to 100%</span>
      </div>

      <div className="flex flex-col gap-7">
        {FACTORS.map(({ key, label, sub, color, trackColor }) => {
          const value = weights[key]

          return (
            <div key={key}>
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <span className="text-sm font-medium text-black">{label}</span>
                  <span className="text-xs text-neutral-400 ml-2">{sub}</span>
                </div>
                <span className="text-sm font-mono font-semibold tabular-nums" style={{ color }}>
                  {value}%
                </span>
              </div>

              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pointer-events-none top-1/2 -translate-y-1/2"
                  style={{
                    width: `${value}%`,
                    height: "2px",
                    backgroundColor: color,
                    borderRadius: "2px",
                    opacity: 0.9,
                    transition: "width 0.15s ease",
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={value}
                  onChange={(e) => handleChange(key, parseInt(e.target.value))}
                  className="relative w-full"
                  style={{ "--thumb-color": color, "--track-fill": trackColor } as React.CSSProperties}
                />
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => onChange({ walkability: 25, affordability: 25, safety: 25, weather: 25 })}
        className="mt-8 pt-6 border-t border-black/[0.06] text-xs text-neutral-400 hover:text-black transition-colors cursor-pointer text-left"
      >
        Reset to equal weights
      </button>
    </div>
  )
}
