"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown } from "lucide-react"
import type { Weights, WeatherType, UnitType, Tiers, Goals, ScoringMethod, TierKey } from "@/lib/types"
import { FACTOR_DEFINITIONS } from "@/lib/factorDefinitions"
import { computeWeights, EMPTY_TIERS, tierOf } from "@/lib/priorities"
import { FACTOR_GOAL_SPECS, RENT_RANGE, DEFAULT_GOALS as CONFIG_DEFAULT_GOALS, formatGoal } from "@/lib/goalConfig"
import FactorTooltip from "@/components/FactorTooltip"

type FactorKey = keyof Weights

const TIER_OPTIONS: { key: TierKey; label: string; short: string }[] = [
  { key: "mustHave",   label: "Must Have",    short: "Must" },
  { key: "niceToHave", label: "Nice to Have", short: "Nice" },
  { key: "bonus",      label: "Bonus",        short: "Bonus" },
]

const METHOD_OPTIONS: { value: ScoringMethod; label: string; hint: string }[] = [
  { value: "weighted",       label: "Weighted",   hint: "Maximize the weighted sum of factor scores (compensatory baseline)." },
  { value: "goalWeighted",   label: "Goal (wtd)", hint: "Goal programming: minimize the weighted shortfall from your per-factor targets." },
  { value: "goalPreemptive", label: "Goal (pri)", hint: "Preemptive goal programming: meet Must-Have targets first, then Nice-to-Have, then Bonus." },
]

const DEFAULT_GOALS: Goals = CONFIG_DEFAULT_GOALS

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
const DEFAULT_TIERS: Tiers = EMPTY_TIERS

const TIERS_STORAGE_KEY = "mm_tiers"
const GOALS_STORAGE_KEY = "mm_goals_v2"
const METHOD_STORAGE_KEY = "mm_method"
const ALL_FACTOR_KEYS = FACTOR_CONFIG.map((f) => f.key)

function loadTiers(): Tiers | null {
  try {
    const raw = localStorage.getItem(TIERS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const seen = new Set<FactorKey>()
    for (const tier of TIER_OPTIONS) {
      const list = parsed[tier.key]
      if (!Array.isArray(list)) return null
      for (const f of list) {
        if (!ALL_FACTOR_KEYS.includes(f) || seen.has(f)) return null
        seen.add(f)
      }
    }
    return {
      mustHave: parsed.mustHave ?? [],
      niceToHave: parsed.niceToHave ?? [],
      bonus: parsed.bonus ?? [],
    }
  } catch {
    return null
  }
}

function loadGoals(): Goals | null {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const goals = { ...DEFAULT_GOALS }
    for (const key of ALL_FACTOR_KEYS) {
      const v = parsed[key]
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) goals[key] = v
    }
    return goals
  } catch {
    return null
  }
}

function loadMethod(): ScoringMethod | null {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(METHOD_STORAGE_KEY) : null
  return METHOD_OPTIONS.some((m) => m.value === raw) ? (raw as ScoringMethod) : null
}

interface Props {
  weights: Weights
  onChange: (weights: Weights) => void
  onTiersChange: (tiers: Tiers) => void
  goals: Goals
  onGoalsChange: (goals: Goals) => void
  method: ScoringMethod
  onMethodChange: (m: ScoringMethod) => void
  weatherType: WeatherType
  onWeatherTypeChange: (t: WeatherType) => void
  unitType: UnitType
  onUnitTypeChange: (t: UnitType) => void
  budget: number
  onBudgetChange: (b: number) => void
}

