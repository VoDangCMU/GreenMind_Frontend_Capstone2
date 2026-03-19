"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { UrbanArea, Report, Summary } from "@/types/monitoring";
import { SummaryCards } from "@/components/monitoring/SummaryCards";
import { ReportList } from "@/components/monitoring/ReportList";
import { AreaDrawer } from "@/components/monitoring/AreaDrawer";
import { WARDS } from "@/data/wardData";
import { activityService } from "@/services/activity.service";

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(
  () => import("@/components/monitoring/MapView").then((m) => m.MapView),
  { ssr: false }
);

export default function MonitoringPage() {
  const [areas]     = useState<UrbanArea[]>(WARDS);
  const [reports,   setReports]   = useState<Report[]>([]);
  const [summary,   setSummary]   = useState<Summary | null>(null);
  const [loading,   setLoading]   = useState(true);

  const [selectedArea,      setSelectedArea]      = useState<UrbanArea | null>(null);
  const [highlightAreaName, setHighlightAreaName] = useState<string | null>(null);

  // Fetch summary + reports from service; use WARDS as static area data
  useEffect(() => {
    async function fetchAll() {
      try {
        const [reportsData, overviewData] = await Promise.all([
          activityService.getWasteReports(),
          activityService.getOverview(),
        ]);

        setReports(
          reportsData.map((r) => ({
            id:     parseInt(r.id.replace(/\D/g, "")) || Math.floor(Math.random() * 1000),
            area:   r.area.name,
            desc:   r.description,
            status: r.status === "collected" ? "done" : (r.status as any),
            time:   new Date(r.reported_at).toLocaleTimeString("vi-VN", {
              hour:   "2-digit",
              minute: "2-digit",
            }),
          }))
        );

        setSummary({
          totalWaste:    WARDS.reduce((s, w) => s + w.totalWaste, 0),
          urbanAreas:    WARDS.length,
          pendingReports: reportsData.filter((r) => r.status === "pending").length,
          wasteDistribution: {
            plastic: overviewData.avgPlastic,
            organic: 100 - overviewData.avgPlastic - 20,
            other:   20,
          },
        });
      } catch (err) {
        console.error("Failed to fetch monitoring data:", err);
        // Fallback summary from ward data alone
        setSummary({
          totalWaste:    WARDS.reduce((s, w) => s + w.totalWaste, 0),
          urbanAreas:    WARDS.length,
          pendingReports: WARDS.reduce((s, w) => s + w.reports, 0),
          wasteDistribution: { plastic: 42, organic: 38, other: 20 },
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  const handleAreaSelect = useCallback((area: UrbanArea) => {
    setSelectedArea(area);
    setHighlightAreaName(null);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedArea(null);
  }, []);

  const handleReportClick = useCallback(
    (areaName: string) => {
      setHighlightAreaName(areaName);
      const matched = areas.find((a) => a.name === areaName);
      if (matched) setSelectedArea(matched);
    },
    [areas]
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Giám sát Môi trường Đô thị
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Thành phố Đà Nẵng — Dashboard thời gian thực
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
            <span className="text-xs text-gray-400 font-medium">
              Cập nhật: {new Date().toLocaleTimeString("vi-VN", {
                hour:   "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Main scrollable content */}
      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Summary cards */}
        <SummaryCards
          summary={
            summary ?? {
              totalWaste: 0,
              urbanAreas: 0,
              pendingReports: 0,
              wasteDistribution: { plastic: 0, organic: 0, other: 0 },
            }
          }
          loading={loading}
        />

        {/* Map + Reports */}
        <div
          className="grid grid-cols-10 gap-5"
          style={{ height: "calc(100vh - 320px)", minHeight: "520px" }}
        >
          {/* Map (70%) */}
          <div className="col-span-7 h-full">
            <MapView
              areas={areas}
              selectedAreaId={selectedArea?.id ?? null}
              highlightAreaName={highlightAreaName}
              onAreaSelect={handleAreaSelect}
              loading={loading}
            />
          </div>

          {/* Reports panel (30%) */}
          <div className="col-span-3 h-full overflow-hidden">
            <ReportList
              reports={reports}
              loading={loading}
              onReportClick={handleReportClick}
              selectedArea={selectedArea?.name ?? null}
            />
          </div>
        </div>
      </div>

      {/* Area detail drawer */}
      <AreaDrawer area={selectedArea} onClose={handleDrawerClose} />
    </div>
  );
}
