import type { Weights, UnitType, WeatherType } from "./types"
import citiesRaw from "@/data/cities.json"

// Goals are expressed in real, human-meaningful units (dollars, Walk Score bands, %,
// μg/m³, …) rather than an abstract 0–100 score. `lib/scoring.ts` maps each raw goal
// onto the same normalized 0–100 scale the cities are measured on before computing
// deviations, so the objective stays comparable across factors.

// "atLeast" → higher raw value is better (undershoot is penalized).
// "atMost"  → lower raw value is better (exceeding the goal is penalized).
export type GoalDirection = "atLeast" | "atMost"

// How the user picks the goal in the sidebar.
export type GoalControl = "discrete" | "range" | "budget" | "climate"

export interface DiscreteOption { label: string; value: number }

export interface FactorGoalSpec {
  direction: GoalDirection
  control: GoalControl
  options?: DiscreteOption[]            // control === "discrete"
  min?: number; max?: number; step?: number; unit?: string // control === "range"
  helper: string                        // one-line explanation of what the number means
}

type CityStat = {
  medianHouseholdIncome: number
  avgRentStudio: number
  avgRent1BR: number
  avgRent2BR: number
  avgRent3BR: number
}

const CITIES = citiesRaw as CityStat[]

function range(values: number[], floorTo: number, ceilTo: number): { min: number; max: number } {
  const min = Math.floor(Math.min(...values) / floorTo) * floorTo
  const max = Math.ceil(Math.max(...values) / ceilTo) * ceilTo
  return { min, max }
}

// Rent slider bounds per unit type, derived from the dataset.
const RENT_FIELD: Record<UnitType, keyof CityStat> = {
  studio: "avgRentStudio",
  one_bed: "avgRent1BR",
  two_bed: "avgRent2BR",
  three_bed: "avgRent3BR",
}

export const RENT_RANGE: Record<UnitType, { min: number; max: number }> = {
  studio:    range(CITIES.map((c) => c[RENT_FIELD.studio]),    100, 100),
  one_bed:   range(CITIES.map((c) => c[RENT_FIELD.one_bed]),   100, 100),
  two_bed:   range(CITIES.map((c) => c[RENT_FIELD.two_bed]),   100, 100),
  three_bed: range(CITIES.map((c) => c[RENT_FIELD.three_bed]), 100, 100),
}

const INCOME_RANGE = range(CITIES.map((c) => c.medianHouseholdIncome), 1000, 1000)

// Score a city considers "at your budget" (see affordabilityScore in scoring.ts): a
// city exactly at the target rent scores this; cheaper cities clear the goal outright.
export const AFFORDABILITY_TARGET_SCORE = 80

// Weather has no "more is better" raw metric — the score is a climate-match quality.
// The goal is simply "match my chosen climate reasonably well".
export const WEATHER_TARGET_SCORE = 65

export const FACTOR_GOAL_SPECS: Record<keyof Weights, FactorGoalSpec> = {
  walkability: {
    direction: "atLeast",
    control: "discrete",
    helper: "Minimum Walk Score band you want.",
    options: [
      { label: "Car-dependent",     value: 25 },
      { label: "Somewhat walkable", value: 50 },
      { label: "Very walkable",     value: 70 },
      { label: "Walker's paradise", value: 90 },
    ],
  },
  affordability: {
    direction: "atMost",
    control: "budget",
    helper: "Most you want to pay in rent per month, by unit size.",
  },
  safety: {
    direction: "atMost",
    control: "discrete",
    helper: "Crime Severity Index — national average is 100, lower is safer.",
    options: [
      { label: "Very safe",   value: 60 },
      { label: "Safe",        value: 80 },
      { label: "Avg or below", value: 100 },
    ],
  },
  weather: {
    direction: "atLeast",
    control: "climate",
    helper: "Climate you want the city to match.",
  },
  income: {
    direction: "atLeast",
    control: "range",
    min: INCOME_RANGE.min,
    max: INCOME_RANGE.max,
    step: 1000,
    unit: "$",
    helper: "Minimum median after-tax household income.",
  },
  transit: {
    direction: "atLeast",
    control: "discrete",
    helper: "Minimum public-transit coverage you want.",
    options: [
      { label: "Minimal",   value: 25 },
      { label: "Some",      value: 45 },
      { label: "Good",      value: 65 },
      { label: "Excellent", value: 80 },
    ],
  },
  employment: {
    direction: "atMost",
    control: "discrete",
    helper: "Highest unemployment rate you'll accept.",
    options: [
      { label: "\u2264 4%", value: 4 },
      { label: "\u2264 5%", value: 5 },
      { label: "\u2264 6%", value: 6 },
      { label: "\u2264 7%", value: 7 },
    ],
  },
  airQuality: {
    direction: "atMost",
    control: "discrete",
    helper: "Maximum annual PM2.5 (\u03bcg/m\u00b3) — WHO guideline is 5.",
    options: [
      { label: "Excellent", value: 5 },
      { label: "Good",      value: 8 },
      { label: "Moderate",  value: 10 },
    ],
  },
  education: {
    direction: "atLeast",
    control: "discrete",
    helper: "Minimum composite school rating (out of 10).",
    options: [
      { label: "\u2265 5", value: 5 },
      { label: "\u2265 6", value: 6 },
      { label: "\u2265 7", value: 7 },
      { label: "\u2265 8", value: 8 },
    ],
  },
}

// Sensible starting targets in raw units. Affordability/weather are driven by the
// budget and climate controls respectively, so their entries here are unused.
export const DEFAULT_GOALS: Record<keyof Weights, number> = {
  walkability: 50,
  affordability: RENT_RANGE.one_bed.max,
  safety: 80,
  weather: 0,
  income: Math.round((INCOME_RANGE.min + INCOME_RANGE.max) / 2 / 1000) * 1000,
  transit: 45,
  employment: 5,
  airQuality: 8,
  education: 6,
}

// Human-readable summary of the current goal for a factor (shown on the card).
export function formatGoal(
  factor: keyof Weights,
  goals: Record<keyof Weights, number>,
  ctx: { budget: number; unitType: UnitType; weatherType: WeatherType }
): string {
  const spec = FACTOR_GOAL_SPECS[factor]
  const arrow = spec.direction === "atLeast" ? "\u2265" : "\u2264"

  if (spec.control === "budget") {
    return `${arrow} $${ctx.budget.toLocaleString()}/mo`
  }
  if (spec.control === "climate") {
    const labels: Record<WeatherType, string> = {
      warm: "Warm", mild: "Mild", four_seasons: "Four seasons", dry: "Dry",
    }
    return labels[ctx.weatherType]
  }
  if (spec.control === "range") {
    return `${arrow} ${spec.unit ?? ""}${goals[factor].toLocaleString()}`
  }
  // discrete
  const opt = spec.options?.find((o) => o.value === goals[factor])
  return opt ? opt.label : `${arrow} ${goals[factor]}`
}
