import type { City, Weights, WeatherType, UnitType, FactorScores, ScoredCity } from "./types"

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
  const walkScores  = cities.map((c) => c.walkScore)
  const crimes      = cities.map((c) => c.crimeIndex)
  const incomes     = cities.map((c) => c.medianHouseholdIncome)
  const transits    = cities.map((c) => c.transitScore)
  const unemps      = cities.map((c) => c.unemploymentRate)
  const pm25s       = cities.map((c) => c.pm25)
  const schoolRates = cities.map((c) => c.schoolRating)

  const minWalk  = Math.min(...walkScores),  maxWalk  = Math.max(...walkScores)
  const minCrime = Math.min(...crimes),      maxCrime = Math.max(...crimes)
  const minInc   = Math.min(...incomes),     maxInc   = Math.max(...incomes)
  const minTrans = Math.min(...transits),    maxTrans = Math.max(...transits)
  const minUnemp = Math.min(...unemps),      maxUnemp = Math.max(...unemps)
  const minPm25  = Math.min(...pm25s),       maxPm25  = Math.max(...pm25s)
  const minSch   = Math.min(...schoolRates), maxSch   = Math.max(...schoolRates)

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  const w = totalWeight === 0
    ? Object.fromEntries(Object.keys(weights).map((k) => [k, 1 / Object.keys(weights).length])) as Record<keyof Weights, number>
    : Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / totalWeight])) as Record<keyof Weights, number>

  const scored = cities.map((city) => {
    const rent = getRent(city, unitType)
    const factorScores: FactorScores = {
      walkability:   minMaxNormalize(city.walkScore, minWalk, maxWalk),
      affordability: affordabilityScore(rent, budget),
      safety:        invertedNormalize(city.crimeIndex, minCrime, maxCrime),
      weather:       weatherScore(city, cities, weatherType),
      income:        minMaxNormalize(city.medianHouseholdIncome, minInc, maxInc),
      transit:       minMaxNormalize(city.transitScore, minTrans, maxTrans),
      employment:    invertedNormalize(city.unemploymentRate, minUnemp, maxUnemp),
      airQuality:    invertedNormalize(city.pm25, minPm25, maxPm25),
      education:     minMaxNormalize(city.schoolRating, minSch, maxSch),
    }

    const totalScore = Math.round(
      Object.entries(factorScores).reduce((sum, [key, score]) => sum + score * w[key as keyof Weights], 0)
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
