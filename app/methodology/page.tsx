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

          <Step n="02" title="Tiers → weights (or priorities)">
            <p>
              You assign each factor to one of three tiers by dragging it — or leave it unranked, in which
              case it contributes nothing to the score. The tiers do double duty: they become factor
              <span className="font-semibold text-black"> weights</span> in the weighted &amp; Archimedean
              models, and strict <span className="font-semibold text-black">priority levels</span> in the
              preemptive model (step 03). Each tier carries a fixed per-factor multiplier:
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

          <Step n="03" title="Final score — pick a method">
            <p>
              The 0–100 factor scores and tiers feed into one of three interchangeable scoring methods,
              selectable in the sidebar. All three share steps 01–02; they differ only in how they turn
              factor scores into a ranking.
            </p>

            <div>
              <span className="font-semibold text-black">A. Weighted score</span> — the classic compensatory
              baseline. Total score is the weighted sum of all 9 factor scores:
              <Formula>Total Score = Σ (factor score × factor weight)</Formula>
              <p className="mt-2">
                A great score on one factor can fully compensate for a poor score on another. Higher is better;
                cities are sorted descending.
              </p>
            </div>

            <div>
              <span className="font-semibold text-black">B. Goal programming (weighted)</span> — instead of
              maximizing a blend, you set a <em>target</em> for each ranked factor in its own real-world units —
              e.g. &ldquo;rent ≤ $2,000/mo&rdquo;, &ldquo;Walker&apos;s paradise&rdquo;, &ldquo;unemployment ≤ 5%&rdquo;,
              &ldquo;PM2.5 ≤ 8 μg/m³&rdquo;. Each raw target is mapped onto the same 0–100 scale as the factor
              scores (step 01), so a city sitting exactly on your target lands on its <em>target score</em>. The
              engine then minimizes how far each city falls <em>short</em> of that target:
              <Formula>deviation(factor) = max(0, target score − factor score)</Formula>
              <Formula>penalty = Σ (weight × deviation) &nbsp;·&nbsp; Goal Attainment = 100 − penalty</Formula>
              <p className="mt-2">
                This is <span className="font-semibold text-black">Archimedean</span> goal programming — tier
                weights become penalties on missed goals. A city that meets every target scores 100. Setting goals
                in real units (not an abstract 0–100) is what keeps the targets meaningful.
              </p>
            </div>

            <div>
              <span className="font-semibold text-black">C. Goal programming (preemptive)</span> — the same
              targets and deviations, but tiers act as strict <span className="font-semibold text-black">priority
              levels</span> instead of weights. Cities are compared by total Must&nbsp;Have deviation first;
              only ties are broken by Nice&nbsp;to&nbsp;Have, then by Bonus:
              <Formula>
                minimize (Σ Must-Have dev) ≫ then (Σ Nice-to-Have dev) ≫ then (Σ Bonus dev)
              </Formula>
              <p className="mt-2">
                This is <span className="font-semibold text-black">lexicographic</span> goal programming: a city
                that misses a Must&nbsp;Have goal can never be rescued by excelling at a Bonus factor. It formalizes
                the intent behind the three tiers — satisfy what matters most, first.
              </p>
            </div>

            <p className="text-xs text-neutral-400 pt-1">
              In all three methods, cities are sorted best-first and the displayed 0–100 number is the goal-attainment
              (or weighted) score. If no factors are assigned to any tier, the ranking list stays empty rather than
              showing a meaningless default order.
            </p>
          </Step>

          <Step n="04" title="Shortlist — pick the best set of cities">
            <p>
              The first three methods rank cities <em>independently</em>: each city is scored on its own.
              But relocation often isn&apos;t about one perfect city — you might be happy to visit or split time
              across a small set, as long as that set <span className="font-semibold text-black">together</span>
              covers everything you care about. The <span className="font-semibold text-black">Shortlist</span> method
              solves exactly that: it selects the best set of <span className="font-semibold text-black">k</span> cities
              (you choose k, up to 5).
            </p>
            <p>
              The key idea is <span className="font-semibold text-black">best-in-set achievement</span>. For each
              factor, a set is credited with the <em>best</em> score any city in it achieves — if one city in your
              shortlist is a walker&apos;s paradise, the whole set clears the walkability goal. The set&apos;s shortfall
              on factor i is therefore:
            </p>
            <Formula>eᵢ(S) = max(0, targetᵢ − max&nbsp;over&nbsp;c∈S&nbsp;of&nbsp;scoreᵢ(c))</Formula>
            <p>
              This is a <span className="font-semibold text-black">binary (0/1) goal program</span>. A decision
              variable x꜀ ∈ {"{0,1}"} marks whether city c is in the shortlist, and set-level deviation variables
              dᵢ⁻, dᵢ⁺ ≥ 0 measure how far the set falls short of / overshoots each target:
            </p>
            <Formula>
              minimize (lexicographically)&nbsp; D₁ = Σ dᵢ⁻ over Must-Have&nbsp; ≫&nbsp; D₂ = Σ dᵢ⁻ over Nice-to-Have&nbsp; ≫&nbsp; D₃ = Σ dᵢ⁻ over Bonus
              <br />
              s.t.&nbsp; Sᵢ = max over chosen cities of scoreᵢ&nbsp;·&nbsp; Sᵢ + dᵢ⁻ − dᵢ⁺ = targetᵢ
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp; Σ x꜀ = k&nbsp;·&nbsp; (optional) Σ x꜀ ≤ 1 per province&nbsp;·&nbsp; x꜀ ∈ {"{0,1}"}, dᵢ⁻, dᵢ⁺ ≥ 0
            </Formula>
            <p>
              The objective is <span className="font-semibold text-black">preemptive by tier</span>, exactly like the
              preemptive single-city model: minimize total Must-Have shortfall first, then Nice-to-Have, then Bonus.
              Ties are broken by a weighted overall attainment, then deterministically by the cities&apos; names so the
              output is stable. An optional <span className="font-semibold text-black">one city per province</span>
              constraint keeps the shortlist geographically diverse.
            </p>
            <p>
              Choosing the best subset of cities is a <span className="font-semibold text-black">covering-type,
              NP-hard</span> problem — the number of candidate sets grows combinatorially. With k capped at 5 and 38
              CMAs the space is small (well under a million combinations), so the app solves it
              <span className="font-semibold text-black"> exactly by enumerating every feasible set</span>. A
              <span className="font-semibold text-black"> greedy</span> heuristic (repeatedly add the city that most
              improves the objective) is kept as a fallback for larger instances.
            </p>
            <p className="text-xs text-neutral-400 pt-1">
              In the rankings, the k chosen cities are grouped under &ldquo;Your shortlist&rdquo; and highlighted;
              every other city is listed below by its individual goal attainment.
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
