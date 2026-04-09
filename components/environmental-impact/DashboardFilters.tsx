"use client"

import type { TimeRange } from "@/types/environmental"

const TIME_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "Day",   value: "day"   },
  { label: "Week",  value: "week"  },
  { label: "Month", value: "month" },
]

const ALL_POLLUTANTS = [
  "CO2", "dioxin", "microplastic", "toxic_chemicals", "non_biodegradable",
  "NOx", "SO2", "CH4", "PM2.5", "Pb", "Hg", "Cd",
  "nitrate", "chemical_residue", "styrene",
]

const POLLUTANT_LABELS: Record<string, string> = {
  CO2:               "CO₂",
  dioxin:            "Dioxin",
  microplastic:      "Microplastic",
  toxic_chemicals:   "Toxic Chem.",
  non_biodegradable: "Non-Biodeg.",
  NOx:               "NOₓ",
  SO2:               "SO₂",
  CH4:               "CH₄",
  "PM2.5":           "PM2.5",
  Pb:                "Pb",
  Hg:                "Hg",
  Cd:                "Cd",
  nitrate:           "Nitrate",
  chemical_residue:  "Chem. Residue",
  styrene:           "Styrene",
}

interface Props {
  timeRange: TimeRange
  selectedPollutants: string[]
  onTimeRangeChange: (range: TimeRange) => void
  onPollutantsChange: (pollutants: string[]) => void
}

function togglePollutant(current: string[], key: string): string[] {
  return current.includes(key)
    ? current.filter((k) => k !== key)
    : [...current, key]
}

export function DashboardFilters({
  timeRange,
  selectedPollutants,
  onTimeRangeChange,
  onPollutantsChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
      {/* Pollutant multi-select */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-widest text-gray-500 uppercase">Pollutants</span>
        <div className="flex flex-wrap gap-2">
          {ALL_POLLUTANTS.map((key) => {
            const isSelected = selectedPollutants.includes(key)
            return (
              <button
                key={key}
                id={`pollutant-filter-${key}`}
                onClick={() => onPollutantsChange(togglePollutant(selectedPollutants, key))}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
                ].join(" ")}
              >
                {POLLUTANT_LABELS[key]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time range */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-widest text-gray-500 uppercase">Time Range</span>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              id={`time-filter-${opt.value}`}
              onClick={() => onTimeRangeChange(opt.value)}
              className={[
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                timeRange === opt.value
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
