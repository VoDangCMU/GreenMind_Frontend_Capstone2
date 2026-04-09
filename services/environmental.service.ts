import axios from "axios"
import type { EnvironmentalPayload, ImpactPoint, TimeRange } from "@/types/environmental"
import { getAccessToken } from "@/lib/auth"

const BASE_POLLUTION = {
  CO2:               0.85,
  dioxin:            0.42,
  microplastic:      0.67,
  toxic_chemicals:   0.53,
  non_biodegradable: 0.71,
  NOx:               0.38,
  SO2:               0.29,
  CH4:               0.44,
  "PM2.5":           0.56,
  Pb:                0.18,
  Hg:                0.12,
  Cd:                0.09,
  nitrate:           0.33,
  chemical_residue:  0.21,
  styrene:           0.15,
}

const RANGE_DAY_COUNT: Record<TimeRange, number> = {
  day: 1,
  week: 7,
  month: 30,
}

function buildTimeSeries(days: number): ImpactPoint[] {
  return Array.from({ length: days }, (_, i) => {
    const dayOfWeek = i % 7  // 0=Mon … 4=Fri, 5=Sat, 6=Sun
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6
    // Weekend: +10~12% boost; weekday: baseline. Small variance via seed.
    const seed = (i + 1) * 7
    const weekendBoost = isWeekend ? 1.11 : 1.0
    const microVariance = 1 + ((seed % 5) - 2) * 0.015  // ±3% jitter
    return {
      day:   i + 1,
      air:   parseFloat((0.42 * weekendBoost * microVariance).toFixed(4)),
      water: parseFloat((0.31 * weekendBoost * microVariance).toFixed(4)),
      soil:  parseFloat((0.27 * weekendBoost * microVariance).toFixed(4)),
    }
  })
}

export function generateMockData(timeRange: TimeRange): EnvironmentalPayload {
  const dayCount = RANGE_DAY_COUNT[timeRange]
  const timeSeries = buildTimeSeries(dayCount)

  const airTotal   = timeSeries.reduce((acc, p) => acc + p.air,   0)
  const waterTotal = timeSeries.reduce((acc, p) => acc + p.water, 0)
  const soilTotal  = timeSeries.reduce((acc, p) => acc + p.soil,  0)

  return {
    pollution: { ...BASE_POLLUTION },
    impact: {
      air:   parseFloat((airTotal   / dayCount).toFixed(4)),
      water: parseFloat((waterTotal / dayCount).toFixed(4)),
      soil:  parseFloat((soilTotal  / dayCount).toFixed(4)),
    },
    timeSeries,
    isMock: true,
  }
}

function isValidPayload(payload: unknown): payload is EnvironmentalPayload {
  if (!payload || typeof payload !== "object") return false
  const p = payload as Record<string, unknown>
  return (
    p.pollution !== null &&
    typeof p.pollution === "object" &&
    p.impact !== null &&
    typeof p.impact === "object" &&
    Array.isArray(p.timeSeries) &&
    (p.timeSeries as unknown[]).length > 0
  )
}

export async function fetchEnvironmentalData(
  timeRange: TimeRange
): Promise<EnvironmentalPayload & { isMock: boolean }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://green-api.khoav4.com"
  const token = getAccessToken()

  if (!token) {
    return { ...generateMockData(timeRange), isMock: true }
  }

  try {
    const response = await axios.get(`${apiUrl}/environmental-impact`, {
      params: { range: timeRange },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    })

    const payload = response.data?.data
    if (!isValidPayload(payload)) {
      return { ...generateMockData(timeRange), isMock: true }
    }

    return { ...payload, isMock: false }
  } catch {
    return { ...generateMockData(timeRange), isMock: true }
  }
}
