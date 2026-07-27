import type { City, Weights, WeatherType, UnitType, FactorScores, ScoredCity, Tiers, Goals, ScoringMethod } from "./types"
import { computeWeights, tierOf, TIER_ORDER } from "./priorities"
import { AFFORDABILITY_TARGET_SCORE, WEATHER_TARGET_SCORE } from "./goalConfig"

function minMaxNormalize(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) return 50
  if (max === min) return 50
  return Math.round(((value - min) / (max - min)) * 100)
}

function invertedNormalize(value: number, min: number, max: number): number {
  return 100 - minMaxNormalize(value, min, max)
}

function bellCurve(value: number, ideal: number, range: number): number {
  return Math.max(0, Math.round(100 - Math.abs(value - ideal) * (100 / range) * 1.6))
}

function getRent(city: City, unitType: UnitType): number {
  switch (unitType) {
    case "studio":    return city.avgRentStudio
    case "one_bed":   return city.avgRent1BR
    case "two_bed":   return city.avgRent2BR
    case "three_bed": return city.avgRent3BR
  }
}

// Budget-relative affordability: 80 at budget, scales linearly with rent/budget ratio
// so it only approaches 100 as rent approaches 0 — no artificial ceiling for cheap cities.
function affordabilityScore(rent: number, budget: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - 20 * (rent / budget))))
}

function weatherScore(city: City, allCities: City[], type: WeatherType): number {
  const temps   = allCities.map((c) => c.avgTempC)
  const precips = allCities.map((c) => c.annualPrecipMm)
  const minTemp = Math.min(...temps),     maxTemp = Math.max(...temps)
  const minPrecip = Math.min(...precips), maxPrecip = Math.max(...precips)
  const range = Math.max(maxTemp - minTemp, 1)

  const dryScore  = invertedNormalize(city.annualPrecipMm, minPrecip, maxPrecip)
  const warmScore = minMaxNormalize(city.avgTempC, minTemp, maxTemp)

  switch (type) {
    case "warm":         return Math.round(warmScore * 0.85 + dryScore * 0.15)
    case "mild":         return Math.round(bellCurve(city.avgTempC, 10, range) * 0.75 + dryScore * 0.25)
    case "four_seasons": return Math.round(bellCurve(city.avgTempC, 8, range) * 0.5  + dryScore * 0.5)
    case "dry":          return dryScore
  }
}

// Dataset min/max for every min–max-normalized metric. Shared by the factor-score
// computation and by the goal→target-score mapping so both use identical bounds.
export type Stats = ReturnType<typeof getStats>
export function getStats(cities: City[]) {
  const range = (vals: number[]) => ({ min: Math.min(...vals), max: Math.max(...vals) })
  return {
    walk:   range(cities.map((c) => c.walkScore)),
    crime:  range(cities.map((c) => c.crimeIndex)),
    income: range(cities.map((c) => c.medianHouseholdIncome)),
    transit: range(cities.map((c) => c.transitScore)),
    unemp:  range(cities.map((c) => c.unemploymentRate)),
    pm25:   range(cities.map((c) => c.pm25)),
    school: range(cities.map((c) => c.schoolRating)),
  }
}

// Normalize every raw metric into a comparable 0–100 factor score, where higher is
// always better. This is shared by the weighted model and both goal-programming methods.
export function computeFactorScores(
  cities: City[],
  stats: Stats,
  weatherType: WeatherType,
  unitType: UnitType,
  budget: number
): { city: City; factorScores: FactorScores }[] {
  return cities.map((city) => {
    const rent = getRent(city, unitType)
    const factorScores: FactorScores = {
      walkability:   minMaxNormalize(city.walkScore, stats.walk.min, stats.walk.max),
      affordability: affordabilityScore(rent, budget),
      safety:        invertedNormalize(city.crimeIndex, stats.crime.min, stats.crime.max),
      weather:       weatherScore(city, cities, weatherType),
      income:        minMaxNormalize(city.medianHouseholdIncome, stats.income.min, stats.income.max),
      transit:       minMaxNormalize(city.transitScore, stats.transit.min, stats.transit.max),
      employment:    invertedNormalize(city.unemploymentRate, stats.unemp.min, stats.unemp.max),
      airQuality:    invertedNormalize(city.pm25, stats.pm25.min, stats.pm25.max),
      education:     minMaxNormalize(city.schoolRating, stats.school.min, stats.school.max),
    }
    return { city, factorScores }
  })
}

