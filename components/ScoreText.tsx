"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "mm_hasActiveFactors"

export function useHasActiveFactors(): boolean | null {
  const [has, setHas] = useState<boolean | null>(null)
  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY)
    setHas(v === null ? true : v === "1")
  }, [])
  return has
}

export function setHasActiveFactors(value: boolean) {
  localStorage.setItem(STORAGE_KEY, value ? "1" : "0")
}

interface Props {
  score: number
  className?: string
  style?: React.CSSProperties
  blankColor?: string
}

export default function ScoreText({ score, className, style, blankColor = "#d1d5db" }: Props) {
  const has = useHasActiveFactors()
  if (has === null) return <span className={className} style={style}>{score}</span>
  return (
    <span className={className} style={has ? style : { ...style, color: blankColor }}>
      {has ? score : "—"}
    </span>
  )
}
