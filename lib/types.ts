export type WeatherType = "warm" | "mild" | "four_seasons" | "dry"
export type UnitType = "studio" | "one_bed" | "two_bed" | "three_bed"

export interface City {
  id: string
  slug: string
  name: string
  province: string
  lat: number
  lng: number
  // Existing factors
  walkScore: number
  avgRentStudio: number
  avgRent1BR: number
  avgRent2BR: number
  avgRent3BR: number
  crimeIndex: number
  avgTempC: number
  annualPrecipMm: number
  // New factors
  medianHouseholdIncome: number  // after-tax CAD (Canadian Income Survey)
  transitScore: number           // 0–100 (Canadian Public Transit Network DB)
  unemploymentRate: number       // % (Labour Force Survey by CMA)
  pm25: number                   // μg/m³ annual avg (NAPS) — lower is better
  schoolRating: number           // 0–10 composite (Fraser Institute)
}

export interface Weights {
  walkability: number
  affordability: number
  safety: number
  weather: number
  income: number
  transit: number
  employment: number
  airQuality: number
  education: number
}

export interface FactorScores {
  walkability: number
  affordability: number
  safety: number
  weather: number
  income: number
  transit: number
  employment: number
  airQuality: number
  education: number
}

export interface ScoredCity extends City {
  factorScores: FactorScores
  totalScore: number
}