export default function WeightSliders({
  onChange, onTiersChange,
  goals, onGoalsChange,
  method, onMethodChange,
  weatherType, onWeatherTypeChange,
  unitType, onUnitTypeChange,
  budget, onBudgetChange,
}: Props) {
  const [tiers, setTiers] = useState<Tiers>(DEFAULT_TIERS)
  const [expanded, setExpanded] = useState<Set<FactorKey>>(new Set())
  const skipNextSave = useRef(true)
  const skipNextGoalSave = useRef(true)

  const isGoalMode = method !== "weighted"

  // Restore persisted state after mount (client-only — avoids SSR/hydration mismatch).
  // Restoring in an effect (rather than a lazy initializer) is intentional here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const savedTiers = loadTiers()
    if (savedTiers) setTiers(savedTiers)
    const savedGoals = loadGoals()
    if (savedGoals) onGoalsChange(savedGoals)
    const savedMethod = loadMethod()
    if (savedMethod) onMethodChange(savedMethod)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    onChange(computeWeights(tiers))
    onTiersChange(tiers)
    if (skipNextSave.current) {
      skipNextSave.current = false
    } else {
      localStorage.setItem(TIERS_STORAGE_KEY, JSON.stringify(tiers))
    }
  }, [tiers]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (skipNextGoalSave.current) {
      skipNextGoalSave.current = false
    } else {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals))
    }
  }, [goals])

  useEffect(() => {
    localStorage.setItem(METHOD_STORAGE_KEY, method)
  }, [method])

  function setGoal(factor: FactorKey, value: number) {
    onGoalsChange({ ...goals, [factor]: value })
  }

  const assignedKeys = new Set(Object.values(tiers).flat())
  const unrankedFactors = FACTOR_CONFIG.filter(f => !assignedKeys.has(f.key))
  const selectedFactors = FACTOR_CONFIG.filter(f => assignedKeys.has(f.key))
  const weights = computeWeights(tiers)

  // Move a factor into `target`, removing it from any tier it currently sits in.
  function moveToTier(factor: FactorKey, target: TierKey) {
    setTiers((prev) => {
      const cleared: Tiers = {
        mustHave: prev.mustHave.filter((f) => f !== factor),
        niceToHave: prev.niceToHave.filter((f) => f !== factor),
        bonus: prev.bonus.filter((f) => f !== factor),
      }
      return { ...cleared, [target]: [...cleared[target], factor] }
    })
  }

  // Add an unranked factor to the default tier, and expand it so its scale is ready to set.
  function addFactor(factor: FactorKey) {
    moveToTier(factor, "niceToHave")
    setExpanded((prev) => new Set(prev).add(factor))
  }

  // Return a factor to the Available column (remove from every tier).
  function removeFactor(factor: FactorKey) {
    setTiers((prev) => ({
      mustHave: prev.mustHave.filter((f) => f !== factor),
      niceToHave: prev.niceToHave.filter((f) => f !== factor),
      bonus: prev.bonus.filter((f) => f !== factor),
    }))
    setExpanded((prev) => {
      const next = new Set(prev)
      next.delete(factor)
      return next
    })
  }

  function toggleExpand(factor: FactorKey) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(factor)) next.delete(factor)
      else next.add(factor)
      return next
    })
  }

  function changeUnitType(ut: UnitType) {
    onUnitTypeChange(ut)
    const r = RENT_RANGE[ut]
    if (budget < r.min) onBudgetChange(r.min)
    else if (budget > r.max) onBudgetChange(r.max)
  }

  const pillBase = "text-[11px] px-2 py-1 border transition-colors"
  const pill = (selected: boolean) =>
    `${pillBase} ${selected ? "bg-black text-white border-black" : "bg-white text-neutral-500 border-black/[0.12] hover:border-black/30 hover:text-black"}`

  // The real-unit goal input for a factor, shown only when it's selected in a goal mode.
  function GoalControl({ factorKey }: { factorKey: FactorKey }) {
    const factor = FACTOR_CONFIG.find(f => f.key === factorKey)!
    const spec = FACTOR_GOAL_SPECS[factorKey]
    const color = factor.color

    if (spec.control === "discrete") {
      return (
        <div className="flex flex-wrap gap-1">
          {spec.options!.map((o) => (
            <button key={o.value} onClick={() => setGoal(factorKey, o.value)} className={pill(goals[factorKey] === o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      )
    }

    if (spec.control === "climate") {
      return (
        <div className="flex flex-wrap gap-1">
          {WEATHER_TYPES.map((wt) => (
            <button key={wt.value} onClick={() => onWeatherTypeChange(wt.value)} title={wt.hint} className={pill(weatherType === wt.value)}>
              {wt.label}
            </button>
          ))}
        </div>
      )
    }

    if (spec.control === "budget") {
      const r = RENT_RANGE[unitType]
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {UNIT_TYPES.map((ut) => (
              <button key={ut.value} onClick={() => changeUnitType(ut.value)} className={pill(unitType === ut.value)}>
                {ut.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={r.min}
            max={r.max}
            step={50}
            value={Math.min(Math.max(budget, r.min), r.max)}
            onChange={(e) => onBudgetChange(Number(e.target.value))}
            className="w-full"
            style={{ "--thumb-color": color, "--track-fill": `${color}33` } as React.CSSProperties}
          />
          <div className="flex justify-between text-[10px] text-neutral-300 font-mono">
            <span>${r.min.toLocaleString()}</span>
            <span>${r.max.toLocaleString()}</span>
          </div>
        </div>
      )
    }

    // range (e.g. income)
    return (
      <div className="space-y-1">
        <input
          type="range"
          min={spec.min}
          max={spec.max}
          step={spec.step}
          value={goals[factorKey]}
          onChange={(e) => setGoal(factorKey, Number(e.target.value))}
          className="w-full"
          style={{ "--thumb-color": color, "--track-fill": `${color}33` } as React.CSSProperties}
        />
        <div className="flex justify-between text-[10px] text-neutral-300 font-mono">
          <span>{spec.unit ?? ""}{spec.min?.toLocaleString()}</span>
          <span>{spec.unit ?? ""}{spec.max?.toLocaleString()}</span>
        </div>
      </div>
    )
  }

  // A card in the right-hand "Selected factors" column. Collapsed by default: the
  // header shows the tier + current goal; expanding reveals the tier picker and scale.
  function SelectedCard({ factorKey }: { factorKey: FactorKey }) {
    const factor = FACTOR_CONFIG.find(f => f.key === factorKey)!
    const spec = FACTOR_GOAL_SPECS[factorKey]
    const currentTier = tierOf(tiers, factorKey)
    const currentTierShort = TIER_OPTIONS.find((t) => t.key === currentTier)?.short ?? ""
    const isExpanded = expanded.has(factorKey)

    return (
      <div className="bg-white border border-black/[0.07] hover:border-black/20 transition-colors">
        {/* Header — click anywhere to expand/collapse */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleExpand(factorKey)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExpand(factorKey) } }}
          className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        >
          <ChevronDown
            size={14}
            className={`flex-shrink-0 text-neutral-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
          />
          <div className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: factor.color }} />
          <FactorTooltip text={FACTOR_DEFINITIONS[factorKey]} className="flex-1 min-w-0">
            <span className="text-sm text-black">{factor.label}</span>
          </FactorTooltip>
          <span className="flex-shrink-0 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-black/[0.12] text-neutral-500">
            {currentTierShort}
          </span>
          {isGoalMode ? (
            <span className="text-[11px] font-mono tabular-nums text-right" style={{ color: factor.color }}>
              {formatGoal(factorKey, goals, { budget, unitType, weatherType })}
            </span>
          ) : (
            <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
              {Number.isFinite(weights[factorKey]) ? weights[factorKey] : 0}%
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); removeFactor(factorKey) }}
            title="Remove"
            aria-label={`Remove ${factor.label}`}
            className="flex-shrink-0 text-neutral-300 hover:text-black transition-colors text-sm leading-none px-1 cursor-pointer"
          >
            ×
          </button>
        </div>

        {isExpanded && (
          <div className="border-t border-black/[0.04]">
            {/* Tier selector */}
            <div className="px-3 pt-2 pb-2 grid grid-cols-3 gap-1">
              {TIER_OPTIONS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => moveToTier(factorKey, t.key)}
                  className={`text-[10px] px-1 py-1 border transition-colors leading-tight ${
                    currentTier === t.key
                      ? "bg-black text-white border-black"
                      : "bg-white text-neutral-500 border-black/[0.12] hover:border-black/30 hover:text-black"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {isGoalMode && (
              <div className="px-3 pb-2.5 pt-1 border-t border-black/[0.04]">
                <p className="text-[10px] text-neutral-400 mb-1.5 leading-snug">{spec.helper}</p>
                <GoalControl factorKey={factorKey} />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Scoring method */}
      <div className="mb-6">
        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Scoring method</span>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {METHOD_OPTIONS.map((m) => (
            <button
              key={m.value}
              onClick={() => onMethodChange(m.value)}
              title={m.hint}
              className={`text-[11px] px-2 py-1.5 border transition-colors ${
                method === m.value
                  ? "bg-black text-white border-black"
                  : "bg-white text-neutral-500 border-black/[0.12] hover:border-black/30 hover:text-black"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-neutral-400 leading-relaxed">
          {METHOD_OPTIONS.find((m) => m.value === method)?.hint}
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Priorities</span>
        <span className="text-xs text-neutral-400">{isGoalMode ? "add & set targets" : "add to rank"}</span>
      </div>

      {/* Two-column picker: Available (left) → Selected (right).
          Selected takes the remaining width since its cards hold the goal scales. */}
      <div className="grid grid-cols-[minmax(120px,160px)_1fr] gap-3">
        {/* Available factors */}
        <div className="min-w-0">
          <div className="mb-1.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Available</span>
          </div>
          <div className="flex flex-col gap-1">
            {unrankedFactors.length === 0 ? (
              <div className="flex items-center justify-center min-h-[44px] border border-black/[0.07]">
                <span className="text-[10px] text-neutral-300 font-mono select-none">all added</span>
              </div>
            ) : (
              unrankedFactors.map((f) => (
                <button
                  key={f.key}
                  onClick={() => addFactor(f.key)}
                  className="group flex items-center gap-2 px-2.5 py-2 border border-black/[0.07] bg-white hover:border-black/25 transition-colors text-left cursor-pointer"
                >
                  <div className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: f.color }} />
                  <FactorTooltip text={FACTOR_DEFINITIONS[f.key]} className="flex-1 min-w-0">
                    <span className="text-[13px] text-black truncate">{f.label}</span>
                  </FactorTooltip>
                  <span className="flex-shrink-0 text-neutral-300 group-hover:text-black transition-colors text-sm leading-none">+</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected factors */}
        <div className="min-w-0">
          <div className="mb-1.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Selected</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {selectedFactors.length === 0 ? (
              <div className="flex items-center justify-center min-h-[44px] border border-black/[0.07]">
                <span className="text-[10px] text-neutral-300 font-mono select-none text-center px-2">add a factor from the left</span>
              </div>
            ) : (
              selectedFactors.map((f) => (
                <SelectedCard key={f.key} factorKey={f.key} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Global affordability & climate settings — only for the weighted model.
          In goal modes these live inside the selected-factor cards instead. */}
      {!isGoalMode && (
      <>
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
      </>
      )}

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
