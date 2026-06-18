"use client"

import { useState, useCallback } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps"
import { useRouter } from "next/navigation"
import { Plus, Minus, RotateCcw } from "lucide-react"
import type { ScoredCity } from "@/lib/types"

const CANADA_GEO_URL = "/canada-provinces.geojson"
const MIN_ZOOM = 1
const MAX_ZOOM = 12

function scoreToColor(score: number): string {
  if (score >= 70) return "#22c55e"
  if (score >= 55) return "#84cc16"
  if (score >= 40) return "#f59e0b"
  return "#ef4444"
}

interface Props {
  cities: ScoredCity[]
  selectedSlug?: string
  onCityClick?: (slug: string) => void
}

export default function CanadaMap({ cities, selectedSlug, onCityClick }: Props) {
  const router = useRouter()
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([0, 0])
  const [tooltip, setTooltip] = useState<{
    name: string
    score: number
    x: number
    y: number
  } | null>(null)

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.6, MAX_ZOOM))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.6, MIN_ZOOM))
  }, [])

  const handleReset = useCallback(() => {
    setZoom(1)
    setCenter([0, 0])
  }, [])

  function handleCityClick(slug: string) {
    if (onCityClick) onCityClick(slug)
    router.push(`/city/${slug}`)
  }

  // Dots and labels scale inversely with zoom so they stay readable
  const dotScale = 1 / Math.sqrt(zoom)

  return (
    <div className="relative w-full h-full select-none">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg border border-border bg-card/90 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          title="Zoom in"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg border border-border bg-card/90 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          title="Zoom out"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleReset}
          className="w-8 h-8 rounded-lg border border-border bg-card/90 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          title="Reset view"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Zoom level hint */}
      {zoom > 1 && (
        <div className="absolute bottom-3 right-3 z-10 text-xs text-muted-foreground font-mono bg-card/80 backdrop-blur border border-border rounded px-2 py-1">
          {Math.round(zoom * 100)}% · scroll or pinch to zoom · drag to pan
        </div>
      )}
      {zoom === 1 && (
        <div className="absolute bottom-3 right-3 z-10 text-xs text-muted-foreground">
          Scroll to zoom · drag to pan
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none px-3 py-2 rounded-lg text-sm font-medium shadow-xl border border-border"
          style={{
            left: tooltip.x,
            top: tooltip.y - 48,
            backgroundColor: "#0f0f1a",
            transform: "translateX(-50%)",
          }}
        >
          <div className="text-foreground text-sm">{tooltip.name}</div>
          <div
            className="text-xs font-mono font-semibold mt-0.5"
            style={{ color: scoreToColor(tooltip.score) }}
          >
            Score: {tooltip.score}
          </div>
        </div>
      )}

      <ComposableMap
        projection="geoAzimuthalEqualArea"
        projectionConfig={{ rotate: [96, -62, 0], scale: 780 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          center={center}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onMoveEnd={({ zoom: z, coordinates }) => {
            setZoom(z)
            setCenter(coordinates as [number, number])
          }}
        >
          <Geographies geography={CANADA_GEO_URL}>
            {({ geographies }: { geographies: unknown[] }) =>
              (geographies as { rsmKey: string }[]).map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: "#1a1a2e",
                      stroke: "rgba(255,255,255,0.08)",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                    hover: {
                      fill: "#1e1e38",
                      stroke: "rgba(255,255,255,0.12)",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {cities.map((city) => {
            const isSelected = city.slug === selectedSlug
            const color = scoreToColor(city.totalScore)
            const r = (isSelected ? 7 : 5) * dotScale
            const glowR = (isSelected ? 12 : 9) * dotScale
            const fontSize = 4.5 * dotScale

            return (
              <Marker
                key={city.slug}
                coordinates={[city.lng, city.lat]}
                onClick={() => handleCityClick(city.slug)}
                onMouseEnter={(e: React.MouseEvent) => {
                  const rect = (e.target as SVGElement)
                    .closest("svg")
                    ?.getBoundingClientRect()
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
                  <circle r={glowR + 4 * dotScale} fill="none" stroke={color} strokeWidth={1 * dotScale} opacity={0.4} />
                )}
                <circle r={glowR} fill={color} opacity={0.12} />
                <circle
                  r={r}
                  fill={color}
                  stroke={isSelected ? "#fff" : "rgba(255,255,255,0.25)"}
                  strokeWidth={isSelected ? 1.2 * dotScale : 0.8 * dotScale}
                />
                <text
                  textAnchor="middle"
                  y={-(r + 3 * dotScale)}
                  style={{
                    fontSize: `${fontSize}px`,
                    fill: zoom >= 2 ? "rgba(255,255,255,0.85)" : city.totalScore >= 60 ? "rgba(255,255,255,0.65)" : "none",
                    fontFamily: "var(--font-sans)",
                    pointerEvents: "none",
                    display: zoom < 1.5 && city.totalScore < 60 ? "none" : "block",
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
