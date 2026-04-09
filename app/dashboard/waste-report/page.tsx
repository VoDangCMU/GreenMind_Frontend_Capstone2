"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Summary, UrbanArea, WasteReport, WasteType, ReportStatus, Collector } from "@/types/waste-report";
import { SummaryCards } from "@/components/waste-report/SummaryCards";
import { ReportList, ReportDetailModal } from "@/components/waste-report/ReportList";
import { AreaDrawer } from "@/components/waste-report/AreaDrawer";
import { WARDS } from "@/data/wardData";
import { ENV_ALERTS } from "@/data/envAlertData";
import { getAccessToken } from "@/lib/auth";

const MapView = dynamic(
  () => import("@/components/waste-report/MapView").then((m) => m.MapView),
  { ssr: false }
);

const MapWard = dynamic(
  () => import("@/components/waste-report/MapWard").then((m) => m.MapWard),
  { ssr: false }
);

export default function MonitoringPage() {
  const [areas] = useState<UrbanArea[]>(WARDS);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedArea, setSelectedArea] = useState<UrbanArea | null>(null);
  const [highlightAreaName, setHighlightAreaName] = useState<string | null>(null);
  const [selectedWardName, setSelectedWardName] = useState<string | null>(null);
  const [selectedReportPopup, setSelectedReportPopup] = useState<WasteReport | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const token = getAccessToken();
        const [reportsRes, collectorsRes] = await Promise.all([
          // limit=100 để lấy toàn bộ reports, không bị giới hạn page
          fetch("https://vodang-api.gauas.com/waste-monitoring?limit=100", {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store"
          }).catch(() => null),
          fetch("https://vodang-api.gauas.com/waste-monitoring/collectors", {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store"
          }).catch(() => null)
        ]);

        let validReports: WasteReport[] = [];
        let validCollectors: Collector[] = [];

        if (collectorsRes && collectorsRes.ok) {
          const cData = await collectorsRes.json();
          const collectorList = Array.isArray(cData) ? cData : (cData?.data ?? []);
          validCollectors = collectorList.map((c: any) => ({
            id: c.id,
            name: c.fullName || "Không rõ",
            phone: c.phoneNumber || "Không có SĐT",
            zones: [],
            vehicleId: "",
            activeReports: c.activeReports || 0
          }));
        }
        setCollectors(validCollectors);

        if (reportsRes && reportsRes.ok) {
          const apiData = await reportsRes.json();
          // API trả về { data: [...], total, page, limit }
          const rawList: any[] = Array.isArray(apiData) ? apiData : (apiData?.data ?? []);

          const wasteTypeMap: Record<string, WasteType> = {
            plastic: "plastic",
            organic: "organic",
            hazardous: "hazardous",
            mixed: "mixed",
          };
          const statusMap: Record<string, ReportStatus> = {
            pending: "pending",
            assigned: "assigned",
            done: "done",
            collected: "done",
            resolved: "done",
          };

          validReports = rawList.map((r: any) => ({
            id: r.id,
            code: r.code || "",
            householdId: 0,
            householdName: r.reportedBy || "Không rõ",
            wardId: 0,
            wardName: r.wardName || "Không rõ",
            lat: r.lat ?? 0,
            lng: r.lng ?? 0,
            wasteKg: r.wasteKg || 0,
            wasteType: wasteTypeMap[r.wasteType] ?? "mixed",
            description: r.description || "Không có nội dung",
            status: statusMap[r.status] ?? "pending",
            reportedAt: r.createdAt || new Date().toISOString(),
            assignedTo: r.assignedTo || null,
            collectorId: r.collectorId || null,
            resolvedAt: r.resolvedAt || null,
            imageUrl: r.imageUrl || null,
            imageEvidenceUrl: r.imageEvidenceUrl || null,
          } as WasteReport));
        }

        setReports(validReports);

        // Tính summary từ dữ liệu thực
        const totalKg = validReports.reduce((s, r) => s + r.wasteKg, 0);
        const uniqueWards = new Set(validReports.map(r => r.wardName)).size;
        const totalCount = validReports.length || 1; // tránh chia 0

        // Đếm số lượng report theo từng wasteType → tính %
        const countByType = (type: WasteType) =>
          validReports.filter(r => r.wasteType === type).length;

        const plasticCount = countByType("plastic");
        const organicCount = countByType("organic");
        const mixedCount = countByType("mixed");
        const hazardousCount = countByType("hazardous");

        // Làm tròn, điều chỉnh bucket lớn nhất để tổng = 100
        const toRaw = (n: number) => Math.round((n / totalCount) * 100);
        let plasticPct = toRaw(plasticCount);
        let organicPct = toRaw(organicCount);
        let mixedPct = toRaw(mixedCount);
        let hazardousPct = toRaw(hazardousCount);
        const diff = 100 - plasticPct - organicPct - mixedPct - hazardousPct;
        // Cộng phần dư vào bucket lớn nhất
        const maxPct = Math.max(plasticPct, organicPct, mixedPct, hazardousPct);
        if (diff !== 0) {
          if (mixedPct === maxPct) mixedPct += diff;
          else if (plasticPct === maxPct) plasticPct += diff;
          else if (organicPct === maxPct) organicPct += diff;
          else hazardousPct += diff;
        }

        setSummary({
          totalWaste: totalKg,
          urbanAreas: uniqueWards,
          pendingReports: validReports.filter(r => r.status === "pending").length,
          wasteDistribution: {
            plastic: plasticPct,
            organic: organicPct,
            mixed: mixedPct,
            hazardous: hazardousPct,
          },
        });
      } catch (err) {
        console.error("Failed to fetch monitoring data:", err);
        setReports([]);
        setSummary({
          totalWaste: 0,
          urbanAreas: 0,
          pendingReports: 0,
          wasteDistribution: { plastic: 0, organic: 0, mixed: 0, hazardous: 0 },
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  const handleAssignCollector = async (reportId: string, collectorId: string) => {
    const collector = collectors.find(c => c.id === collectorId);
    if (!collector) return;

    try {
      const token = getAccessToken();
      const res = await fetch(`https://vodang-api.gauas.com/waste-monitoring/${reportId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ collectorId })
      });

      if (!res.ok) {
        throw new Error("Failed to assign collector");
      }

      // Có thể đọc JSON response (assignedData = await res.json()) nhưng ở đây ta chỉ cần update State
      setReports(prev => prev.map(r =>
        r.id === reportId
          ? { ...r, status: "assigned", assignedTo: collector.name, collectorId: collector.id }
          : r
      ));
    } catch (err) {
      console.error("Lỗi khi giao nhiệm vụ", err);
      alert("Đã xảy ra lỗi khi giao nhiệm vụ. Vui lòng thử lại hoặc kiểm tra kết nối mạng!");
    }
  };


  const handleAreaSelect = useCallback((area: UrbanArea) => {
    setSelectedArea(area);
    setSelectedWardName(area.name);
    setHighlightAreaName(null);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedArea(null);
    setSelectedWardName(null);
  }, []);

  const handleReportClick = useCallback((report: WasteReport) => {
    // Hiển thị modal detail của report
    setSelectedReportPopup(report);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedWardName(null);
    setSelectedArea(null);
    setHighlightAreaName(null);
  }, []);

  const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      {/* Header — fixed */}
      <div className="shrink-0 px-6 pt-4 pb-3 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Waste Report
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
            <span className="text-xs text-gray-400 font-medium">
              Cập nhật: {new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Summary cards — fixed */}
      <div className="shrink-0 px-6 pt-4 pb-3">
        <SummaryCards
          summary={
            summary ?? {
              totalWaste: 0, urbanAreas: 0, pendingReports: 0,
              wasteDistribution: { plastic: 0, organic: 0, mixed: 0, hazardous: 0 },
            }
          }
          loading={loading}
        />
      </div>

      {/* Map + Right panel — fills all remaining space */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="grid grid-cols-10 gap-5 h-full">
          {/* Map 70% */}
          <div className="col-span-7 h-full">
            <MapView
              areas={areas}
              reports={reports}
              envAlerts={ENV_ALERTS}
              selectedWardName={selectedWardName}
              selectedAreaId={selectedArea?.id ?? null}
              highlightAreaName={highlightAreaName}
              onAreaSelect={handleAreaSelect}
              onReportSelect={handleReportClick}
              onClearSelection={handleClearSelection}
              loading={loading}
            />
          </div>

          {/* Right panel 30%:
              Level 1 (không chọn phường) → ReportList (danh sách báo cáo, chọn collector)
              Level 2 (đã chọn phường)    → AreaDrawer (thông tin phường + báo cáo + biểu đồ)
          */}
          <div className="col-span-3 h-full overflow-hidden">
            {selectedArea ? (
              <AreaDrawer
                area={selectedArea}
                wasteReports={reports}
                collectors={collectors}
                onClose={handleDrawerClose}
                onAssign={handleAssignCollector}
              />
            ) : (
              <ReportList
                wasteReports={reports}
                collectors={collectors}
                loading={loading}
                onReportClick={handleReportClick}
                onAssign={handleAssignCollector}
                selectedArea={null}
              />
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal cho map marker click */}
      {selectedReportPopup && (
        <ReportDetailModal
          report={selectedReportPopup}
          onClose={() => setSelectedReportPopup(null)}
        />
      )}
    </div>
  );
}
