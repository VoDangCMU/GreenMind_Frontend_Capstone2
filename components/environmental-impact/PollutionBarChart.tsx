"use client"

import { useState } from "react"
import type { ImpactPoint, PollutionData } from "@/types/environmental"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Props {
  timeSeries: ImpactPoint[]
  pollution: PollutionData
}

// 12 pollutants grouped by environmental medium (excluding Hg=0, Cd=0, chemical_residue=0)
const AIR_KEYS = ["CO2", "NOx", "SO2", "CH4", "PM2.5"] as const
const WATER_KEYS = ["microplastic", "nitrate", "Pb"] as const
const SOIL_KEYS = ["dioxin", "toxic_chemicals", "non_biodegradable", "styrene"] as const

type PollutionKey = keyof PollutionData

const SERIES_META: { key: PollutionKey; label: string; color: string; medium: "air" | "water" | "soil" }[] = [
  // ── Air
  { key: "CO2", label: "CO₂", color: "#6366f1", medium: "air" },
  { key: "NOx", label: "NOx", color: "#818cf8", medium: "air" },
  { key: "SO2", label: "SO₂", color: "#a78bfa", medium: "air" },
  { key: "CH4", label: "CH₄", color: "#38bdf8", medium: "air" },
  { key: "PM2.5", label: "PM2.5", color: "#06b6d4", medium: "air" },
  // ── Water
  { key: "microplastic", label: "Microplastic", color: "#f97316", medium: "water" },
  { key: "nitrate", label: "Nitrate", color: "#22c55e", medium: "water" },
  { key: "Pb", label: "Lead (Pb)", color: "#eab308", medium: "water" },
  // ── Soil
  { key: "dioxin", label: "Dioxin", color: "#ef4444", medium: "soil" },
  { key: "toxic_chemicals", label: "Toxic Chem.", color: "#f43f5e", medium: "soil" },
  { key: "non_biodegradable", label: "Non-Biodeg.", color: "#fb923c", medium: "soil" },
  { key: "styrene", label: "Styrene", color: "#84cc16", medium: "soil" },
]

const ALL_KEYS = SERIES_META.map((s) => s.key)

// ── helpers ────────────────────────────────────────────────────────────────
function sumKeys(pollution: PollutionData, keys: readonly PollutionKey[]): number {
  return keys.reduce((acc, k) => acc + (pollution[k] ?? 0), 0)
}

function buildChartData(
  timeSeries: ImpactPoint[],
  pollution: PollutionData,
): Record<string, number | string>[] {
  const airTotal = sumKeys(pollution, AIR_KEYS)
  const waterTotal = sumKeys(pollution, WATER_KEYS)
  const soilTotal = sumKeys(pollution, SOIL_KEYS)

  return timeSeries.map((point) => {
    const row: Record<string, number | string> = {
      label: point.date ?? `Day ${point.day}`,
    }

    for (const key of AIR_KEYS) {
      const frac = airTotal > 0 ? (pollution[key] ?? 0) / airTotal : 0
      row[key] = parseFloat((frac * point.air).toFixed(5))
    }
    for (const key of WATER_KEYS) {
      const frac = waterTotal > 0 ? (pollution[key] ?? 0) / waterTotal : 0
      row[key] = parseFloat((frac * point.water).toFixed(5))
    }
    for (const key of SOIL_KEYS) {
      const frac = soilTotal > 0 ? (pollution[key] ?? 0) / soilTotal : 0
      row[key] = parseFloat((frac * point.soil).toFixed(5))
    }

    return row
  })
}

// ── component ──────────────────────────────────────────────────────────────
export function PollutionBarChart({ timeSeries, pollution }: Props) {
  const [selected, setSelected] = useState<Set<PollutionKey>>(new Set(ALL_KEYS))

  const toggle = (key: PollutionKey) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        // keep at least 1 active
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const selectAll = () => setSelected(new Set(ALL_KEYS))
  const clearAll = () => setSelected(new Set([ALL_KEYS[0]]))

  if (timeSeries.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        No data available for this period
      </div>
    )
  }

  const data = buildChartData(timeSeries, pollution)
  const manyDays = timeSeries.length > 14

  return (
    <div className="flex flex-col gap-3">
      {/* ── Multi-select chip filter ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* All / None shortcuts */}
        <button
          onClick={selectAll}
          className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted"
        >
          All
        </button>
        <button
          onClick={clearAll}
          className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted"
        >
          Clear
        </button>

        <span className="h-4 w-px bg-border mx-0.5" />

        {/* Per-pollutant chips */}
        {SERIES_META.map((s) => {
          const active = selected.has(s.key)
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              style={
                active
                  ? {
                    backgroundColor: s.color + "22", // 13% opacity bg
                    borderColor: s.color,
                    color: s.color,
                  }
                  : undefined
              }
              className={[
                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all duration-150",
                active
                  ? ""
                  : "border-border text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {/* ── Line chart ───────────────────────────────────────────────── */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: manyDays ? 32 : 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

            <XAxis
              dataKey="label"
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              angle={manyDays ? -40 : 0}
              textAnchor={manyDays ? "end" : "middle"}
              interval={manyDays ? Math.floor(timeSeries.length / 10) : 0}
            />

            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              label={{ value: "Value", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 11 }}
              width={42}
            />

            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
              itemStyle={{ color: "var(--muted-foreground)" }}
            />

            {SERIES_META.filter((s) => selected.has(s.key)).map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: s.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
