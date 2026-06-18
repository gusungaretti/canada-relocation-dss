import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { scoreCities } from "@/lib/scoring"
import citiesRaw from "@/data/cities.json"
import type { City } from "@/lib/types"

const EQUAL_WEIGHTS = { walkability: 25, affordability: 25, safety: 25, weather: 25 }

function scoreColor(score: number) {
  if (score >= 70) return "#16a34a"
  if (score >= 50) return "#d97706"
  return "#dc2626"
}

function ScoreRow({ label, score, color, raw }: { label: string; score: number; color: string; raw: string }) {
  return (
    <div className="grid items-center gap-6 py-4 border-t border-black/[0.06]" style={{ gridTemplateColumns: "130px 1fr 44px 90px" }}>
      <span className="text-sm text-neutral-500">{label}</span>
      <div className="h-0.5 bg-neutral-100 overflow-hidden rounded-full">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-mono font-semibold text-right" style={{ color }}>{score}</span>
      <span className="text-xs font-mono text-right text-neutral-400">{raw}</span>
    </div>
  )
}

export default async function CityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const allScored = scoreCities(citiesRaw as City[], EQUAL_WEIGHTS)
  const city = allScored.find((c) => c.slug === slug)
  if (!city) notFound()

  const rank = allScored.findIndex((c) => c.slug === slug) + 1
  const totalColor = scoreColor(city.totalScore)

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
              <span>#{rank} overall</span>
              <span>·</span>
              <span>{city.province}</span>
              <span>·</span>
              <span>CMA {city.id}</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-black leading-none">{city.name}</h1>
          </div>
          <div className="text-right">
            <div className="text-7xl font-bold font-mono leading-none" style={{ color: totalColor }}>
              {city.totalScore}
            </div>
            <div className="text-xs text-neutral-400 mt-2 font-mono">/ 100</div>
          </div>
        </div>

        {/* Raw stats */}
        <div className="grid grid-cols-4 gap-3 mb-12">
          {[
            { label: "Avg. 1BR rent",    value: `$${city.avgRent1BR.toLocaleString()}`, sub: "per month" },
            { label: "Walk Score",        value: String(city.walkScore),                 sub: "out of 100" },
            { label: "Crime Severity",    value: String(city.crimeIndex),                sub: "national avg 100" },
            { label: "Avg. temperature",  value: `${city.avgTempC}°C`,                  sub: `${city.annualPrecipMm} mm/yr` },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-neutral-50 rounded-xl p-4 border border-black/[0.05]">
              <div className="text-xs text-neutral-400 mb-3">{label}</div>
              <div className="text-xl font-mono font-bold text-black">{value}</div>
              <div className="text-xs text-neutral-400 mt-1">{sub}</div>
            </div>
          ))}
        </div>

        {/* Factor scores */}
        <div className="bg-neutral-50 rounded-2xl border border-black/[0.05] px-6 pb-3">
          <div className="grid items-center gap-6 pt-5 pb-3" style={{ gridTemplateColumns: "130px 1fr 44px 90px" }}>
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">Factor</span>
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">Score</span>
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide text-right">/100</span>
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide text-right">Raw</span>
          </div>
          <ScoreRow label="Walkability"   score={city.factorScores.walkability}   color="#3b82f6" raw={`${city.walkScore} WS`} />
          <ScoreRow label="Affordability" score={city.factorScores.affordability} color="#10b981" raw={`$${city.avgRent1BR.toLocaleString()}`} />
          <ScoreRow label="Safety"        score={city.factorScores.safety}        color="#f97316" raw={`CSI ${city.crimeIndex}`} />
          <ScoreRow label="Weather"       score={city.factorScores.weather}       color="#0ea5e9" raw={`${city.avgTempC}°C`} />
        </div>

        {/* Sources */}
        <p className="mt-6 text-xs text-neutral-400 leading-relaxed">
          <span className="text-neutral-500 font-medium">Sources: </span>
          Walk Score API · CMHC Rental Market Survey 2024 · Statistics Canada Table 35-10-0026-01 · Environment Canada Climate Normals 1991–2020
        </p>

        <div className="mt-10">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border border-black/10 text-black hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft size={14} />
            Adjust priorities
          </Link>
        </div>
      </main>
    </div>
  )
}
