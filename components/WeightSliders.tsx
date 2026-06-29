"use client"

import { useState, useEffect } from "react"
import type { Weights, WeatherType, UnitType } from "@/lib/types"

type TierKey = "mustHave" | "niceToHave" | "bonus"
type FactorKey = keyof Weights
type DropZone = TierKey | "unranked"

const TIER_CONFIG: { key: TierKey; label: string; baseWeight: number; description: string }[] = [
  { key: "mustHave",   label: "Must Have",    baseWeight: 60, description: "Heavily influences ranking" },
  { key: "niceToHave", label: "Nice to Have", baseWeight: 30, description: "Meaningful but not critical" },
  { key: "bonus",      label: "Bonus",        baseWeight: 10, description: "Tie-breaker only" },
]

const FACTOR_CONFIG: { key: FactorKey; label: string; color: string }[] = [
  { key: "walkability",   label: "Walkability",   color: "#3b82f6" },
  { key: "affordability", label: "Affordability", color: "#10b981" },
  { key: "safety",        label: "Safety",        color: "#f97316" },
  { key: "weather",       label: "Weather",       color: "#0ea5e9" },
  { key: "income",        label: "Socioeconomic", color: "#8b5cf6" },
  { key: "transit",       label: "Transit",       color: "#06b6d4" },
  { key: "employment",    label: "Employment",    color: "#84cc16" },
  { key: "airQuality",    label: "Air Quality",   color: "#64748b" },
  { key: "education",     label: "Education",     color: "#f59e0b" },
]

const WEATHER_TYPES: { value: WeatherType; label: string; hint: string }[] = [
  { value: "warm",         label: "Warm",         hint: "High annual avg temp — Windsor, Victoria, Toronto" },
  { value: "mild",         label: "Mild",         hint: "Moderate year-round — Vancouver, Victoria" },
  { value: "four_seasons", label: "Four seasons", hint: "Distinct seasons — Ottawa, Montréal, Calgary" },
  { value: "dry",          label: "Dry",          hint: "Low rain & snow — Calgary, Regina, Saskatoon" },
]

const UNIT_TYPES: { value: UnitType; label: string }[] = [
  { value: "studio",    label: "Studio" },
  { value: "one_bed",   label: "1 Bed"  },
  { value: "two_bed",   label: "2 Bed"  },
  { value: "three_bed", label: "3 Bed+" },
]

// All factors start unranked — user assigns them to tiers
const DEFAULT_TIERS: Record<TierKey, FactorKey[]> = {
  mustHave:   [],
  niceToHave: [],
  bonus:      [],
}

// Ratio system: each Must Have factor always outweighs each Nice to Have factor,
// regardless of how many factors are in each tier. 3:2:1 per-factor ratio.
const TIER_MULTIPLIERS: Record<TierKey, number> = { mustHave: 3, niceToHave: 2, bonus: 1 }

