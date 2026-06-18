import type { City, Weights, WeatherType, FactorScores, ScoredCity } from "./types"

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

function weatherScore(city: City, allCities: City[], type: WeatherType): number {
  const temps   = allCities.map((c) => c.avgTempC)
  const precips = allCities.map((c) => c.annualPrecipMm)
  const minTemp = Math.min(...temps),   maxTemp = Math.max(...temps)
  const minPrecip = Math.min(...precips), maxPrecip = Math.max(...precips)
  const range = Math.max(maxTemp - minTemp, 1)

  const dryScore  = invertedNormalize(city.annualPrecipMm, minPrecip, maxPrecip)
  const warmScore = minMaxNormalize(city.avgTempC, minTemp, maxTemp)

  switch (type) {
    case "warm":
      // Reward highest annual avg temp — Windsor, Victoria, Vancouver rise
      return Math.round(warmScore * 0.85 + dryScore * 0.15)

    case "mild":
      // Bell curve around 10°C annual avg (Vancouver/Victoria sweet spot), precip less penalised
      return Math.round(bellCurve(city.avgTempC, 10, range) * 0.75 + dryScore * 0.25)

    case "four_seasons":
      // Current formula: comfortable mid-range temp + reasonably dry
      return Math.round(bellCurve(city.avgTempC, 8, range) * 0.5 + dryScore * 0.5)

    case "dry":
      // Cold is fine — just keep the rain and snow down (Calgary, Regina, Saskatoon win)
      return dryScore
  }
}

export function scoreCities(
  cities: City[],
  weights: Weights,
  weatherType: WeatherType = "four_seasons"
): ScoredCity[] {
  const walkScores = cities.map((c) => c.walkScore)
  const rents      = cities.map((c) => c.avgRent1BR)
  const crimes     = cities.map((c) => c.crimeIndex)

  const minWalk = Math.min(...walkScores), maxWalk = Math.max(...walkScores)
  const minRent = Math.min(...rents),      maxRent = Math.max(...rents)
  const minCrime = Math.min(...crimes),    maxCrime = Math.max(...crimes)

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
    const factorScores: FactorScores = {
      walkability:   minMaxNormalize(city.walkScore, minWalk, maxWalk),
      affordability: invertedNormalize(city.avgRent1BR, minRent, maxRent),
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
