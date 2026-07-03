import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { scoreCities } from "@/lib/scoring"
import SubredditWordCloud from "@/components/SubredditWordCloud"
import FactorTooltip from "@/components/FactorTooltip"
import ScoreText from "@/components/ScoreText"
import { FACTOR_DEFINITIONS } from "@/lib/factorDefinitions"
import citiesRaw from "@/data/cities.json"
import suburbsRaw from "@/data/suburbs.json"
import subredditWordsRaw from "@/data/subreddit_words.json"
import type { City, SubredditWord, Weights } from "@/lib/types"

const subredditWords = subredditWordsRaw as Record<string, SubredditWord[]>
const cities = citiesRaw as City[]
const suburbs = suburbsRaw as City[]

const EQUAL_WEIGHTS = {
  walkability: 11, affordability: 11, safety: 11, weather: 11,
  income: 11, transit: 11, employment: 11, airQuality: 12, education: 11,
}

function scoreColor(score: number) {
  if (score >= 70) return "#16a34a"
  if (score >= 50) return "#d97706"
  return "#dc2626"
}

function ScoreRow({ label, factorKey, score, color, raw, inherited }: { label: string; factorKey: keyof Weights; score: number; color: string; raw: string; inherited?: boolean }) {
  return (
    <div className="grid items-center gap-6 py-4 border-t border-black/[0.06]" style={{ gridTemplateColumns: "130px 1fr 44px 90px" }}>
      <FactorTooltip text={FACTOR_DEFINITIONS[factorKey]}>
        <span className="text-sm text-neutral-500">{label}</span>
      </FactorTooltip>
      <div className="h-0.5 bg-neutral-100 overflow-hidden rounded-full">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-mono font-semibold text-right" style={{ color }}>{score}</span>
      <span className="text-xs font-mono text-right text-neutral-400">{raw}{inherited ? " *" : ""}</span>
    </div>
  )
}

