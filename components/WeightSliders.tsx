"use client"

import { useState } from "react"
import { Lock, LockOpen } from "lucide-react"
import type { Weights, WeatherType, UnitType } from "@/lib/types"

const WEATHER_TYPES: { value: WeatherType; label: string; hint: string }[] = [
  { value: "warm",         label: "Warm",        hint: "High annual avg temp — Windsor, Victoria, Toronto" },
  { value: "mild",         label: "Mild",         hint: "Moderate year-round — Vancouver, Victoria" },
  { value: "four_seasons", label: "Four seasons", hint: "Distinct seasons — Ottawa, Montreal, Calgary" },
  { value: "dry",          label: "Dry",          hint: "Low rain & snow — Calgary, Regina, Saskatoon" },
]

const UNIT_TYPES: { value: UnitType; label: string; sub: string }[] = [
  { value: "studio",    label: "Studio", sub: "Avg. studio rent" },
  { value: "one_bed",   label: "1 Bed",  sub: "Avg. 1BR rent"   },
  { value: "two_bed",   label: "2 Bed",  sub: "Avg. 2BR rent"   },
  { value: "three_bed", label: "3 Bed+", sub: "Avg. 3BR+ rent"  },
]

const FACTORS = [
  { key: "walkability"   as keyof Weights, label: "Walkability",   sub: "Walk Score",      color: "#3b82f6", trackColor: "rgba(59,130,246,0.2)" },
  { key: "affordability" as keyof Weights, label: "Affordability", sub: "",                color: "#10b981", trackColor: "rgba(16,185,129,0.2)" },
  { key: "safety"        as keyof Weights, label: "Safety",        sub: "Crime severity",  color: "#f97316", trackColor: "rgba(249,115,22,0.2)"  },
  { key: "weather"       as keyof Weights, label: "Weather",       sub: "Temp & precip",   color: "#0ea5e9", trackColor: "rgba(14,165,233,0.2)"  },
]

interface Props {
  weights: Weights
  onChange: (weights: Weights) => void
  weatherType: WeatherType
  onWeatherTypeChange: (t: WeatherType) => void
  unitType: UnitType
  onUnitTypeChange: (t: UnitType) => void
  budget: number
  onBudgetChange: (b: number) => void
}

