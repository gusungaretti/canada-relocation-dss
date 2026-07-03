import Link from "next/link"
import { ArrowLeft } from "lucide-react"

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-neutral-50 border border-black/[0.06] px-5 py-4 font-mono text-sm text-black overflow-x-auto">
      {children}
    </div>
  )
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "48px 1fr" }}>
      <div className="text-xs font-mono text-neutral-300 pt-1">{n}</div>
      <div>
        <h3 className="text-lg font-semibold text-black mb-3">{title}</h3>
        <div className="text-sm text-neutral-600 leading-relaxed space-y-4">{children}</div>
      </div>
    </div>
  )
}

export default function MethodologyPage() {
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
        <p className="text-xs font-mono text-neutral-400 uppercase tracking-[0.2em] mb-4">Methodology</p>
        <h1 className="text-4xl font-bold tracking-tight text-black mb-4">How scoring &amp; ranking work</h1>
        <p className="text-base text-neutral-500 leading-relaxed mb-16 max-w-xl">
          Every city gets a score from 0–100 that reflects how well it matches your stated priorities.
          The engine runs entirely in your browser and recomputes instantly as you adjust anything. Here&apos;s
          exactly how a raw data point becomes your final ranking.
        </p>

        <div className="space-y-16">
          <Step n="01" title="Raw data → factor score (0–100)">
            <p>
              Each of the 9 factors starts as a raw metric (e.g. Walk Score = 72, unemployment = 5.4%,
              PM2.5 = 6.8 μg/m³). We convert every metric to a comparable 0–100 scale using one of four
              normalization methods, depending on what the metric means:
            </p>
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-black">Higher is better</span> — Walkability, Transit,
                Socioeconomic (income), Education. Min–max normalized: the lowest city across all 38 CMAs
                scores 0, the highest scores 100, everyone else scales linearly in between.
                <Formula>score = ((value − min) / (max − min)) × 100</Formula>
              </div>
              <div>
                <span className="font-semibold text-black">Lower is better</span> — Safety (crime severity),
                Employment (unemployment rate), Air Quality (PM2.5). Same min–max logic, inverted so the
                lowest raw value scores 100.
                <Formula>score = 100 − ((value − min) / (max − min)) × 100</Formula>
              </div>
              <div>
                <span className="font-semibold text-black">Budget-relative</span> — Affordability. Rent
                is compared directly to your stated monthly budget rather than to other cities, so it
                stays personal to you.
                <Formula>score = clamp(round((budget ÷ rent) × 80), 0, 100)</Formula>
                <p className="mt-2 text-xs text-neutral-400">
                  A city at exactly your budget scores 80. Cheaper cities score higher; pricier ones score lower.
                </p>
              </div>
              <div>
                <span className="font-semibold text-black">Climate-matched</span> — Weather. Scored with a
                bell curve centered on your selected climate preference (Warm, Mild, Four Seasons, or Dry),
                blended with a dryness score derived from annual precipitation.
              </div>
            </div>
            <p className="text-xs text-neutral-400 pt-1">
              Because normalization is min–max across the 38 CMAs, every score is relative to the other
              cities in the dataset — not an absolute external benchmark (except Crime Severity, where 100
              is StatsCan&apos;s own national average).
            </p>
          </Step>

          <Step n="02" title="Tiers → weights">
            <p>
              You assign each factor to one of three tiers by dragging it — or leave it unranked, in which
              case it contributes nothing to the score. Each tier carries a fixed per-factor multiplier:
            </p>
            <Formula>
              Must Have = 3× &nbsp;&nbsp;·&nbsp;&nbsp; Nice to Have = 2× &nbsp;&nbsp;·&nbsp;&nbsp; Bonus = 1×
            </Formula>
            <p>
              This is a <span className="font-semibold text-black">ratio system, not a fixed split</span>.
              A single Must Have factor always outweighs a single Nice to Have factor, and a single Nice to
              Have always outweighs a single Bonus — regardless of how many other factors share that tier.
              Weight is computed as:
            </p>
            <Formula>
              weight(factor) = (multiplier(tier) ÷ Σ [count(t) × multiplier(t)]) × 100
            </Formula>
            <p>
              Example: 2 factors in Must Have, 1 in Nice to Have, Bonus empty.
              Divisor = (2×3) + (1×2) = 8. Each Must Have factor gets (3÷8)×100 ≈ 37.5%,
              rounded and reconciled to sum to exactly 100%. The Nice to Have factor gets (2÷8)×100 = 25%.
            </p>
            <p>
              Adding more factors to a tier <span className="font-semibold text-black">dilutes</span> that
              tier&apos;s per-factor share — 6 factors in Must Have split 3× six ways, each getting less than
              a single Nice to Have factor&apos;s 2×. This is intentional: it rewards being selective about
              what actually matters to you.
            </p>
          </Step>

          <Step n="03" title="Final score">
            <p>The total score is the weighted sum of all 9 factor scores:</p>
            <Formula>Total Score = Σ (factor score × factor weight)</Formula>
            <p>
              Rounded to the nearest integer, and cities are sorted descending. If no factors are assigned
              to any tier, the ranking list stays empty rather than showing a meaningless default order.
            </p>
          </Step>
        </div>

        <div className="mt-16 pt-10 border-t border-black/[0.06]">
          <h2 className="text-sm font-semibold text-black mb-3">Design principles</h2>
          <ul className="text-sm text-neutral-500 leading-relaxed space-y-2 list-disc pl-5">
            <li>All computation is client-side and real-time — no server round-trip after initial page load.</li>
            <li>Unselected factors contribute exactly zero weight; they don&apos;t get a hidden default.</li>
            <li>Weights always sum to 100%, no matter how factors are distributed across tiers.</li>
            <li>Scores are deterministic — the same inputs always produce the same ranking.</li>
          </ul>
        </div>

        <div className="mt-10">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 border border-black/10 text-black hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to explore
          </Link>
        </div>
      </main>
    </div>
  )
}
