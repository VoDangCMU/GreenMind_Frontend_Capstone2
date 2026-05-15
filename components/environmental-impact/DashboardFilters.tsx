"use client"

import type { TimeRange, UrbanArea } from "@/types/environmental"
import { getDateRange } from "@/services/environmental.service"

const TIME_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "Ngày", value: "day" },
  { label: "Tuần", value: "week" },
  { label: "Tháng", value: "month" },
]

/** Format YYYY-MM-DD → "D/M" */
function fmtShort(iso: string): string {
  const [, m, d] = iso.split("-")
  return `${parseInt(d)}/${parseInt(m)}`
}

interface Props {
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  urbanAreas: UrbanArea[]
  urbanAreaId: string
  onUrbanAreaChange: (id: string) => void
}

export function DashboardFilters({
  timeRange,
  onTimeRangeChange,
  urbanAreas,
  urbanAreaId,
  onUrbanAreaChange,
}: Props) {
  const { startDate, endDate } = getDateRange(timeRange)
  const rangeLabel =
    timeRange === "day"
      ? fmtShort(endDate)
      : `${fmtShort(startDate)} – ${fmtShort(endDate)}`

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Time range buttons */}
      <span className="text-xs font-medium tracking-widest text-gray-500 uppercase">Khoảng thời gian</span>
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
      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
        {rangeLabel}
      </span>

      {/* Urban area select — always visible */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium tracking-widest text-gray-500 uppercase">Khu vực</span>
        <select
          id="filter-urban-area"
          value={urbanAreaId}
          onChange={(e) => onUrbanAreaChange(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        >
          <option value="">Tất cả khu vực</option>
          {urbanAreas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name} — {area.city}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
