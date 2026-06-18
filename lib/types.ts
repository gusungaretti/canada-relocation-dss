export type WeatherType = "warm" | "mild" | "four_seasons" | "dry"
export type UnitType = "studio" | "one_bed" | "two_bed" | "three_bed"

export interface City {
  id: string
  slug: string
  name: string
  province: string
  lat: number
  lng: number
  walkScore: number
  avgRentStudio: number
  avgRent1BR: number
  avgRent2BR: number
  avgRent3BR: number
  crimeIndex: number
  avgTempC: number
  annualPrecipMm: number
}

export interface Weights {
  walkability: number
  affordability: number
  safety: number
  weather: number
}

export interface FactorScores {
  walkability: number
  affordability: number
  safety: number
  weather: number
}

export interface ScoredCity extends City {
  factorScores: FactorScores
  totalScore: number
}