function computeWeights(tiers: Record<TierKey, FactorKey[]>): Weights {
  const weights: Weights = { walkability: 0, affordability: 0, safety: 0, weather: 0, income: 0, transit: 0, employment: 0, airQuality: 0, education: 0 }
  const divisor = TIER_CONFIG.reduce((sum, t) => sum + tiers[t.key].length * TIER_MULTIPLIERS[t.key], 0)
  if (divisor === 0) return weights

  const x = 100 / divisor
  const fractionals: { key: FactorKey; frac: number }[] = []

  TIER_CONFIG.forEach((tier) => {
    const perFactor = x * TIER_MULTIPLIERS[tier.key]
    tiers[tier.key].forEach((f) => {
      const floored = Math.floor(perFactor)
      weights[f] = floored
      fractionals.push({ key: f, frac: perFactor - floored })
    })
  })

  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  fractionals
    .sort((a, b) => b.frac - a.frac)
    .slice(0, 100 - total)
    .forEach(({ key }) => { weights[key]++ })

  return weights
}

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
  onChange,
  weatherType, onWeatherTypeChange,
  unitType, onUnitTypeChange,
  budget, onBudgetChange,
}: Props) {
  const [tiers, setTiers] = useState<Record<TierKey, FactorKey[]>>(DEFAULT_TIERS)
  const [dragging, setDragging] = useState<FactorKey | null>(null)
  const [dragOverZone, setDragOverZone] = useState<DropZone | null>(null)

  useEffect(() => {
    onChange(computeWeights(tiers))
  }, [tiers]) // eslint-disable-line react-hooks/exhaustive-deps

  const assignedKeys = new Set(Object.values(tiers).flat())
  const unrankedFactors = FACTOR_CONFIG.filter(f => !assignedKeys.has(f.key))
  const weights = computeWeights(tiers)

  function findTier(factor: FactorKey): TierKey | null {
    for (const tier of TIER_CONFIG) {
      if (tiers[tier.key].includes(factor)) return tier.key
    }
    return null
  }

  function dropOnTier(targetTier: TierKey) {
    if (!dragging) return
    const sourceTier = findTier(dragging)
    if (sourceTier === targetTier) { setDragging(null); setDragOverZone(null); return }
    setTiers((prev) => ({
      ...prev,
      ...(sourceTier ? { [sourceTier]: prev[sourceTier].filter((f) => f !== dragging) } : {}),
      [targetTier]: [...prev[targetTier], dragging],
    }))
    setDragging(null)
    setDragOverZone(null)
  }

  function dropOnUnranked() {
    if (!dragging) return
    const sourceTier = findTier(dragging)
    if (!sourceTier) { setDragging(null); setDragOverZone(null); return }
    setTiers((prev) => ({
      ...prev,
      [sourceTier]: prev[sourceTier].filter((f) => f !== dragging),
    }))
    setDragging(null)
    setDragOverZone(null)
  }

  function onDragOver(e: React.DragEvent, zone: DropZone) {
    e.preventDefault()
    setDragOverZone(zone)
  }

  function onDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverZone(null)
  }

  function FactorCard({ factorKey, showWeight }: { factorKey: FactorKey; showWeight: boolean }) {
    const factor = FACTOR_CONFIG.find(f => f.key === factorKey)!
    return (
      <div
        draggable
        onDragStart={(e) => { setDragging(factorKey); e.dataTransfer.effectAllowed = "move" }}
        onDragEnd={() => { setDragging(null); setDragOverZone(null) }}
        className={`flex items-center gap-2.5 px-3 py-2 bg-white border border-black/[0.07] cursor-grab active:cursor-grabbing select-none transition-opacity hover:border-black/20 ${
          dragging === factorKey ? "opacity-30" : ""
        }`}
      >
        <div className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: factor.color }} />
        <span className="text-sm text-black flex-1">{factor.label}</span>
        {showWeight && (
          <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
            {Number.isFinite(weights[factorKey]) ? weights[factorKey] : 0}%
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Priorities</span>
        <span className="text-xs text-neutral-400">drag to tier</span>
      </div>

      {/* Unranked pool */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Available factors</span>
          <span className="text-[10px] text-neutral-300">not included in ranking</span>
        </div>
        <div
          onDragOver={(e) => onDragOver(e, "unranked")}
          onDragLeave={onDragLeave}
          onDrop={dropOnUnranked}
          className={`min-h-[52px] p-2 flex flex-col gap-1 border transition-colors ${
            dragOverZone === "unranked" ? "border-black/25 bg-neutral-50" : "border-black/[0.07]"
          }`}
        >
          {unrankedFactors.length === 0 ? (
            <div className="flex items-center justify-center h-8">
              <span className="text-[10px] text-neutral-300 font-mono select-none">
                {dragOverZone === "unranked" ? "release to unrank" : "all factors assigned"}
              </span>
            </div>
          ) : (
            unrankedFactors.map((f) => (
              <FactorCard key={f.key} factorKey={f.key} showWeight={false} />
            ))
          )}
        </div>
      </div>

      {/* Tier cards */}
      <div className="flex flex-col gap-2">
        {TIER_CONFIG.map(({ key, label, description }) => {
          const factors = tiers[key]
          const m = tiers.mustHave.length, n = tiers.niceToHave.length, b = tiers.bonus.length
          const divisor = 3*m + 2*n + b
          const perFactor = divisor > 0 ? (100 / divisor) * TIER_MULTIPLIERS[key] : 0
          const effectiveWeight = Math.round(factors.length * perFactor)
          const isOver = dragOverZone === key

          return (
            <div
              key={key}
              onDragOver={(e) => onDragOver(e, key)}
              onDragLeave={onDragLeave}
              onDrop={() => dropOnTier(key)}
              className={`border transition-colors ${isOver ? "border-black/25 bg-neutral-50" : "border-black/[0.07]"}`}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-black/[0.06]">
                <div>
                  <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">{label}</span>
                  <span className="ml-2 text-[10px] text-neutral-400">{description}</span>
                </div>
                <span className={`text-[11px] font-mono font-bold tabular-nums ${effectiveWeight > 0 ? "text-black" : "text-neutral-300"}`}>
                  {effectiveWeight > 0 ? `${effectiveWeight}%` : "—"}
                </span>
              </div>
              <div className="min-h-[44px] p-2 flex flex-col gap-1">
                {factors.length === 0 ? (
                  <div className="flex items-center justify-center h-8">
                    <span className="text-[10px] text-neutral-300 font-mono select-none">
                      {isOver ? "release to add" : "drop a factor here"}
                    </span>
                  </div>
                ) : (
                  factors.map((factorKey) => (
                    <FactorCard key={factorKey} factorKey={factorKey} showWeight={true} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Affordability settings */}
      <div className="mt-6 pt-6 border-t border-black/[0.06] space-y-4">
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

      {/* Climate preference */}
      <div className="mt-6 pt-6 border-t border-black/[0.06]">
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

      {/* Reset */}
      <button
        onClick={() => setTiers(DEFAULT_TIERS)}
        className="mt-8 pt-6 border-t border-black/[0.06] text-xs text-neutral-400 hover:text-black transition-colors cursor-pointer text-left"
      >
        Reset priorities
      </button>
    </div>
  )
}
