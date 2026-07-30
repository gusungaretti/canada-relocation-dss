"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useHasActiveFactors } from "@/components/ScoreText"
import { scoreCitiesByGoal } from "@/lib/scoring"
import {
  loadPersistedTiers, loadPersistedGoals, loadIncludeSuburbs,
  loadWeatherType, loadUnitType, loadBudget,
} from "@/lib/explorePrefs"
import citiesRaw from "@/data/cities.json"
import suburbsRaw from "@/data/suburbs.json"
import type { City } from "@/lib/types"

const cities = citiesRaw as City[]
const suburbs = suburbsRaw as City[]

function scoreColor(score: number) {
  if (score >= 70) return "#16a34a"
  if (score >= 50) return "#d97706"
  return "#dc2626"
}

interface Props {
  slug: string
  isSuburb: boolean
  cityName: string
  province: string
  cmaId?: string
  parentCitySlug?: string
  parentCityName?: string
  fallbackRank: number
  fallbackPoolSize: number
  fallbackScore: number
}

export default function CityHero({
  slug, isSuburb, cityName, province, cmaId, parentCitySlug, parentCityName,
  fallbackRank, fallbackPoolSize, fallbackScore,
}: Props) {
  const hasActiveFactors = useHasActiveFactors()
  const [personalized, setPersonalized] = useState<{ rank: number; poolSize: number; score: number } | null>(null)

  // Recompute rank/score from persisted explore-session state (client-only — avoids
  // SSR/hydration mismatch, matching the pattern in WeightSliders.tsx).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!hasActiveFactors) { setPersonalized(null); return }
    const tiers = loadPersistedTiers()
    if (!Object.values(tiers).some((list) => list.length > 0)) { setPersonalized(null); return }

    const goals = loadPersistedGoals()
    const includeSuburbs = loadIncludeSuburbs()
    const weatherType = loadWeatherType()
    const unitType = loadUnitType()
    const budget = loadBudget()

    const pool = isSuburb
      ? (includeSuburbs ? [...cities, ...suburbs] : suburbs.filter((s) => s.parentSlug === parentCitySlug))
      : (includeSuburbs ? [...cities, ...suburbs] : cities)

    const scored = scoreCitiesByGoal(pool, tiers, goals, "goalPreemptive", weatherType, unitType, budget)
    const idx = scored.findIndex((c) => c.slug === slug)
    if (idx === -1) { setPersonalized(null); return }
    setPersonalized({ rank: idx + 1, poolSize: scored.length, score: scored[idx].totalScore })
  }, [slug, isSuburb, parentCitySlug, hasActiveFactors])
  /* eslint-enable react-hooks/set-state-in-effect */

  const rank = personalized?.rank ?? fallbackRank
  const poolSize = personalized?.poolSize ?? fallbackPoolSize
  const score = personalized?.score ?? fallbackScore
  const isPersonalized = personalized !== null

  return (
    <div className="flex items-start justify-between mb-14">
      <div>
        <div className="flex items-center gap-2 mb-4 text-xs font-mono text-neutral-400">
          <span>#{rank} of {poolSize}</span>
          <span>·</span>
          <span>{province}</span>
          {!isSuburb && cmaId && (
            <>
              <span>·</span>
              <span>CMA {cmaId}</span>
            </>
          )}
          <span
            className={isPersonalized ? "text-neutral-500" : "text-neutral-300"}
            title={isPersonalized
              ? "Ranked using your current explore priorities"
              : "Set priorities on /explore to see your personalized rank here"}
          >
            {isPersonalized ? "· your priorities" : "· equal-weighted"}
          </span>
        </div>
        {isSuburb && parentCitySlug && parentCityName && (
          <Link
            href={`/city/${parentCitySlug}`}
            className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-black transition-colors mb-2"
          >
            <ArrowLeft size={11} />
            Part of {parentCityName} CMA
          </Link>
        )}
        <h1 className="text-5xl font-bold tracking-tight text-black leading-none">{cityName}</h1>
      </div>
      <div className="text-right">
        <span className="text-7xl font-bold font-mono leading-none block" style={{ color: scoreColor(score) }}>
          {score}
        </span>
        <div className="text-xs text-neutral-400 mt-2 font-mono">/ 100</div>
      </div>
    </div>
  )
}