// Classic weighted additive model — maximize the weighted sum of factor scores.
// Kept as a comparison baseline against the goal-programming methods.
export function scoreCities(
  cities: City[],
  weights: Weights,
  weatherType: WeatherType = "four_seasons",
  unitType: UnitType = "one_bed",
  budget: number = 2000
): ScoredCity[] {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  const w = totalWeight === 0
    ? Object.fromEntries(Object.keys(weights).map((k) => [k, 1 / Object.keys(weights).length])) as Record<keyof Weights, number>
    : Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / totalWeight])) as Record<keyof Weights, number>

  const scored = computeFactorScores(cities, getStats(cities), weatherType, unitType, budget).map(({ city, factorScores }) => {
    const totalScore = Math.round(
      Object.entries(factorScores).reduce((sum, [key, score]) => sum + score * w[key as keyof Weights], 0)
    )
    return { ...city, factorScores, totalScore }
  })

  return scored.sort((a, b) => b.totalScore - a.totalScore)
}

const FACTOR_KEYS = Object.keys({
  walkability: 0, affordability: 0, safety: 0, weather: 0, income: 0,
  transit: 0, employment: 0, airQuality: 0, education: 0,
} satisfies Record<keyof Weights, number>) as (keyof Weights)[]

// One-sided deviation: how far a city's factor score falls SHORT of its target.
// All factor scores are "higher is better", so we only ever penalize undershooting.
function undershoot(factorScore: number, targetScore: number): number {
  return Math.max(0, targetScore - factorScore)
}

// Map each raw-unit goal onto the same normalized 0–100 scale the cities are measured
// on, using identical dataset bounds and normalization direction. A city that exactly
// meets the raw goal lands right on its target score, so deviation math stays uniform.
export function goalTargetScores(stats: Stats, goals: Goals): FactorScores {
  return {
    walkability:   minMaxNormalize(goals.walkability, stats.walk.min, stats.walk.max),
    affordability: AFFORDABILITY_TARGET_SCORE,
    safety:        invertedNormalize(goals.safety, stats.crime.min, stats.crime.max),
    weather:       WEATHER_TARGET_SCORE,
    income:        minMaxNormalize(goals.income, stats.income.min, stats.income.max),
    transit:       minMaxNormalize(goals.transit, stats.transit.min, stats.transit.max),
    employment:    invertedNormalize(goals.employment, stats.unemp.min, stats.unemp.max),
    airQuality:    invertedNormalize(goals.airQuality, stats.pm25.min, stats.pm25.max),
    education:     minMaxNormalize(goals.education, stats.school.min, stats.school.max),
  }
}

// Goal programming. Instead of maximizing a blended score, we minimize how far each
// city deviates from the user's per-factor goals, prioritized by tier.
//
//   goalWeighted   (Archimedean): minimize Σ wᵢ · deviationᵢ, wᵢ = tier weight.
//   goalPreemptive (lexicographic): minimize Must-Have deviations first; only break
//                  ties with Nice-to-Have, then Bonus.
//
// `totalScore` is reported as a 0–100 goal-attainment score (100 = every goal met),
// so the rest of the UI can render it exactly like the weighted model's score.
export function scoreCitiesByGoal(
  cities: City[],
  tiers: Tiers,
  goals: Goals,
  method: Exclude<ScoringMethod, "weighted"> = "goalWeighted",
  weatherType: WeatherType = "four_seasons",
  unitType: UnitType = "one_bed",
  budget: number = 2000
): ScoredCity[] {
  const weights = computeWeights(tiers)
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  const stats = getStats(cities)
  const targets = goalTargetScores(stats, goals)

  const scored = computeFactorScores(cities, stats, weatherType, unitType, budget).map(({ city, factorScores }) => {
    const goalDeviations = { ...factorScores } as FactorScores
    for (const key of FACTOR_KEYS) {
      goalDeviations[key] = tierOf(tiers, key) ? undershoot(factorScores[key], targets[key]) : 0
    }

    // Weighted (Archimedean) penalty → 0–100 goal-attainment score.
    const weightedDeviation = totalWeight === 0
      ? 0
      : FACTOR_KEYS.reduce((sum, key) => sum + (weights[key] / totalWeight) * goalDeviations[key], 0)
    const totalScore = Math.round(Math.max(0, 100 - weightedDeviation))

    // Per-tier total deviation, used as the lexicographic sort key for preemptive GP.
    const tierDeviation = TIER_ORDER.map((t) =>
      tiers[t].reduce((sum, key) => sum + goalDeviations[key], 0)
    )

    const scoredCity: ScoredCity = { ...city, factorScores, goalDeviations, totalScore }
    return { scoredCity, tierDeviation }
  })

  scored.sort((a, b) => {
    if (method === "goalPreemptive") {
      for (let i = 0; i < a.tierDeviation.length; i++) {
        const diff = a.tierDeviation[i] - b.tierDeviation[i]
        if (Math.abs(diff) > 1e-9) return diff // lower deviation ranks higher
      }
      return b.scoredCity.totalScore - a.scoredCity.totalScore
    }
    return b.scoredCity.totalScore - a.scoredCity.totalScore
  })

  return scored.map(({ scoredCity }) => scoredCity)
}

export function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e"
  if (score >= 50) return "#f59e0b"
  return "#ef4444"
}
