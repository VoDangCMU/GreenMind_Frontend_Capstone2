"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { UrbanArea, WasteReport, Summary } from "@/types/monitoring";
import { SummaryCards } from "@/components/monitoring/SummaryCards";
import { ReportList } from "@/components/monitoring/ReportList";
import { AreaDrawer } from "@/components/monitoring/AreaDrawer";
import { WARDS } from "@/data/wardData";
import { WASTE_REPORTS } from "@/data/reportData";

const MapView = dynamic(
  () => import("@/components/monitoring/MapView").then((m) => m.MapView),
  { ssr: false }
);

export default function MonitoringPage() {
  const [areas]       = useState<UrbanArea[]>(WARDS);
  const [wasteReports, setWasteReports] = useState<WasteReport[]>(WASTE_REPORTS);
  const [summary,     setSummary]   = useState<Summary | null>(null);
  const [loading,     setLoading]   = useState(true);

  const [selectedArea,      setSelectedArea]      = useState<UrbanArea | null>(null);
  const [highlightAreaName, setHighlightAreaName] = useState<string | null>(null);

  useEffect(() => {
    // Use mock data; try API in background
    const pending  = WASTE_REPORTS.filter(r => r.status === "pending").length;
    const assigned = WASTE_REPORTS.filter(r => r.status === "assigned").length;
    const totalW   = WARDS.reduce((s, w) => s + w.totalWaste, 0);

    setSummary({
      totalWaste:    totalW,
      urbanAreas:    WARDS.length,
      pendingReports: pending + assigned,
      wasteDistribution: { plastic: 38, organic: 42, other: 20 },
    });
    setLoading(false);
  }, []);

  const handleAreaSelect = useCallback((area: UrbanArea) => {
    setSelectedArea(area);
    setHighlightAreaName(null);
  }, []);

  const handleDrawerClose = useCallback(() => setSelectedArea(null), []);

  const handleReportClick = useCallback((report: WasteReport) => {
    setHighlightAreaName(report.wardName);
    const matched = areas.find(a => a.name === report.wardName);
    if (matched) setSelectedArea(matched);
  }, [areas]);

  const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header — fixed */}
      <div className="shrink-0 px-6 pt-4 pb-3 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Urban Environment Monitoring
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Da Nang City — Real-time Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
            <span className="text-xs text-gray-400 font-medium">Cập nhật: {now}</span>
          </div>
        </div>
      </div>

      {/* Summary cards — fixed */}
      <div className="shrink-0 px-6 pt-4 pb-3">
        <SummaryCards
          summary={
            summary ?? {
              totalWaste: 0, urbanAreas: 0, pendingReports: 0,
              wasteDistribution: { plastic: 0, organic: 0, other: 0 },
            }
          }
          loading={loading}
        />
      </div>

      {/* Map + Report — fills all remaining space */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="grid grid-cols-10 gap-5 h-full">
          {/* Map 70% */}
          <div className="col-span-7 h-full">
            <MapView
              areas={areas}
              reports={wasteReports}
              selectedAreaId={selectedArea?.id ?? null}
              highlightAreaName={highlightAreaName}
              onAreaSelect={handleAreaSelect}
              onReportSelect={handleReportClick}
              loading={loading}
            />
          </div>

          {/* Report list 30% */}
          <div className="col-span-3 h-full overflow-hidden">
            <ReportList
              wasteReports={wasteReports}
              loading={loading}
              onReportClick={handleReportClick}
              selectedArea={selectedArea?.name ?? null}
            />
          </div>
        </div>
      </div>

      <AreaDrawer
        area={selectedArea}
        wasteReports={wasteReports}
        onClose={handleDrawerClose}
      />
    </div>
  );
}
