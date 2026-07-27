import type { Weights, TierKey, Tiers } from "./types"

// Ratio system: each Must Have factor always outweighs each Nice to Have factor,
// regardless of how many factors are in each tier. 3:2:1 per-factor ratio.
// In goal-programming terms these are the penalty weights on unwanted deviations.
export const TIER_MULTIPLIERS: Record<TierKey, number> = { mustHave: 3, niceToHave: 2, bonus: 1 }

// Priority order for preemptive (lexicographic) goal programming: earlier tiers are
// satisfied before later ones are even considered.
export const TIER_ORDER: TierKey[] = ["mustHave", "niceToHave", "bonus"]

export const EMPTY_WEIGHTS: Weights = {
  walkability: 0, affordability: 0, safety: 0, weather: 0, income: 0,
  transit: 0, employment: 0, airQuality: 0, education: 0,
}

export const EMPTY_TIERS: Tiers = { mustHave: [], niceToHave: [], bonus: [] }

// Convert tier assignments into per-factor percentage weights that always sum to 100.
export function computeWeights(tiers: Tiers): Weights {
  const weights: Weights = { ...EMPTY_WEIGHTS }
  const divisor = TIER_ORDER.reduce((sum, t) => sum + tiers[t].length * TIER_MULTIPLIERS[t], 0)
  if (divisor === 0) return weights

  const x = 100 / divisor
  const fractionals: { key: keyof Weights; frac: number }[] = []

  TIER_ORDER.forEach((tier) => {
    const perFactor = x * TIER_MULTIPLIERS[tier]
    tiers[tier].forEach((f) => {
      const floored = Math.floor(perFactor)
      weights[f] = floored
      fractionals.push({ key: f, frac: perFactor - floored })
    })
  })

  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  fractionals
    .sort((a, b) => b.frac - a.frac)
    .slice(0, 100 - total)
    .forEach(({ key }) => { weights[key]++ })

  return weights
}

// Which tier a factor is assigned to, or null if unranked.
export function tierOf(tiers: Tiers, factor: keyof Weights): TierKey | null {
  for (const t of TIER_ORDER) {
    if (tiers[t].includes(factor)) return t
  }
  return null
}
