import type { ReactNode } from "react"

interface Props {
  text: string
  children: ReactNode
  className?: string
}

export default function FactorTooltip({ text, children, className }: Props) {
  return (
    <span className={`relative group/tip inline-flex items-center cursor-help ${className ?? ""}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 bottom-full mb-2 w-52 px-3 py-2 bg-black text-white text-[11px] leading-relaxed text-left opacity-0 scale-95 origin-bottom-left group-hover/tip:opacity-100 group-hover/tip:scale-100 transition-all duration-100 z-50"
      >
        {text}
        <span className="absolute top-full left-3 border-4 border-transparent border-t-black" />
      </span>
    </span>
  )
}
