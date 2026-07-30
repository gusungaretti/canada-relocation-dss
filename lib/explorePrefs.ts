// Client-only loaders for the explore-session preferences persisted to localStorage
// by app/explore/page.tsx and components/WeightSliders.tsx. Only call these from a
// useEffect (never during render) — they touch localStorage and must not run on the
// server or during the initial client render, or they'll cause a hydration mismatch.

import type { Tiers, Goals, Weights, WeatherType, UnitType } from "./types"
import { EMPTY_TIERS, EMPTY_WEIGHTS, TIER_ORDER } from "./priorities"
import { DEFAULT_GOALS } from "./goalConfig"

const TIERS_KEY = "mm_tiers"
const GOALS_KEY = "mm_goals_v2"
const INCLUDE_SUBURBS_KEY = "mm_includeSuburbs"
const WEATHER_KEY = "mm_weatherType"
const UNIT_KEY = "mm_unitType"
const BUDGET_KEY = "mm_budget"

const ALL_FACTOR_KEYS = Object.keys(EMPTY_WEIGHTS) as (keyof Weights)[]
const WEATHER_VALUES: WeatherType[] = ["warm", "mild", "four_seasons", "dry"]
const UNIT_VALUES: UnitType[] = ["studio", "one_bed", "two_bed", "three_bed"]

export function loadPersistedTiers(): Tiers {
  try {
    const raw = localStorage.getItem(TIERS_KEY)
    if (!raw) return EMPTY_TIERS
    const parsed = JSON.parse(raw)
    const seen = new Set<keyof Weights>()
    for (const tier of TIER_ORDER) {
      const list = parsed[tier]
      if (!Array.isArray(list)) return EMPTY_TIERS
      for (const f of list) {
        if (!ALL_FACTOR_KEYS.includes(f) || seen.has(f)) return EMPTY_TIERS
        seen.add(f)
      }
    }
    return {
      mustHave: parsed.mustHave ?? [],
      niceToHave: parsed.niceToHave ?? [],
      bonus: parsed.bonus ?? [],
    }
  } catch {
    return EMPTY_TIERS
  }
}

export function loadPersistedGoals(): Goals {
  try {
    const raw = localStorage.getItem(GOALS_KEY)
    if (!raw) return DEFAULT_GOALS
    const parsed = JSON.parse(raw)
    const goals = { ...DEFAULT_GOALS }
    for (const key of ALL_FACTOR_KEYS) {
      const v = parsed[key]
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) goals[key] = v
    }
    return goals
  } catch {
    return DEFAULT_GOALS
  }
}

export function loadIncludeSuburbs(): boolean {
  try {
    const raw = localStorage.getItem(INCLUDE_SUBURBS_KEY)
    if (raw === null) return true
    return JSON.parse(raw) === true
  } catch {
    return true
  }
}

export function loadWeatherType(): WeatherType {
  try {
    const raw = localStorage.getItem(WEATHER_KEY)
    if (!raw) return "four_seasons"
    const parsed = JSON.parse(raw)
    return WEATHER_VALUES.includes(parsed) ? parsed : "four_seasons"
  } catch {
    return "four_seasons"
  }
}

export function loadUnitType(): UnitType {
  try {
    const raw = localStorage.getItem(UNIT_KEY)
    if (!raw) return "one_bed"
    const parsed = JSON.parse(raw)
    return UNIT_VALUES.includes(parsed) ? parsed : "one_bed"
  } catch {
    return "one_bed"
  }
}

export function loadBudget(): number {
  try {
    const raw = localStorage.getItem(BUDGET_KEY)
    if (!raw) return 2000
    const parsed = JSON.parse(raw)
    return typeof parsed === "number" && Number.isFinite(parsed) && parsed >= 500 && parsed <= 5000
      ? parsed
      : 2000
  } catch {
    return 2000
  }
}
