import type { Weights } from "./types"

export const FACTOR_DEFINITIONS: Record<keyof Weights, string> = {
  walkability:   "Pedestrian friendliness of each metro area, based on proximity to amenities.",
  affordability: "Average rent by unit size, scored relative to your monthly budget.",
  safety:        "Weighted crime rate relative to the national average — lower is safer.",
  weather:       "Annual temperature and precipitation, matched to your climate preference.",
  income:        "Median after-tax household income by census metro area.",
  transit:       "Public transit coverage and route density across the metro area.",
  employment:    "Annual unemployment rate — lower unemployment scores higher.",
  airQuality:    "Annual average PM2.5 concentration — lower is cleaner air.",
  education:     "Composite elementary and secondary school performance score.",
}
