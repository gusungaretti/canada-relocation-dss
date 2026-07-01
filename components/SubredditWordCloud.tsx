import type { SubredditWord } from "@/lib/types"

interface Props {
  words: SubredditWord[]
  subreddit: string
}

const PALETTE = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#0ea5e9", "#f59e0b", "#64748b"]

export default function SubredditWordCloud({ words, subreddit }: Props) {
  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 border border-black/[0.05] bg-neutral-50">
        <span className="text-sm text-neutral-400">No community data available yet</span>
      </div>
    )
  }

  const maxCount = Math.max(...words.map((w) => w.count))
  const minCount = Math.min(...words.map((w) => w.count))
  const range = Math.max(maxCount - minCount, 1)

  function fontSize(count: number) {
    const t = (count - minCount) / range
    return 13 + t * 22 // 13px – 35px
  }

  function opacity(count: number) {
    const t = (count - minCount) / range
    return 0.55 + t * 0.45
  }

  return (
    <div className="border border-black/[0.05] bg-neutral-50 p-8">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 leading-none">
        {words.map((w, i) => (
          <span
            key={w.word}
            style={{
              fontSize: `${fontSize(w.count)}px`,
              color: PALETTE[i % PALETTE.length],
              opacity: opacity(w.count),
              fontWeight: w.count >= maxCount * 0.6 ? 700 : 500,
            }}
            title={`mentioned ${w.count}×`}
          >
            {w.word}
          </span>
        ))}
      </div>
      <p className="text-center text-xs text-neutral-400 mt-6 font-mono">
        Most-mentioned words from r/{subreddit} — sized by frequency
      </p>
    </div>
  )
}
