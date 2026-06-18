"use client"

import { Footprints, DollarSign, Shield, Cloud } from "lucide-react"
import type { Weights } from "@/lib/types"

const FACTORS = [
  {
    key: "walkability" as keyof Weights,
    label: "Walkability",
    description: "Pedestrian access & transit",
    icon: Footprints,
    color: "#6366f1",
    trackColor: "rgba(99,102,241,0.3)",
  },
  {
    key: "affordability" as keyof Weights,
    label: "Affordability",
    description: "Average 1BR rent cost",
    icon: DollarSign,
    color: "#22c55e",
    trackColor: "rgba(34,197,94,0.3)",
  },
  {
    key: "safety" as keyof Weights,
    label: "Safety",
    description: "Crime severity index",
    icon: Shield,
    color: "#e8673a",
    trackColor: "rgba(232,103,58,0.3)",
  },
  {
    key: "weather" as keyof Weights,
    label: "Weather",
    description: "Temperature & precipitation",
    icon: Cloud,
    color: "#38bdf8",
    trackColor: "rgba(56,189,248,0.3)",
  },
]

interface Props {
  weights: Weights
  onChange: (weights: Weights) => void
}

export default function WeightSliders({ weights, onChange }: Props) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)

  function handleChange(key: keyof Weights, newValue: number) {
    const clamped = Math.max(0, Math.min(100, newValue))
    const others = FACTORS.filter((f) => f.key !== key)
    const currentOthersTotal = others.reduce((sum, f) => sum + weights[f.key], 0)
    const remaining = 100 - clamped

    const updated = { ...weights, [key]: clamped }

    if (currentOthersTotal === 0) {
      const each = remaining / others.length
      others.forEach((f) => {
        updated[f.key] = Math.round(each)
      })
    } else {
      others.forEach((f) => {
        updated[f.key] = Math.round((weights[f.key] / currentOthersTotal) * remaining)
      })
    }

    // Fix rounding drift so total stays at 100
    const newTotal = Object.values(updated).reduce((a, b) => a + b, 0)
    const diff = 100 - newTotal
    if (diff !== 0) {
      const adjustKey = others[0].key
      updated[adjustKey] = Math.max(0, updated[adjustKey] + diff)
    }

    onChange(updated)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
          Your Priorities
        </h2>
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
            total === 100
              ? "border-green-500/30 text-green-400 bg-green-500/10"
              : "border-amber-500/30 text-amber-400 bg-amber-500/10"
          }`}
        >
          {total}%
        </span>
      </div>

      <div className="flex flex-col gap-5">
        {FACTORS.map(({ key, label, description, icon: Icon, color, trackColor }) => {
          const value = weights[key]
          const pct = `${value}%`

          return (
            <div key={key} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-lg"
                    style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
                  >
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground leading-none">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                </div>
                <span
                  className="text-sm font-semibold font-mono tabular-nums min-w-[3rem] text-right"
                  style={{ color }}
                >
                  {pct}
                </span>
              </div>

              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 rounded-full pointer-events-none h-1 top-1/2 -translate-y-1/2"
                  style={{
                    width: pct,
                    backgroundColor: color,
                    opacity: 0.8,
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
                  style={
                    {
                      "--thumb-color": color,
                      "--track-fill": trackColor,
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <button
          onClick={() => onChange({ walkability: 25, affordability: 25, safety: 25, weather: 25 })}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Reset to equal weights
        </button>
      </div>
    </div>
  )
}
