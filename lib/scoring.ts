import type { City, Weights, FactorScores, ScoredCity } from "./types"

function minMaxNormalize(value: number, min: number, max: number): number {
  if (max === min) return 50
  return Math.round(((value - min) / (max - min)) * 100)
}

function invertedNormalize(value: number, min: number, max: number): number {
  return 100 - minMaxNormalize(value, min, max)
}

function weatherComfort(tempC: number, precipMm: number, allCities: City[]): number {
  const temps = allCities.map((c) => c.avgTempC)
  const precips = allCities.map((c) => c.annualPrecipMm)
  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)
  const minPrecip = Math.min(...precips)
  const maxPrecip = Math.max(...precips)

  // Ideal annual avg temp ~9°C (Victoria/Toronto range). Bell curve falloff.
  const idealTemp = 9
  const tempRange = Math.max(maxTemp - minTemp, 1)
  const tempComfort = Math.max(0, 100 - Math.abs(tempC - idealTemp) * (100 / tempRange) * 1.6)

  // Lower precip = better
  const precipComfort = 100 - minMaxNormalize(precipMm, minPrecip, maxPrecip)

  return Math.round(tempComfort * 0.5 + precipComfort * 0.5)
}

export function scoreCities(cities: City[], weights: Weights): ScoredCity[] {
  const walkScores = cities.map((c) => c.walkScore)
  const rents = cities.map((c) => c.avgRent1BR)
  const crimes = cities.map((c) => c.crimeIndex)

  const minWalk = Math.min(...walkScores)
  const maxWalk = Math.max(...walkScores)
  const minRent = Math.min(...rents)
  const maxRent = Math.max(...rents)
  const minCrime = Math.min(...crimes)
  const maxCrime = Math.max(...crimes)

  const totalWeight = weights.walkability + weights.affordability + weights.safety + weights.weather
  const w = totalWeight === 0
    ? { walkability: 0.25, affordability: 0.25, safety: 0.25, weather: 0.25 }
    : {
        walkability: weights.walkability / totalWeight,
        affordability: weights.affordability / totalWeight,
        safety: weights.safety / totalWeight,
        weather: weights.weather / totalWeight,
      }

  const scored = cities.map((city) => {
    const factorScores: FactorScores = {
      walkability: minMaxNormalize(city.walkScore, minWalk, maxWalk),
      affordability: invertedNormalize(city.avgRent1BR, minRent, maxRent),
      safety: invertedNormalize(city.crimeIndex, minCrime, maxCrime),
      weather: weatherComfort(city.avgTempC, city.annualPrecipMm, cities),
    }

    const totalScore = Math.round(
      factorScores.walkability * w.walkability +
      factorScores.affordability * w.affordability +
      factorScores.safety * w.safety +
      factorScores.weather * w.weather
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
