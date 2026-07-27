import type { City, Tiers, Goals, WeatherType, UnitType, FactorScores, ScoredCity } from "./types"
import { computeWeights, tierOf, TIER_ORDER } from "./priorities"
import { getStats, computeFactorScores, goalTargetScores } from "./scoring"

// --- Shortlist: a binary (0/1) goal program ---------------------------------
//
// Instead of ranking single cities, we pick the best SET of k cities that TOGETHER
// cover the user's goals. A factor's achievement for a set S is the BEST (max) factor
// score among the chosen cities, so the set's shortfall on factor i is
//   e_i(S) = max(0, targetScore_i − max_{c∈S} s_i(c)) = min_{c∈S} sf_i(c)
// where sf_i(c) = max(0, targetScore_i − s_i(c)) is the individual shortfall.
//
// The objective is preemptive / lexicographic by tier: minimize total Must-Have
// shortfall first, then Nice-to-Have, then Bonus. Ties are broken by a weighted
// attainment (larger is better), then deterministically by the set's city slugs.
//
// This is an NP-hard covering-type problem. With k capped at 5 and 38 CMAs the
// number of size-k combinations is small enough to solve EXACTLY by enumeration; a
// greedy submodular heuristic is kept as a safety fallback for larger instances.

const MAX_K = 5
const EXACT_COMBINATION_LIMIT = 1_000_000

const FACTOR_KEYS: (keyof FactorScores)[] = [
  "walkability", "affordability", "safety", "weather", "income",
  "transit", "employment", "airQuality", "education",
]

const EPS = 1e-9

// Number of k-combinations of n items (upper bound on feasible sets — it ignores the
// one-per-province filter, which only ever reduces the count).
function nChooseK(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  let result = 1
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1)
  }
  return Math.round(result)
}

// Objective value of a candidate set: per-tier best-in-set shortfall (D1,D2,D3) plus a
// weighted attainment A (larger is better). `sf[c][f]` is city c's shortfall on ranked
// factor index f; `tierIndexOf[f]` is 0/1/2; `weightFrac[f]` is w_f / Σw.
function evalSet(
  indices: number[],
  sf: number[][],
  rankedCount: number,
  tierIndexOf: number[],
  weightFrac: number[]
): { D: [number, number, number]; A: number } {
  const D: [number, number, number] = [0, 0, 0]
  let weightedDeviation = 0
  for (let f = 0; f < rankedCount; f++) {
    // best-in-set shortfall = smallest individual shortfall among chosen cities
    let best = Infinity
    for (const c of indices) {
      if (sf[c][f] < best) best = sf[c][f]
    }
    D[tierIndexOf[f]] += best
    weightedDeviation += weightFrac[f] * best
  }
  return { D, A: 100 - weightedDeviation }
}

// Lexicographic comparison of two set objectives (smaller D is better; larger A breaks
// ties). Returns <0 if `a` is strictly better, >0 if `b` is better, 0 if indistinguishable.
function compareObjective(
  a: { D: [number, number, number]; A: number },
  b: { D: [number, number, number]; A: number }
): number {
  for (let i = 0; i < 3; i++) {
    const diff = a.D[i] - b.D[i]
    if (Math.abs(diff) > EPS) return diff
  }
  return b.A - a.A
}

// Stable, human-independent key for a set so equal-objective sets resolve deterministically.
function setKey(indices: number[], slugs: string[]): string {
  return indices.map((c) => slugs[c]).sort().join("|")
}

