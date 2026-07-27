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
  subreddit?: string             // Reddit community name (e.g. "vancouver")
  parentSlug?: string            // set for suburb entries — slug of the parent CMA
  inheritedFields?: string[]     // field names copied from the parent CMA (no sub-CMA source exists)
}

export interface SubredditWord {
  word: string
  count: number
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
  // Populated only by the goal-programming methods (undefined for the weighted model).
  goalDeviations?: FactorScores
  // Set only by the shortlist (binary goal program) method: true if the city is one of
  // the k cities selected for the shortlist.
  inShortlist?: boolean
}

// --- Priorities & goal programming ---

export type TierKey = "mustHave" | "niceToHave" | "bonus"

export type Tiers = Record<TierKey, (keyof Weights)[]>

// Target factor score (0–100) the user aspires to reach for each factor.
export type Goals = Record<keyof Weights, number>

// "weighted"        → classic weighted additive model (maximize weighted score)
// "goalWeighted"    → Archimedean goal programming (minimize weighted deviation from goals)
// "goalPreemptive"  → lexicographic goal programming (satisfy tiers in strict priority order)
// "goalShortlist"   → binary goal program: pick the best set of k cities that TOGETHER
//                     cover the goals (best-in-set achievement, preemptive by tier)
export type ScoringMethod = "weighted" | "goalWeighted" | "goalPreemptive" | "goalShortlist"
