import type { City, Weights, WeatherType, UnitType, FactorScores, ScoredCity } from "./types"

function minMaxNormalize(value: number, min: number, max: number): number {
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

// Budget-relative affordability: 80 at budget, >80 under budget, <80 over budget
function affordabilityScore(rent: number, budget: number): number {
  return Math.max(0, Math.min(100, Math.round((budget / rent) * 80)))
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

export function scoreCities(
  cities: City[],
  weights: Weights,
  weatherType: WeatherType = "four_seasons",
  unitType: UnitType = "one_bed",
  budget: number = 2000
): ScoredCity[] {
  const walkScores = cities.map((c) => c.walkScore)
  const crimes     = cities.map((c) => c.crimeIndex)

  const minWalk  = Math.min(...walkScores), maxWalk  = Math.max(...walkScores)
  const minCrime = Math.min(...crimes),     maxCrime = Math.max(...crimes)

  const totalWeight = weights.walkability + weights.affordability + weights.safety + weights.weather
  const w = totalWeight === 0
    ? { walkability: 0.25, affordability: 0.25, safety: 0.25, weather: 0.25 }
    : {
        walkability:   weights.walkability   / totalWeight,
        affordability: weights.affordability / totalWeight,
        safety:        weights.safety        / totalWeight,
        weather:       weights.weather       / totalWeight,
      }

  const scored = cities.map((city) => {
    const rent = getRent(city, unitType)
    const factorScores: FactorScores = {
      walkability:   minMaxNormalize(city.walkScore, minWalk, maxWalk),
      affordability: affordabilityScore(rent, budget),
      safety:        invertedNormalize(city.crimeIndex, minCrime, maxCrime),
      weather:       weatherScore(city, cities, weatherType),
    }

    const totalScore = Math.round(
      factorScores.walkability   * w.walkability   +
      factorScores.affordability * w.affordability +
      factorScores.safety        * w.safety        +
      factorScores.weather       * w.weather
    )

    return { ...city, factorScores, totalScore }
  })

  return scored.sort((a, b) => b.totalScore - a.totalScore)
}

export function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e"
  if (score >= 50) return "#f59e0b"
  return "#ef4444"
}