export function selectShortlist(
  cities: City[],
  tiers: Tiers,
  goals: Goals,
  k: number,
  options: { onePerProvince: boolean },
  weatherType: WeatherType = "four_seasons",
  unitType: UnitType = "one_bed",
  budget: number = 2000
): ScoredCity[] {
  const stats = getStats(cities)
  const scored = computeFactorScores(cities, stats, weatherType, unitType, budget)
  const targets = goalTargetScores(stats, goals)
  const weights = computeWeights(tiers)
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)

  // Ranked factors (assigned to any tier), in a stable order, with their tier index.
  const rankedFactors: (keyof FactorScores)[] = []
  const tierIndexOf: number[] = []
  for (const key of FACTOR_KEYS) {
    const tier = tierOf(tiers, key)
    if (tier) {
      rankedFactors.push(key)
      tierIndexOf.push(TIER_ORDER.indexOf(tier))
    }
  }
  const rankedCount = rankedFactors.length
  const weightFrac = rankedFactors.map((key) => (totalWeight === 0 ? 0 : weights[key] / totalWeight))

  // Individual per-factor shortfall for the full FactorScores shape (for goalDeviations),
  // and a compact ranked-only matrix `sf` used by the set evaluation.
  const slugs = cities.map((c) => c.slug)
  const sf: number[][] = new Array(cities.length)
  const fullDeviations: FactorScores[] = new Array(cities.length)
  const attainment: number[] = new Array(cities.length) // individual 0–100 goal attainment

  scored.forEach(({ factorScores }, ci) => {
    const dev = { ...factorScores } as FactorScores
    for (const key of FACTOR_KEYS) {
      dev[key] = tierOf(tiers, key) ? Math.max(0, targets[key] - factorScores[key]) : 0
    }
    fullDeviations[ci] = dev
    sf[ci] = rankedFactors.map((key) => dev[key])

    const weightedDeviation = rankedFactors.reduce(
      (sum, key, f) => sum + weightFrac[f] * dev[key], 0
    )
    attainment[ci] = Math.max(0, 100 - weightedDeviation)
  })

  const buildScoredCity = (ci: number, inShortlist: boolean): ScoredCity => ({
    ...cities[ci],
    factorScores: scored[ci].factorScores,
    goalDeviations: fullDeviations[ci],
    totalScore: Math.round(attainment[ci]),
    inShortlist,
  })

  // No factors ranked → nothing to cover. Return cities scored, no shortlist members,
  // so the UI falls back to its "no factors" empty state.
  if (rankedCount === 0) {
    return cities
      .map((_, ci) => ci)
      .sort((a, b) => attainment[b] - attainment[a] || slugs[a].localeCompare(slugs[b]))
      .map((ci) => ({
        ...cities[ci],
        factorScores: scored[ci].factorScores,
        goalDeviations: fullDeviations[ci],
        totalScore: Math.round(attainment[ci]),
      }))
  }

  // Eligible cities and a feasible k. If diversifying by province, at most one city per
  // province, so k cannot exceed the number of distinct provinces.
  const n = cities.length
  const distinctProvinces = new Set(cities.map((c) => c.province)).size
  const provinceCap = options.onePerProvince ? distinctProvinces : n
  const kClamped = Math.max(1, Math.min(k, MAX_K, n, provinceCap))

  const provinceOf = cities.map((c) => c.province)

  // Decide exact vs greedy. nChooseK is an upper bound (province filtering only shrinks
  // the feasible count), so if it clears the limit exact enumeration is safe.
  const useExact = nChooseK(n, kClamped) <= EXACT_COMBINATION_LIMIT

  let bestIndices: number[] | null = null
  let bestObj: { D: [number, number, number]; A: number } | null = null
  let bestKey = ""

  const consider = (indices: number[]) => {
    const obj = evalSet(indices, sf, rankedCount, tierIndexOf, weightFrac)
    if (bestObj === null) {
      bestObj = obj; bestIndices = indices.slice(); bestKey = setKey(indices, slugs)
      return
    }
    const cmp = compareObjective(obj, bestObj)
    if (cmp < -EPS) {
      bestObj = obj; bestIndices = indices.slice(); bestKey = setKey(indices, slugs)
    } else if (Math.abs(cmp) <= EPS) {
      // Deterministic tiebreak on the set's sorted slugs.
      const key = setKey(indices, slugs)
      if (key < bestKey) { bestObj = obj; bestIndices = indices.slice(); bestKey = key }
    }
  }

  if (useExact) {
    // Enumerate every size-k combination (respecting one-per-province) and keep the best.
    const combo: number[] = []
    const usedProvinces = new Set<string>()
    const enumerate = (start: number) => {
      if (combo.length === kClamped) { consider(combo); return }
      // Prune: not enough remaining cities to fill the combo.
      for (let i = start; i <= n - (kClamped - combo.length); i++) {
        if (options.onePerProvince && usedProvinces.has(provinceOf[i])) continue
        combo.push(i)
        if (options.onePerProvince) usedProvinces.add(provinceOf[i])
        enumerate(i + 1)
        combo.pop()
        if (options.onePerProvince) usedProvinces.delete(provinceOf[i])
      }
    }
    enumerate(0)
  } else {
    // Greedy submodular fallback: repeatedly add the feasible city that most improves the
    // lexicographic objective of the partial set.
    const chosen: number[] = []
    const usedProvinces = new Set<string>()
    while (chosen.length < kClamped) {
      let bestAdd = -1
      let bestAddObj: { D: [number, number, number]; A: number } | null = null
      for (let c = 0; c < n; c++) {
        if (chosen.includes(c)) continue
        if (options.onePerProvince && usedProvinces.has(provinceOf[c])) continue
        const trial = [...chosen, c]
        const obj = evalSet(trial, sf, rankedCount, tierIndexOf, weightFrac)
        if (bestAddObj === null || compareObjective(obj, bestAddObj) < -EPS) {
          bestAddObj = obj; bestAdd = c
        }
      }
      if (bestAdd < 0) break // no feasible city left
      chosen.push(bestAdd)
      if (options.onePerProvince) usedProvinces.add(provinceOf[bestAdd])
    }
    bestIndices = chosen
  }

  const shortlistSet = new Set(bestIndices ?? [])

  const inShortlistCities = (bestIndices ?? [])
    .slice()
    .sort((a, b) => attainment[b] - attainment[a] || slugs[a].localeCompare(slugs[b]))
    .map((ci) => buildScoredCity(ci, true))

  const otherCities = cities
    .map((_, ci) => ci)
    .filter((ci) => !shortlistSet.has(ci))
    .sort((a, b) => attainment[b] - attainment[a] || slugs[a].localeCompare(slugs[b]))
    .map((ci) => buildScoredCity(ci, false))

  return [...inShortlistCities, ...otherCities]
}
