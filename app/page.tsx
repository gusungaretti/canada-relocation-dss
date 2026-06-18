import Link from "next/link"
import { MapPin, Footprints, DollarSign, Shield, Cloud, ArrowRight, BarChart3 } from "lucide-react"

const FEATURES = [
  {
    icon: Footprints,
    color: "#6366f1",
    label: "Walkability",
    description: "Walk Score ratings for pedestrian access and transit across Canada's major CMAs.",
  },
  {
    icon: DollarSign,
    color: "#22c55e",
    label: "Affordability",
    description: "Average 1-bedroom rents from CMHC's Rental Market Survey, updated annually.",
  },
  {
    icon: Shield,
    color: "#e8673a",
    label: "Safety",
    description: "Statistics Canada's Crime Severity Index — a weighted measure of community safety.",
  },
  {
    icon: Cloud,
    color: "#38bdf8",
    label: "Weather",
    description: "Temperature and precipitation normals from Environment Canada (1991–2020).",
  },
]

const STATS = [
  { value: "30", label: "Census Metro Areas" },
  { value: "4", label: "Data Dimensions" },
  { value: "100%", label: "Personalized to You" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#e8673a" }}
            >
              <MapPin size={14} className="text-white" />
            </div>
            <span className="font-semibold text-foreground">Maple Moving</span>
          </div>
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors text-white"
            style={{ backgroundColor: "#e8673a" }}
          >
            Start exploring
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-5 py-24 relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(232,103,58,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-[rgba(232,103,58,0.3)] text-[#e8673a] bg-[rgba(232,103,58,0.06)] mb-6">
            <BarChart3 size={11} />
            Canada Relocation Decision Support System
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground leading-tight mb-5">
            Find where you{" "}
            <span style={{ color: "#e8673a" }}>belong</span>
            <br />
            in Canada
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Stop piecing together data from a dozen websites. Set your priorities
            once and get an instant, personalized ranking of Canadian cities based
            on what matters to you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl transition-all text-white shadow-lg"
              style={{
                backgroundColor: "#e8673a",
                boxShadow: "0 0 30px rgba(232,103,58,0.25)",
              }}
            >
              Explore cities
              <ArrowRight size={15} />
            </Link>
            <a
              href="https://github.com/gusungaretti/canada-relocation-dss"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-[rgba(255,255,255,0.15)] transition-all"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card">
        <div className="max-w-6xl mx-auto px-5 py-8">
          <div className="grid grid-cols-3 gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold font-mono text-foreground">{value}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 py-20 w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Four dimensions. One score.
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            Every metric comes from authoritative public Canadian datasets — no
            guesswork, no scraped opinions. You control how much each factor matters.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, color, label, description }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-5 hover:border-[rgba(255,255,255,0.12)] transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-3">How it works</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                step: "01",
                title: "Set your weights",
                description: "Allocate 100 points across walkability, affordability, safety, and weather.",
              },
              {
                step: "02",
                title: "See instant rankings",
                description: "The scoring engine normalizes each metric and computes your personalized city scores in real time.",
              },
              {
                step: "03",
                title: "Explore your top picks",
                description: "Drill into any city for a full factor breakdown with raw data and data sources.",
              },
            ].map(({ step, title, description }) => (
              <div key={step} className="text-center">
                <div className="text-xs font-mono text-[#e8673a] mb-2 font-semibold">{step}</div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 py-20 w-full text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Ready to find your city?</h2>
        <p className="text-muted-foreground mb-8 text-sm">No sign-up required. Your preferences stay local.</p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-xl text-white transition-all"
          style={{
            backgroundColor: "#e8673a",
            boxShadow: "0 0 30px rgba(232,103,58,0.2)",
          }}
        >
          Start exploring →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ backgroundColor: "#e8673a" }}
            >
              <MapPin size={10} className="text-white" />
            </div>
            Maple Moving · MSE 401 Capstone Group 5
          </div>
          <p className="text-xs text-muted-foreground">
            Data: StatsCan · CMHC · Walk Score · Environment Canada
          </p>
        </div>
      </footer>
    </div>
  )
}