export default function WeightSliders({
  weights, onChange,
  weatherType, onWeatherTypeChange,
  unitType, onUnitTypeChange,
  budget, onBudgetChange,
}: Props) {
  const [locked, setLocked] = useState<Set<keyof Weights>>(new Set())

  function toggleLock(key: keyof Weights) {
    setLocked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleChange(key: keyof Weights, newValue: number) {
    const clamped = Math.max(0, Math.min(100, newValue))
    const flexible = FACTORS.filter((f) => f.key !== key && !locked.has(f.key))
    const fixedTotal = FACTORS.filter((f) => f.key !== key && locked.has(f.key))
      .reduce((sum, f) => sum + weights[f.key], 0)

    const maxAllowed = Math.max(0, 100 - fixedTotal)
    const value = Math.min(clamped, maxAllowed)
    const remaining = 100 - fixedTotal - value
    const updated: Weights = { ...weights, [key]: value }

    if (flexible.length === 0) { onChange(updated); return }

    const flexTotal = flexible.reduce((sum, f) => sum + weights[f.key], 0)
    if (flexTotal === 0) {
      const each = remaining / flexible.length
      flexible.forEach((f) => { updated[f.key] = Math.round(each) })
    } else {
      flexible.forEach((f) => {
        updated[f.key] = Math.round((weights[f.key] / flexTotal) * remaining)
      })
    }

    const drift = 100 - Object.values(updated).reduce((a, b) => a + b, 0)
    if (drift !== 0 && flexible.length > 0) {
      updated[flexible[0].key] = Math.max(0, updated[flexible[0].key] + drift)
    }

    onChange(updated)
  }

  const unitSub = UNIT_TYPES.find((u) => u.value === unitType)?.sub ?? "Avg. rent"

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Priorities</span>
        <span className="text-xs font-mono text-neutral-400">sum to 100%</span>
      </div>

      <div className="flex flex-col gap-7">
        {FACTORS.map(({ key, label, color, trackColor }) => {
          const value = weights[key]
          const isLocked = locked.has(key)
          const sub = key === "affordability" ? unitSub : FACTORS.find((f) => f.key === key)?.sub ?? ""

          return (
            <div key={key}>

              {/* Affordability extras: unit type chips + budget slider */}
              {key === "affordability" && (
                <div className="mb-4 space-y-4">
                  <div>
                    <p className="text-[11px] text-neutral-400 mb-2">Unit type</p>
                    <div className="flex flex-wrap gap-1.5">
                      {UNIT_TYPES.map((ut) => (
                        <button
                          key={ut.value}
                          onClick={() => onUnitTypeChange(ut.value)}
                          className={`text-[11px] px-2.5 py-1 border transition-colors ${
                            unitType === ut.value
                              ? "bg-black text-white border-black"
                              : "bg-white text-neutral-500 border-black/[0.12] hover:border-black/30 hover:text-black"
                          }`}
                        >
                          {ut.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] text-neutral-400">Monthly budget</p>
                      <span className="text-[11px] font-mono font-semibold" style={{ color: "#10b981" }}>
                        ${budget.toLocaleString()}/mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={5000}
                      step={100}
                      value={budget}
                      onChange={(e) => onBudgetChange(Number(e.target.value))}
                      className="w-full"
                      style={{ "--thumb-color": "#10b981", "--track-fill": "rgba(16,185,129,0.2)" } as React.CSSProperties}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-neutral-300 font-mono">$500</span>
                      <span className="text-[10px] text-neutral-300 font-mono">$5,000</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Climate preference chips */}
              {key === "weather" && (
                <div className="mb-4">
                  <p className="text-[11px] text-neutral-400 mb-2">Climate preference</p>
                  <div className="flex flex-wrap gap-1.5">
                    {WEATHER_TYPES.map((wt) => (
                      <button
                        key={wt.value}
                        onClick={() => onWeatherTypeChange(wt.value)}
                        title={wt.hint}
                        className={`text-[11px] px-2.5 py-1 border transition-colors ${
                          weatherType === wt.value
                            ? "bg-black text-white border-black"
                            : "bg-white text-neutral-500 border-black/[0.12] hover:border-black/30 hover:text-black"
                        }`}
                      >
                        {wt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Label + lock */}
              <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-black">{label}</span>
                  <span className="text-xs text-neutral-400">{sub}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-semibold tabular-nums" style={{ color }}>
                    {value}%
                  </span>
                  <button
                    onClick={() => toggleLock(key)}
                    title={isLocked ? "Unlock" : "Lock this value"}
                    className={`flex items-center justify-center w-5 h-5 transition-colors ${
                      isLocked ? "text-neutral-700" : "text-neutral-300 hover:text-neutral-500"
                    }`}
                  >
                    {isLocked ? <Lock size={12} /> : <LockOpen size={12} />}
                  </button>
                </div>
              </div>

              {/* Weight slider */}
              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pointer-events-none top-1/2 -translate-y-1/2"
                  style={{
                    width: `${value}%`,
                    height: "2px",
                    backgroundColor: isLocked ? "rgba(0,0,0,0.2)" : color,
                    opacity: isLocked ? 0.5 : 0.9,
                    transition: "width 0.15s ease",
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={value}
                  disabled={isLocked}
                  onChange={(e) => handleChange(key, parseInt(e.target.value))}
                  className={`relative w-full ${isLocked ? "opacity-40 cursor-not-allowed" : ""}`}
                  style={{ "--thumb-color": isLocked ? "#999" : color, "--track-fill": trackColor } as React.CSSProperties}
                />
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => {
          setLocked(new Set())
          onChange({ walkability: 25, affordability: 25, safety: 25, weather: 25 })
        }}
        className="mt-8 pt-6 border-t border-black/[0.06] text-xs text-neutral-400 hover:text-black transition-colors cursor-pointer text-left"
      >
        Reset to equal weights
      </button>
    </div>
  )
}
