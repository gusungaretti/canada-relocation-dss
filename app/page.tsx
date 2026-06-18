import Link from "next/link"
import { ArrowRight } from "lucide-react"
import ParallaxHero from "@/components/ParallaxHero"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav — floats over hero, sticky after scroll */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <span className="text-sm font-semibold text-white drop-shadow-sm">Maple Moving</span>
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-colors"
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
              { v: "4",    l: "Data dimensions" },
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: "Walkability",   source: "Walk Score",                     color: "#3b82f6" },
              { label: "Affordability", source: "CMHC Rental Market Survey",      color: "#10b981" },
              { label: "Safety",        source: "StatsCan Crime Severity Index",  color: "#f97316" },
              { label: "Weather",       source: "Environment Canada 1991–2020",   color: "#0ea5e9" },
            ].map(({ label, source, color }) => (
              <div key={label}>
                <div className="w-2 h-2 rounded-full mb-5" style={{ backgroundColor: color }} />
                <div className="text-base font-semibold text-black mb-1">{label}</div>
                <div className="text-sm text-neutral-400 leading-relaxed">{source}</div>
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
                { n: "01", title: "Set your weights",   body: "Drag sliders to allocate 100 points across walkability, affordability, safety, and weather." },
                { n: "02", title: "See instant rankings", body: "The scoring engine normalizes each metric and ranks all 30 CMAs in real time as you adjust." },
                { n: "03", title: "Explore your top picks", body: "Click any city on the map or ranking list for a full factor breakdown with raw data and source citations." },
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
            className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full bg-black text-white hover:bg-neutral-800 transition-colors"
          >
            Start exploring <ArrowRight size={14} />
          </Link>
        </section>
      </main>

      <footer className="border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <span className="text-sm font-semibold text-black">Maple Moving</span>
          <span className="text-xs text-neutral-400">
            StatsCan · CMHC · Walk Score · Environment Canada
          </span>
        </div>
      </footer>
    </div>
  )
}
