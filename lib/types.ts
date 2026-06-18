export interface City {
  id: string
  slug: string
  name: string
  province: string
  lat: number
  lng: number
  walkScore: number
  avgRent1BR: number
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