export default async function CityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const isSuburb = suburbs.some((s) => s.slug === slug)

  let city: City & { factorScores: ReturnType<typeof scoreCities>[number]["factorScores"]; totalScore: number }
  let rank: number
  let poolSize: number
  let parentCity: City | undefined
  let childSuburbs: (City & { factorScores: ReturnType<typeof scoreCities>[number]["factorScores"]; totalScore: number })[] = []

  if (isSuburb) {
    const suburb = suburbs.find((s) => s.slug === slug)!
    const siblings = suburbs.filter((s) => s.parentSlug === suburb.parentSlug)
    const scoredSiblings = scoreCities(siblings, EQUAL_WEIGHTS)
    const found = scoredSiblings.find((c) => c.slug === slug)
    if (!found) notFound()
    city = found
    rank = scoredSiblings.findIndex((c) => c.slug === slug) + 1
    poolSize = scoredSiblings.length
    parentCity = cities.find((c) => c.slug === suburb.parentSlug)
  } else {
    const scoredCities = scoreCities(cities, EQUAL_WEIGHTS)
    const found = scoredCities.find((c) => c.slug === slug)
    if (!found) notFound()
    city = found
    rank = scoredCities.findIndex((c) => c.slug === slug) + 1
    poolSize = scoredCities.length
    const children = suburbs.filter((s) => s.parentSlug === slug)
    if (children.length > 0) childSuburbs = scoreCities(children, EQUAL_WEIGHTS)
  }

  const totalColor = scoreColor(city.totalScore)
  const inheritedSet = new Set(city.inheritedFields ?? [])

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black/[0.06] sticky top-0 bg-white/90 backdrop-blur-sm z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold text-black hover:opacity-70 transition-opacity">
            Maple Moving
          </Link>
          <div className="h-4 w-px bg-black/10" />
          <Link href="/explore" className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-black transition-colors">
            <ArrowLeft size={14} />
            Back to explore
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="flex items-start justify-between mb-14">
          <div>
            <div className="flex items-center gap-2 mb-4 text-xs font-mono text-neutral-400">
              <span>#{rank} of {poolSize}</span>
              <span>·</span>
              <span>{city.province}</span>
              {!isSuburb && (
                <>
                  <span>·</span>
                  <span>CMA {city.id}</span>
                </>
              )}
            </div>
            {isSuburb && parentCity && (
              <Link
                href={`/city/${parentCity.slug}`}
                className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-black transition-colors mb-2"
              >
                <ArrowLeft size={11} />
                Part of {parentCity.name.split("–")[0].trim()} CMA
              </Link>
            )}
            <h1 className="text-5xl font-bold tracking-tight text-black leading-none">{city.name}</h1>
          </div>
          <div className="text-right">
            <ScoreText
              score={city.totalScore}
              className="text-7xl font-bold font-mono leading-none block"
              style={{ color: totalColor }}
            />
            <div className="text-xs text-neutral-400 mt-2 font-mono">/ 100</div>
          </div>
        </div>

        {/* Raw stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { key: "avgRent1BR",             label: "Avg. 1BR rent",       value: `$${city.avgRent1BR.toLocaleString()}`,          sub: "per month" },
            { key: "walkScore",              label: "Walk Score",           value: String(city.walkScore),                           sub: "out of 100" },
            { key: "crimeIndex",             label: "Crime Severity",       value: String(city.crimeIndex),                          sub: "100 = national avg" },
            { key: "avgTempC",               label: "Avg. temperature",     value: `${city.avgTempC}°C`,                            sub: `${city.annualPrecipMm} mm/yr` },
            { key: "medianHouseholdIncome",  label: "Median income",        value: `$${city.medianHouseholdIncome.toLocaleString()}`, sub: "after-tax household" },
            { key: "transitScore",           label: "Transit score",        value: String(city.transitScore),                        sub: "out of 100" },
            { key: "unemploymentRate",       label: "Unemployment",         value: `${city.unemploymentRate}%`,                      sub: "LFS annual" },
            { key: "pm25",                   label: "PM2.5 air quality",    value: `${city.pm25} μg/m³`,                            sub: "lower is cleaner" },
            { key: "schoolRating",           label: "School rating",        value: `${city.schoolRating}/10`,                        sub: "Fraser Institute" },
          ].map(({ key, label, value, sub }) => (
            <div key={label} className="bg-neutral-50 p-4 border border-black/[0.05]">
              <div className="text-xs text-neutral-400 mb-3">{label}</div>
              <div className="text-xl font-mono font-bold text-black">{value}</div>
              <div className="text-xs text-neutral-400 mt-1">{sub}{inheritedSet.has(key) ? " *" : ""}</div>
            </div>
          ))}
        </div>
        {isSuburb && inheritedSet.size > 0 && (
          <p className="text-xs text-neutral-400 mb-9">* CMA-level figure — no separate data source exists at this granularity</p>
        )}
        {!(isSuburb && inheritedSet.size > 0) && <div className="mb-9" />}

        {/* Factor scores */}
        <div className="bg-neutral-50 border border-black/[0.05] px-6 pb-3">
          <div className="grid items-center gap-6 pt-5 pb-3" style={{ gridTemplateColumns: "130px 1fr 44px 90px" }}>
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">Factor</span>
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">Score</span>
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide text-right">/100</span>
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide text-right">Raw</span>
          </div>
          <ScoreRow label="Walkability"   factorKey="walkability"   score={city.factorScores.walkability}   color="#3b82f6" raw={`${city.walkScore} WS`} inherited={inheritedSet.has("walkScore")} />
          <ScoreRow label="Affordability" factorKey="affordability" score={city.factorScores.affordability} color="#10b981" raw={`$${city.avgRent1BR.toLocaleString()}`} inherited={inheritedSet.has("avgRent1BR")} />
          <ScoreRow label="Safety"        factorKey="safety"        score={city.factorScores.safety}        color="#f97316" raw={`CSI ${city.crimeIndex}`} inherited={inheritedSet.has("crimeIndex")} />
          <ScoreRow label="Weather"       factorKey="weather"       score={city.factorScores.weather}       color="#0ea5e9" raw={`${city.avgTempC}°C`} inherited={inheritedSet.has("avgTempC")} />
          <ScoreRow label="Socioeconomic" factorKey="income"        score={city.factorScores.income}        color="#8b5cf6" raw={`$${(city.medianHouseholdIncome / 1000).toFixed(0)}k`} inherited={inheritedSet.has("medianHouseholdIncome")} />
          <ScoreRow label="Transit"       factorKey="transit"       score={city.factorScores.transit}       color="#06b6d4" raw={`${city.transitScore}/100`} inherited={inheritedSet.has("transitScore")} />
          <ScoreRow label="Employment"    factorKey="employment"    score={city.factorScores.employment}    color="#84cc16" raw={`${city.unemploymentRate}% unemp`} inherited={inheritedSet.has("unemploymentRate")} />
          <ScoreRow label="Air Quality"   factorKey="airQuality"    score={city.factorScores.airQuality}    color="#64748b" raw={`${city.pm25} μg/m³`} inherited={inheritedSet.has("pm25")} />
          <ScoreRow label="Education"     factorKey="education"     score={city.factorScores.education}     color="#f59e0b" raw={`${city.schoolRating}/10`} inherited={inheritedSet.has("schoolRating")} />
        </div>

        {/* Suburbs — only on parent CMA pages */}
        {childSuburbs.length > 0 && (
          <div className="mt-12">
            <p className="text-xs font-mono text-neutral-400 uppercase tracking-wide mb-4">
              Suburbs &amp; surrounding areas ({childSuburbs.length})
            </p>
            <div className="border border-black/[0.05] divide-y divide-black/[0.05]">
              {childSuburbs.map((s, i) => (
                <Link
                  key={s.slug}
                  href={`/city/${s.slug}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-neutral-50 transition-colors"
                >
                  <span className="flex-shrink-0 w-5 text-xs font-mono text-neutral-300 text-right">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-black">{s.name}</span>
                  <span className="text-xs font-mono text-neutral-400">${s.avgRent1BR.toLocaleString()}/mo</span>
                  <ScoreText
                    score={s.totalScore}
                    className="text-sm font-mono font-bold"
                    style={{ color: scoreColor(s.totalScore) }}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Community pulse — subreddit word cloud */}
        {city.subreddit && (
          <div className="mt-12">
            <div className="flex items-baseline justify-between mb-4">
              <p className="text-xs font-mono text-neutral-400 uppercase tracking-wide">Community pulse</p>
              <a
                href={`https://reddit.com/r/${city.subreddit}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-400 hover:text-black transition-colors"
              >
                r/{city.subreddit} →
              </a>
            </div>
            <SubredditWordCloud
              words={subredditWords[city.slug] ?? []}
              subreddit={city.subreddit}
            />
          </div>
        )}

        {/* Sources */}
        <p className="mt-6 text-xs text-neutral-400 leading-relaxed">
          <span className="text-neutral-500 font-medium">Sources: </span>
          Walk Score API · CMHC Rental Market Survey 2024 · StatsCan CSI 35-10-0026-01 &amp; 35-10-0177-01 (by police service) · Environment Canada 1991–2020 Normals · Canadian Income Survey 11-10-0190-01 · 2021 Census Profile (municipal) · Canadian Public Transit Network Database · Labour Force Survey 14-10-0096-01 · NAPS open.canada.ca · Fraser Institute compareschoolrankings.org
        </p>

        <div className="mt-10">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 border border-black/10 text-black hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft size={14} />
            Adjust priorities
          </Link>
        </div>
      </main>
    </div>
  )
}
