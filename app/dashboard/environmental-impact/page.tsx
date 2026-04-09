"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import type { TimeRange, EnvironmentalPayload } from "@/types/environmental"
import { fetchEnvironmentalData, generateMockData } from "@/services/environmental.service"
import { getAccessToken } from "@/lib/auth"
import { StatsPanel } from "@/components/environmental-impact/StatsPanel"
import { DashboardFilters } from "@/components/environmental-impact/DashboardFilters"
import { PollutionBarChart } from "@/components/environmental-impact/PollutionBarChart"
import { ImpactAreaChart } from "@/components/environmental-impact/ImpactAreaChart"

interface DataState {
  payload: EnvironmentalPayload
  isMock: boolean
}

const INITIAL_STATE: DataState = {
  payload: generateMockData("month"),
  isMock: true,
}

export default function EnvironmentalImpactPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month")
  const [selectedPollutants, setSelectedPollutants] = useState<string[]>([])
  const [dataState, setDataState] = useState<DataState>(INITIAL_STATE)
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)
  const [computeMsg, setComputeMsg] = useState<string | null>(null)
  const [forceMock, setForceMock] = useState(false)

  const loadData = useCallback(async (range: TimeRange, mock = false) => {
    setLoading(true)
    if (mock) {
      setDataState({ payload: generateMockData(range), isMock: true })
      setLoading(false)
      return
    }
    const result = await fetchEnvironmentalData(range)
    setDataState({ payload: result, isMock: result.isMock })
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData(timeRange, forceMock)
  }, [timeRange, forceMock, loadData])

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range)
  }

  const handleCompute = async () => {
    const token = getAccessToken()
    if (!token) return

    setComputing(true)
    setComputeMsg(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://green-api.khoav4.com"
      const res = await axios.post(
        `${apiUrl}/environmental-impact/compute-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 }
      )
      const { success, skipped, failed } = res.data?.data ?? {}
      setComputeMsg(`Done — ${success ?? 0} computed, ${skipped ?? 0} skipped, ${failed ?? 0} failed`)
      setForceMock(false)
      await loadData(timeRange, false)
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Compute failed"
        : "Compute failed"
      setComputeMsg(msg)
    } finally {
      setComputing(false)
      setTimeout(() => setComputeMsg(null), 4000)
    }
  }

  const { payload, isMock } = dataState

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Page title */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-1">Environmental Impact</h1>
          <p className="text-muted-foreground text-sm">Tác động tới môi trường</p>
        </div>

        <div className="flex items-center gap-3 mt-1">
          {/* Compute button */}
          <button
            id="btn-compute-impact"
            onClick={handleCompute}
            disabled={computing}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
          >
            {computing ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            ) : (
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-emerald-600" aria-hidden="true">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            )}
            {computing ? "Computing all…" : "Compute All Users"}
          </button>

          {/* Mock data toggle */}
          <button
            id="btn-toggle-mock"
            onClick={() => setForceMock((v) => !v)}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              forceMock
                ? "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-50"
                : "border-border text-muted-foreground hover:border-amber-300 hover:text-amber-700",
            ].join(" ")}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${forceMock ? "bg-amber-400 animate-pulse" : "bg-muted-foreground"}`} />
            {forceMock ? "Demo data (click to reload real)" : "Use demo data"}
          </button>
        </div>
      </div>

      {/* Compute message toast */}
      {computeMsg && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${computeMsg.includes("failed")
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}>
          {computeMsg}
        </div>
      )}

      {/* Stats */}
      <StatsPanel pollution={payload.pollution} impact={payload.impact} />

      {/* Filters */}
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <DashboardFilters
          timeRange={timeRange}
          selectedPollutants={selectedPollutants}
          onTimeRangeChange={handleTimeRangeChange}
          onPollutantsChange={setSelectedPollutants}
        />
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground tracking-wide uppercase">
            Pollution Breakdown
          </h2>
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <PollutionBarChart
              pollutionData={payload.pollution}
              selectedPollutants={selectedPollutants}
            />
          )}
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground tracking-wide uppercase">
            Impact Over Time
          </h2>
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <ImpactAreaChart timeSeries={payload.timeSeries} />
          )}
        </section>
      </div>
    </div>
  )
}
