"use client"

import { useState, useEffect, useCallback } from "react"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps"
import { useRouter } from "next/navigation"
import { Plus, Minus, RotateCcw } from "lucide-react"
import type { ScoredCity } from "@/lib/types"

const MIN_ZOOM = 1
const MAX_ZOOM = 12

// Geographic center of Canada — matches the projection's rotate: [96, -62, 0]
// so projection([-96, 62]) lands at SVG center, keeping Canada visible on zoom.
// Using [0, 0] (null island) caused the map to vanish when zoom > 1.
const CANADA_CENTER: [number, number] = [-96, 62]

type Position = { coordinates: [number, number]; zoom: number }
const DEFAULT_POSITION: Position = { coordinates: CANADA_CENTER, zoom: 1 }

function scoreToColor(score: number): string {
  if (score >= 70) return "#16a34a"
  if (score >= 55) return "#ca8a04"
  if (score >= 40) return "#d97706"
  return "#dc2626"
}

interface Props {
  cities: ScoredCity[]
  selectedSlug?: string
  onCityClick?: (slug: string) => void
}

export default function CanadaMap({ cities, selectedSlug, onCityClick }: Props) {
  const router = useRouter()

  // GeoJSON loaded once — never re-fetched on re-render
  const [geoData, setGeoData] = useState<unknown>(null)
  useEffect(() => {
    fetch("/canada-provinces.geojson").then((r) => r.json()).then(setGeoData)
  }, [])

  const [position, setPosition] = useState<Position>(DEFAULT_POSITION)
  // Key bump forces ComposableMap remount on reset, clearing d3-zoom state
  const [resetKey, setResetKey] = useState(0)

  const [tooltip, setTooltip] = useState<{
    name: string; score: number; x: number; y: number
  } | null>(null)

  const handleZoomIn  = useCallback(() => setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.6, MAX_ZOOM) })), [])
  const handleZoomOut = useCallback(() => setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.6, MIN_ZOOM) })), [])
  const handleReset   = useCallback(() => { setPosition(DEFAULT_POSITION); setResetKey((k) => k + 1) }, [])

  function handleCityClick(slug: string) {
    if (onCityClick) onCityClick(slug)
    router.push(`/city/${slug}`)
  }

  const dotScale = 1 / Math.sqrt(position.zoom)

  if (!geoData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-50">
        <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full select-none">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
        {[
          { icon: Plus,      onClick: handleZoomIn,  title: "Zoom in",    size: 13 },
          { icon: Minus,     onClick: handleZoomOut, title: "Zoom out",   size: 13 },
          { icon: RotateCcw, onClick: handleReset,   title: "Reset view", size: 11 },
        ].map(({ icon: Icon, onClick, title, size }) => (
          <button
            key={title}
            onClick={onClick}
            title={title}
            className="w-8 h-8 border border-black/[0.08] bg-white shadow-sm flex items-center justify-center text-neutral-500 hover:text-black hover:border-black/20 transition-colors"
          >
            <Icon size={size} />
          </button>
        ))}
      </div>

      {/* Zoom hint */}
      <div className="absolute bottom-4 right-4 z-10 text-xs text-neutral-400">
        {position.zoom > 1
          ? `${Math.round(position.zoom * 100)}% · scroll to zoom · drag to pan`
          : "Scroll to zoom · drag to pan"}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none px-3 py-2 text-sm shadow-lg border border-black/[0.07] bg-white"
          style={{ left: tooltip.x, top: tooltip.y - 52, transform: "translateX(-50%)" }}
        >
          <div className="text-xs font-medium text-black">{tooltip.name}</div>
          <div className="text-xs font-mono font-semibold mt-0.5" style={{ color: scoreToColor(tooltip.score) }}>
            {tooltip.score}
          </div>
        </div>
      )}

      <ComposableMap
        key={resetKey}
        projection="geoAzimuthalEqualArea"
        projectionConfig={{ rotate: [96, -62, 0], scale: 780 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onMoveEnd={setPosition}
        >
          <Geographies geography={geoData}>
            {({ geographies }: { geographies: unknown[] }) =>
              (geographies as { rsmKey: string }[]).map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: "#e8e8f0", stroke: "rgba(0,0,0,0.08)", strokeWidth: 0.5, outline: "none" },
                    hover:   { fill: "#dedee8", stroke: "rgba(0,0,0,0.12)", strokeWidth: 0.5, outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {cities.map((city) => {
            const isSelected = city.slug === selectedSlug
            const color    = scoreToColor(city.totalScore)
            const r        = (isSelected ? 7 : 5) * dotScale
            const glowR    = (isSelected ? 11 : 8) * dotScale
            const fontSize = 4.5 * dotScale

            return (
              <Marker
                key={city.slug}
                coordinates={[city.lng, city.lat]}
                onClick={() => handleCityClick(city.slug)}
                onMouseEnter={(e: React.MouseEvent) => {
                  const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect()
                  setTooltip({
                    name: city.name,
                    score: city.totalScore,
                    x: e.clientX - (rect?.left ?? 0),
                    y: e.clientY - (rect?.top ?? 0),
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: "pointer" }}
              >
                {isSelected && (
                  <circle r={glowR + 4 * dotScale} fill="none" stroke={color} strokeWidth={1 * dotScale} opacity={0.35} />
                )}
                <circle r={glowR} fill={color} opacity={0.1} />
                <circle
                  r={r}
                  fill={color}
                  stroke={isSelected ? "#fff" : "rgba(255,255,255,0.7)"}
                  strokeWidth={isSelected ? 1.5 * dotScale : 1 * dotScale}
                />
                <text
                  textAnchor="middle"
                  y={-(r + 3 * dotScale)}
                  style={{
                    fontSize: `${fontSize}px`,
                    fill: position.zoom >= 2 ? "rgba(0,0,0,0.7)" : city.totalScore >= 60 ? "rgba(0,0,0,0.55)" : "none",
                    fontFamily: "var(--font-sans)",
                    pointerEvents: "none",
                    fontWeight: "500",
                  }}
                >
                  {city.name.split("–")[0].trim()}
                </text>
              </Marker>
            )
          })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}
