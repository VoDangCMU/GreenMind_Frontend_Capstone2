"use client"

import type { ImpactPoint, PollutionData } from "@/types/environmental"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface Props {
  timeSeries: ImpactPoint[]
  pollution: PollutionData
}

// 12 pollutants grouped by environmental medium (excluding Hg=0, Cd=0, chemical_residue=0)
const AIR_KEYS   = ["CO2", "NOx", "SO2", "CH4", "PM2.5"] as const
const WATER_KEYS = ["microplastic", "nitrate", "Pb"]      as const
const SOIL_KEYS  = ["dioxin", "toxic_chemicals", "non_biodegradable", "styrene"] as const

type PollutionKey = keyof PollutionData

const SERIES_META: { key: PollutionKey; label: string; color: string }[] = [
  // ── Air (cool/violet tones)
  { key: "CO2",               label: "CO₂",              color: "#6366f1" },
  { key: "NOx",               label: "NOx",              color: "#818cf8" },
  { key: "SO2",               label: "SO₂",              color: "#a78bfa" },
  { key: "CH4",               label: "CH₄",              color: "#38bdf8" },
  { key: "PM2.5",             label: "PM2.5",            color: "#06b6d4" },
  // ── Water (warm/orange tones)
  { key: "microplastic",      label: "Microplastic",     color: "#f97316" },
  { key: "nitrate",           label: "Nitrate",          color: "#22c55e" },
  { key: "Pb",                label: "Lead (Pb)",        color: "#eab308" },
  // ── Soil (red/earth tones)
  { key: "dioxin",            label: "Dioxin",           color: "#ef4444" },
  { key: "toxic_chemicals",   label: "Toxic Chem.",      color: "#f43f5e" },
  { key: "non_biodegradable", label: "Non-Biodeg.",      color: "#fb923c" },
  { key: "styrene",           label: "Styrene",          color: "#84cc16" },
]

// ── helpers ────────────────────────────────────────────────────────────────
function sumKeys(pollution: PollutionData, keys: readonly PollutionKey[]): number {
  return keys.reduce((acc, k) => acc + (pollution[k] ?? 0), 0)
}

function buildChartData(
  timeSeries: ImpactPoint[],
  pollution: PollutionData,
): Record<string, number | string>[] {
  const airTotal   = sumKeys(pollution, AIR_KEYS)
  const waterTotal = sumKeys(pollution, WATER_KEYS)
  const soilTotal  = sumKeys(pollution, SOIL_KEYS)

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
  if (timeSeries.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        No data available for this period
      </div>
    )
  }

  const data     = buildChartData(timeSeries, pollution)
  const manyDays = timeSeries.length > 14

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: manyDays ? 32 : 12 }}
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

          <Legend
            layout="horizontal"
            verticalAlign="top"
            wrapperStyle={{ paddingBottom: 8, fontSize: 11 }}
            formatter={(value) => (
              <span style={{ color: "#6b7280" }}>{value}</span>
            )}
          />

          {SERIES_META.map((s) => (
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
  )
}
