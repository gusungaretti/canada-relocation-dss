import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Footprints, DollarSign, Shield, Cloud, MapPin } from "lucide-react"
import { scoreCities } from "@/lib/scoring"
import citiesRaw from "@/data/cities.json"
import type { City } from "@/lib/types"

const EQUAL_WEIGHTS = { walkability: 25, affordability: 25, safety: 25, weather: 25 }

const FACTORS = [
  {
    key: "walkability" as const,
    label: "Walkability",
    icon: Footprints,
    color: "#6366f1",
    unit: "/ 100",
    rawKey: "walkScore" as keyof City,
    rawLabel: "Walk Score",
    source: "Walk Score API",
    description: "Measures pedestrian-friendliness and access to amenities on foot.",
  },
  {
    key: "affordability" as const,
    label: "Affordability",
    icon: DollarSign,
    color: "#22c55e",
    unit: "/ mo",
    rawKey: "avgRent1BR" as keyof City,
    rawLabel: "Avg. 1BR Rent",
    source: "CMHC Rental Market Survey 2024",
    description: "Average monthly rent for a one-bedroom unit based on CMHC survey data.",
    prefix: "$",
  },
  {
    key: "safety" as const,
    label: "Safety",
    icon: Shield,
    color: "#e8673a",
    unit: "",
    rawKey: "crimeIndex" as keyof City,
    rawLabel: "Crime Severity Index",
    source: "Statistics Canada, Table 35-10-0026-01",
    description: "Lower CSI indicates a safer community. National average is 100.",
  },
  {
    key: "weather" as const,
    label: "Weather",
    icon: Cloud,
    color: "#38bdf8",
    unit: "",
    rawKey: "avgTempC" as keyof City,
    rawLabel: "Avg. Annual Temp.",
    source: "Environment Canada Climate Normals 1991–2020",
    description: "Composite of annual average temperature and total precipitation.",
    suffix: "°C",
  },
]

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-sm font-mono font-semibold w-8 text-right"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  )
}

export default async function CityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const allScored = scoreCities(citiesRaw as City[], EQUAL_WEIGHTS)
  const city = allScored.find((c) => c.slug === slug)

  if (!city) notFound()

  const rank = allScored.findIndex((c) => c.slug === slug) + 1

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "#e8673a" }}>
              <MapPin size={12} className="text-white" />
            </div>
            <span className="font-semibold text-sm text-foreground">Maple Moving</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Back to explore
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-10">
        {/* City hero */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground font-mono border border-border rounded px-2 py-0.5">
                #{rank} overall
              </span>
              <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5">
                {city.province}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{city.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Census Metropolitan Area · Statistics Canada CMA {city.id}
            </p>
          </div>
          <div className="text-right">
            <div
              className="text-5xl font-bold font-mono"
              style={{
                color: city.totalScore >= 70 ? "#22c55e" : city.totalScore >= 50 ? "#f59e0b" : "#ef4444",
              }}
            >
              {city.totalScore}
            </div>
            <div className="text-xs text-muted-foreground mt-1">composite score</div>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="grid gap-4">
          {FACTORS.map(({ key, label, icon: Icon, color, rawKey, rawLabel, source, description, prefix, suffix }) => {
            const factorScore = city.factorScores[key]
            const rawValue = city[rawKey]

            return (
              <div
                key={key}
                className="rounded-xl border border-border bg-card p-5"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-lg"
                      style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
                    >
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-lg font-mono font-bold text-foreground">
                      {prefix}{typeof rawValue === "number" ? rawValue.toLocaleString() : rawValue}{suffix}
                    </div>
                    <div className="text-xs text-muted-foreground">{rawLabel}</div>
                  </div>
                </div>

                <ScoreBar score={factorScore} color={color} />

                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                  Source: {source}
                </p>
              </div>
            )
          })}
        </div>

        {/* Climate detail */}
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Climate Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-border p-3">
              <div className="text-2xl font-mono font-bold text-foreground">{city.avgTempC}°C</div>
              <div className="text-xs text-muted-foreground mt-1">Annual average temperature</div>
            </div>
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-border p-3">
              <div className="text-2xl font-mono font-bold text-foreground">{city.annualPrecipMm.toLocaleString()} mm</div>
              <div className="text-xs text-muted-foreground mt-1">Annual precipitation</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Source: Environment Canada Climate Normals 1991–2020
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors text-white"
            style={{ backgroundColor: "#e8673a" }}
          >
            Adjust your priorities
            <ArrowLeft size={14} className="rotate-180" />
          </Link>
        </div>
      </main>
    </div>
  )
}
