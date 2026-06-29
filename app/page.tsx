import Link from "next/link"
import { ArrowRight } from "lucide-react"
import ParallaxHero from "@/components/ParallaxHero"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav — floats over hero */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <span className="text-sm font-semibold text-white drop-shadow-sm">Maple Moving</span>
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-colors"
          >
            Explore cities
            <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* Parallax hero */}
      <ParallaxHero />

      {/* White content below */}
      <main className="bg-white flex-1">
        {/* Stats band */}
        <section className="border-b border-black/[0.06]">
          <div className="max-w-6xl mx-auto px-8 py-14 grid grid-cols-3 divide-x divide-black/[0.06]">
            {[
              { v: "38",   l: "Census Metro Areas" },
              { v: "9",    l: "Data dimensions" },
              { v: "100%", l: "Personalized to you" },
            ].map(({ v, l }) => (
              <div key={l} className="px-12 first:pl-0 last:pr-0">
                <div className="text-5xl font-bold font-mono tracking-tight text-black mb-1">{v}</div>
                <div className="text-sm text-neutral-500">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* What we measure */}
        <section className="max-w-6xl mx-auto px-8 py-24">
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-[0.2em] mb-16">
            What we measure
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-14">
            {[
              { label: "Walkability",   source: "Walk Score API",                          color: "#3b82f6", detail: "Pedestrian friendliness of each metro area" },
              { label: "Affordability", source: "CMHC Rental Market Survey",               color: "#10b981", detail: "Average rent by unit size vs. your monthly budget" },
              { label: "Safety",        source: "StatsCan Crime Severity Index",           color: "#f97316", detail: "Weighted crime rate relative to the national average" },
              { label: "Weather",       source: "Environment Canada 1991–2020",            color: "#0ea5e9", detail: "Annual temperature and precipitation matched to your climate preference" },
              { label: "Socioeconomic", source: "Canadian Income Survey",                  color: "#8b5cf6", detail: "Median after-tax household income by CMA" },
              { label: "Transit",       source: "Canadian Public Transit Network DB",      color: "#06b6d4", detail: "Public transit coverage and route density" },
              { label: "Employment",    source: "Labour Force Survey by CMA",              color: "#84cc16", detail: "Annual unemployment rate across major Canadian cities" },
              { label: "Air Quality",   source: "National Air Pollution Surveillance",     color: "#64748b", detail: "Annual average PM2.5 concentration (lower is cleaner)" },
              { label: "Education",     source: "Fraser Institute School Rankings",        color: "#f59e0b", detail: "Composite elementary and secondary school performance score" },
            ].map(({ label, source, color, detail }) => (
              <div key={label}>
                <div className="w-2 h-2 mb-5" style={{ backgroundColor: color }} />
                <div className="text-base font-semibold text-black mb-1">{label}</div>
                <div className="text-sm text-neutral-500 leading-relaxed mb-1">{detail}</div>
                <div className="text-xs text-neutral-400 font-mono">{source}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-black/[0.06] bg-neutral-50">
          <div className="max-w-6xl mx-auto px-8 py-24">
            <p className="text-xs font-mono text-neutral-400 uppercase tracking-[0.2em] mb-16">
              How it works
            </p>
            <div className="grid grid-cols-3 gap-16">
              {[
                {
                  n: "01",
                  title: "Set your priorities",
                  body: "Drag each of 9 factors into one of three tiers — Must Have, Nice to Have, or Bonus. The system automatically allocates weights (60 / 30 / 10%) across your tiers.",
                },
                {
                  n: "02",
                  title: "See instant rankings",
                  body: "The scoring engine normalizes every metric across all 38 CMAs and reranks them in real time as you adjust tiers, budget, unit type, or climate preference.",
                },
                {
                  n: "03",
                  title: "Explore your top picks",
                  body: "Click any city on the map or ranking list for a full breakdown — factor scores, raw data values, and source citations for all 9 dimensions.",
                },
              ].map(({ n, title, body }) => (
                <div key={n}>
                  <div className="text-xs font-mono text-neutral-300 mb-4">{n}</div>
                  <div className="text-base font-semibold text-black mb-3">{title}</div>
                  <div className="text-sm text-neutral-500 leading-relaxed">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-8 py-24 flex items-center justify-between">
          <h2 className="text-4xl font-bold tracking-tight text-black">Ready to find your city?</h2>
          <Link
            href="/explore"
            className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold px-7 py-3.5 bg-black text-white hover:bg-neutral-800 transition-colors"
          >
            Start exploring <ArrowRight size={14} />
          </Link>
        </section>
      </main>

      <footer className="border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <span className="text-sm font-semibold text-black">Maple Moving</span>
          <span className="text-xs text-neutral-400">
            StatsCan · CMHC · Walk Score · Environment Canada · Fraser Institute · NAPS
          </span>
        </div>
      </footer>
    </div>
  )
}
