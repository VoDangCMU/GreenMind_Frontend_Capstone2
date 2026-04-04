"use client";

import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { UrbanArea, WasteReport, Collector } from "@/types/waste-report";
import { HOUSEHOLDS } from "@/data/wardData";
// Removed COLLECTORS import

interface AreaDrawerProps {
  area: UrbanArea | null;
  wasteReports: WasteReport[];
  collectors: Collector[];
  onClose: () => void;
  onAssign?: (reportId: string, collectorId: string) => void;
}

const AREA_DETAILS: Record<
  number,
  {
    households: number;
    plasticRatio: number;
    wasteTrend: { date: string; waste: number }[];
    plasticByMonth: { month: string; plastic: number }[];
    electricityByMonth: { month: string; kwh: number }[];
    emissionTrend: { date: string; emission: number }[];
  }
> = {
  1: {
    households: 1250,
    plasticRatio: 45,
    wasteTrend: [
      { date: "03-13", waste: 2800 },
      { date: "03-14", waste: 2900 },
      { date: "03-15", waste: 3000 },
      { date: "03-16", waste: 3100 },
      { date: "03-17", waste: 3300 },
      { date: "03-18", waste: 3400 },
      { date: "03-19", waste: 3200 },
    ],
    plasticByMonth: [
      { month: "Oct", plastic: 820 },
      { month: "Nov", plastic: 940 },
      { month: "Dec", plastic: 1050 },
      { month: "Jan", plastic: 980 },
      { month: "Feb", plastic: 1100 },
      { month: "Mar", plastic: 1240 },
    ],
    electricityByMonth: [
      { month: "Oct", kwh: 32000 },
      { month: "Nov", kwh: 34500 },
      { month: "Dec", kwh: 38000 },
      { month: "Jan", kwh: 36000 },
      { month: "Feb", kwh: 33000 },
      { month: "Mar", kwh: 35500 },
    ],
    emissionTrend: [
      { date: "03-13", emission: 1.4 },
      { date: "03-14", emission: 1.45 },
      { date: "03-15", emission: 1.5 },
      { date: "03-16", emission: 1.55 },
      { date: "03-17", emission: 1.65 },
      { date: "03-18", emission: 1.7 },
      { date: "03-19", emission: 1.6 },
    ],
  },
  2: {
    households: 870,
    plasticRatio: 38,
    wasteTrend: [
      { date: "03-13", waste: 1500 },
      { date: "03-14", waste: 1600 },
      { date: "03-15", waste: 1700 },
      { date: "03-16", waste: 1800 },
      { date: "03-17", waste: 1750 },
      { date: "03-18", waste: 1820 },
      { date: "03-19", waste: 1800 },
    ],
    plasticByMonth: [
      { month: "Oct", plastic: 420 },
      { month: "Nov", plastic: 480 },
      { month: "Dec", plastic: 510 },
      { month: "Jan", plastic: 490 },
      { month: "Feb", plastic: 530 },
      { month: "Mar", plastic: 560 },
    ],
    electricityByMonth: [
      { month: "Oct", kwh: 18000 },
      { month: "Nov", kwh: 19500 },
      { month: "Dec", kwh: 21000 },
      { month: "Jan", kwh: 20000 },
      { month: "Feb", kwh: 18500 },
      { month: "Mar", kwh: 19000 },
    ],
    emissionTrend: [
      { date: "03-13", emission: 0.75 },
      { date: "03-14", emission: 0.8 },
      { date: "03-15", emission: 0.85 },
      { date: "03-16", emission: 0.9 },
      { date: "03-17", emission: 0.87 },
      { date: "03-18", emission: 0.91 },
      { date: "03-19", emission: 0.9 },
    ],
  },
  3: {
    households: 540,
    plasticRatio: 28,
    wasteTrend: [
      { date: "03-13", waste: 780 },
      { date: "03-14", waste: 820 },
      { date: "03-15", waste: 860 },
      { date: "03-16", waste: 910 },
      { date: "03-17", waste: 900 },
      { date: "03-18", waste: 940 },
      { date: "03-19", waste: 900 },
    ],
    plasticByMonth: [
      { month: "Oct", plastic: 180 },
      { month: "Nov", plastic: 200 },
      { month: "Dec", plastic: 220 },
      { month: "Jan", plastic: 210 },
      { month: "Feb", plastic: 230 },
      { month: "Mar", plastic: 250 },
    ],
    electricityByMonth: [
      { month: "Oct", kwh: 9500 },
      { month: "Nov", kwh: 10200 },
      { month: "Dec", kwh: 11000 },
      { month: "Jan", kwh: 10500 },
      { month: "Feb", kwh: 9800 },
      { month: "Mar", kwh: 10000 },
    ],
    emissionTrend: [
      { date: "03-13", emission: 0.39 },
      { date: "03-14", emission: 0.41 },
      { date: "03-15", emission: 0.43 },
      { date: "03-16", emission: 0.45 },
      { date: "03-17", emission: 0.44 },
      { date: "03-18", emission: 0.47 },
      { date: "03-19", emission: 0.45 },
    ],
  },
};

// Fallback detail for dynamically added areas
const defaultDetail = (area: UrbanArea) => ({
  households: Math.round(area.totalWaste / 2.5),
  plasticRatio: Math.round(30 + area.reports * 2),
  wasteTrend: [
    { date: "03-13", waste: Math.round(area.totalWaste * 0.85) },
    { date: "03-14", waste: Math.round(area.totalWaste * 0.9) },
    { date: "03-15", waste: Math.round(area.totalWaste * 0.93) },
    { date: "03-16", waste: Math.round(area.totalWaste * 0.97) },
    { date: "03-17", waste: Math.round(area.totalWaste * 1.0) },
    { date: "03-18", waste: Math.round(area.totalWaste * 1.03) },
    { date: "03-19", waste: area.totalWaste },
  ],
  plasticByMonth: [
    { month: "Oct", plastic: Math.round(area.totalWaste * 0.22) },
    { month: "Nov", plastic: Math.round(area.totalWaste * 0.25) },
    { month: "Dec", plastic: Math.round(area.totalWaste * 0.3) },
    { month: "Jan", plastic: Math.round(area.totalWaste * 0.28) },
    { month: "Feb", plastic: Math.round(area.totalWaste * 0.32) },
    { month: "Mar", plastic: Math.round(area.totalWaste * 0.35) },
  ],
  electricityByMonth: [
    { month: "Oct", kwh: area.totalWaste * 8 },
    { month: "Nov", kwh: area.totalWaste * 8.5 },
    { month: "Dec", kwh: area.totalWaste * 9.5 },
    { month: "Jan", kwh: area.totalWaste * 9 },
    { month: "Feb", kwh: area.totalWaste * 8.2 },
    { month: "Mar", kwh: area.totalWaste * 8.8 },
  ],
  emissionTrend: [
    { date: "03-13", emission: +(area.totalWaste * 0.00042).toFixed(2) },
    { date: "03-14", emission: +(area.totalWaste * 0.00044).toFixed(2) },
    { date: "03-15", emission: +(area.totalWaste * 0.00046).toFixed(2) },
    { date: "03-16", emission: +(area.totalWaste * 0.00048).toFixed(2) },
    { date: "03-17", emission: +(area.totalWaste * 0.00047).toFixed(2) },
    { date: "03-18", emission: +(area.totalWaste * 0.0005).toFixed(2) },
    { date: "03-19", emission: +(area.totalWaste * 0.00048).toFixed(2) },
  ],
});

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  red: { label: "Critical", bg: "bg-red-50", text: "text-red-600" },
  yellow: { label: "Moderate", bg: "bg-amber-50", text: "text-amber-600" },
  green: { label: "Normal", bg: "bg-emerald-50", text: "text-emerald-600" },
};

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

const REPORT_STATUS_CFG = {
  pending:  { label: "Chờ xử lý",    bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400 animate-pulse"   },
  assigned: { label: "Đang thu gom", bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400"    },
  done:     { label: "Hoàn thành",   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
};

export function AreaDrawer({ area, wasteReports, collectors, onClose, onAssign }: AreaDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Local mutable copy of reports (for assign action)
  const [localReports, setLocalReports] = useState<WasteReport[]>(wasteReports);
  // Sync when prop changes (different ward selected)
  useEffect(() => { setLocalReports(wasteReports); }, [wasteReports]);

  // Selected report for detail view
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  // Collector selection for pending assign
  const [selectedCollectorId, setSelectedCollectorId] = useState<string | null>(null);
  // Success flash
  const [assignedFlash, setAssignedFlash] = useState(false);

  const selectedReport = localReports.find(r => r.id === selectedReportId) ?? null;

  function handleAssign() {
    if (!selectedReport || selectedCollectorId === null) return;
    const collector = collectors.find(c => c.id === selectedCollectorId);
    if (!collector) return;
    
    // Call the parent handler to sync state globally
    if (onAssign) {
      onAssign(selectedReport.id, selectedCollectorId);
    }
    
    setLocalReports(prev =>
      prev.map(r =>
        r.id === selectedReport.id
          ? { ...r, status: "assigned", assignedTo: collector.name, collectorId: collector.id }
          : r
      )
    );
    setAssignedFlash(true);
    setTimeout(() => {
      setAssignedFlash(false);
      setSelectedReportId(null);
      setSelectedCollectorId(null);
    }, 1200);
  }

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedReportId) { setSelectedReportId(null); setSelectedCollectorId(null); }
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, selectedReportId]);

  const detail = area
    ? AREA_DETAILS[area.id] ?? defaultDetail(area)
    : null;

  const statusCfg = area ? STATUS_LABEL[area.status] : null;

  return (
    <div
      ref={drawerRef}
      className="w-full h-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden"
    >
        {/* Drawer header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-gray-900">
                {area?.name ?? "—"}
              </h2>
              {statusCfg && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}
                >
                  {statusCfg.label}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">Dữ liệu môi trường & rác thải thời gian thực</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {area && detail ? (
            <>
              {/* Report pipeline for this ward — TOP */}
              {(() => {
                const wardReports = localReports.filter(r => r.wardName === area.name);
                if (wardReports.length === 0) return null;
                const pendingCount = wardReports.filter(r => r.status === "pending").length;
                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Báo cáo rác thải ({wardReports.length} báo cáo)
                      </p>
                      {pendingCount > 0 && (
                        <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                          {pendingCount} chờ xử lý
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {wardReports.map(r => {
                        const sc = REPORT_STATUS_CFG[r.status];
                        const t  = new Date(r.reportedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                        return (
                          <div
                            key={r.id}
                            className={`rounded-xl border border-gray-100 p-3 ${sc.bg} cursor-pointer hover:shadow-sm hover:border-gray-200 transition-all`}
                            onClick={() => { setSelectedReportId(r.id); setSelectedCollectorId(null); }}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${sc.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                {sc.label}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 tabular-nums">{t}</span>
                                <span className="text-[10px] text-gray-300">›</span>
                              </div>
                            </div>
                            <p className="text-xs font-semibold text-gray-800 mb-0.5">{r.householdName}</p>
                            <p className="text-[10px] text-gray-500 line-clamp-1 mb-2">{r.description}</p>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-semibold">Báo cáo</span>
                              <span className="text-gray-300 font-bold">→</span>
                              <span className={`rounded-full px-2 py-0.5 font-semibold ${
                                r.status === "done" ? "bg-blue-100 text-blue-700" :
                                r.status === "assigned" ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-400"
                              }`}>
                                {r.status === "pending" ? "Chờ giao" :
                                 r.status === "assigned" ? `Chờ thu gom` :
                                 r.assignedTo ?? "—"}
                              </span>
                              <span className="text-gray-300 font-bold">→</span>
                              <span className={`rounded-full px-2 py-0.5 font-semibold ${
                                r.status === "done" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                              }`}>Xong</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Household list — TOP */}
              {(() => {
                const wardHouseholds = HOUSEHOLDS.filter(h => h.wardId === area.id);
                if (wardHouseholds.length === 0) return null;
                return (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Danh sách hộ dân ({wardHouseholds.length} hộ)
                    </p>
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-gray-50">
                            <tr>
                              <th className="text-left px-3 py-2 text-gray-500 font-semibold">Hộ dân</th>
                              <th className="text-left px-3 py-2 text-gray-500 font-semibold">Địa chỉ</th>
                              <th className="text-right px-3 py-2 text-gray-500 font-semibold">Rác (kg)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {wardHouseholds
                              .sort((a, b) => b.waste - a.waste)
                              .map((hh) => {
                                const statusCfgHH = STATUS_LABEL[hh.status];
                                return (
                                  <tr key={hh.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-3 py-2">
                                      <p className="text-gray-700 font-medium">{hh.name}</p>
                                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${statusCfgHH.bg} ${statusCfgHH.text}`}>
                                        {statusCfgHH.label === "Critical" ? "Cao" : statusCfgHH.label === "Moderate" ? "TB" : "Thấp"}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-[10px] text-gray-400">{hh.address}</td>
                                    <td className="px-3 py-2 text-right font-bold text-gray-900">{hh.waste.toLocaleString()}</td>
                                  </tr>
                                );
                              })
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Số dân",
                    value: area.population.toLocaleString(),
                    accent: "text-blue-700",
                    sub: area.district,
                  },
                  {
                    label: "Tổng rác thải",
                    value: `${area.totalWaste.toLocaleString()} kg`,
                    accent: "text-red-600",
                    sub: "kg/ngày",
                  },
                  {
                    label: "Tỷ lệ nhựa",
                    value: `${detail.plasticRatio}%`,
                    accent: "text-violet-600",
                    sub: "trong tổng rác",
                  },
                  {
                    label: "Báo cáo chờ",
                    value: localReports.filter(r => r.wardName === area.name && r.status === "pending").length,
                    accent: "text-amber-600",
                    sub: `/ ${localReports.filter(r => r.wardName === area.name).length} tổng`,
                  },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.accent}`}>{stat.value}</p>
                    {stat.sub && <p className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</p>}
                  </div>
                ))}
              </div>

              {/* Chart 1: Waste Trend (Last 7 Days) */}
              <ChartCard title="Xu hướng rác thải – 7 ngày gần nhất">
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={detail.wasteTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 8,
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="waste"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#6366f1" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Chart 2: Plastic Usage by Month */}
              <ChartCard title="Sử dụng nhựa theo tháng (kg)">
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={detail.plasticByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 8,
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="plastic"
                      fill="#818cf8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>


              {/* Chart 4: Waste Emission Trend */}
              <ChartCard title="Xu hướng phát thải CO₂ (tấn)">
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={detail.emissionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 8,
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <defs>
                      <linearGradient id="emissionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="emission"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fill="url(#emissionGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              Chọn một phường trên bản đồ
            </div>
          )}
        </div>

        {/* ── Report Detail Panel (slides in over the drawer content) ── */}
        <div
          className={`absolute inset-0 z-10 bg-white rounded-2xl flex flex-col transition-transform duration-300 ease-out ${
            selectedReport ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedReport && (() => {
            const sc = REPORT_STATUS_CFG[selectedReport.status];
            const t  = new Date(selectedReport.reportedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
            const resolvedT = selectedReport.resolvedAt
              ? new Date(selectedReport.resolvedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
              : null;
            const WASTE_TYPE_LABEL: Record<string, string> = {
              mixed: "Hỗn hợp", plastic: "Nhựa", organic: "Hữu cơ", hazardous: "Nguy hại",
            };
            return (
              <>
                {/* Detail header */}
                <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
                  <button
                    onClick={() => { setSelectedReportId(null); setSelectedCollectorId(null); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 3L5 8l5 5" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{selectedReport.id}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} shrink-0`}>
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">{selectedReport.wardName}</p>
                  </div>
                </div>

                {/* Detail content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                  {/* Success flash */}
                  {assignedFlash && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <p className="text-xs font-semibold text-emerald-700">Đã giao cho người thu gom thành công!</p>
                    </div>
                  )}

                  {/* Household info */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Thông tin hộ dân</p>
                    <p className="text-sm font-bold text-gray-800">{selectedReport.householdName}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-400">Loại rác</p>
                        <p className="font-semibold text-gray-700">{WASTE_TYPE_LABEL[selectedReport.wasteType] ?? selectedReport.wasteType}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Báo cáo lúc</p>
                        <p className="font-semibold text-gray-700">{t}</p>
                      </div>
                      {resolvedT && (
                        <div>
                          <p className="text-gray-400">Hoàn thành lúc</p>
                          <p className="font-semibold text-emerald-600">{resolvedT}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Mô tả</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{selectedReport.description}</p>
                  </div>

                  {/* Pipeline status */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Tiến trình xử lý</p>
                    <div className="flex items-center gap-2 text-[11px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="bg-indigo-100 text-indigo-700 rounded-full px-3 py-1 font-semibold">Báo cáo</span>
                        <span className="text-[9px] text-gray-400">{t}</span>
                      </div>
                      <span className="text-gray-300 font-bold text-lg flex-1 text-center">→</span>
                      <div className="flex flex-col items-center gap-1">
                        <span className={`rounded-full px-3 py-1 font-semibold ${
                          selectedReport.status !== "pending" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                        }`}>
                          {selectedReport.status === "pending" ? "Chờ giao" :
                           selectedReport.status === "assigned" ? "Chờ thu gom" :
                           selectedReport.assignedTo ?? "—"}
                        </span>
                        {selectedReport.assignedTo && (
                          <span className="text-[9px] text-gray-400">{selectedReport.assignedTo}</span>
                        )}
                      </div>
                      <span className="text-gray-300 font-bold text-lg flex-1 text-center">→</span>
                      <div className="flex flex-col items-center gap-1">
                        <span className={`rounded-full px-3 py-1 font-semibold ${
                          selectedReport.status === "done" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                        }`}>Xong</span>
                        {resolvedT && <span className="text-[9px] text-emerald-500">{resolvedT}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Assign section — only for pending reports */}
                  {selectedReport.status === "pending" && !assignedFlash && (
                    <div className="border border-dashed border-amber-300 bg-amber-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <p className="text-xs font-semibold text-amber-700">Gửi đến người thu gom</p>
                      </div>
                      <p className="text-[10px] text-amber-600">Chọn nhân viên phụ trách rồi xác nhận giao việc:</p>

                      {/* Collector list */}
                      <div className="space-y-2">
                        {collectors.map(c => (
                          <label
                            key={c.id}
                            className={`flex items-center gap-3 rounded-lg p-2.5 cursor-pointer border transition-all ${
                              selectedCollectorId === c.id
                                ? "border-blue-400 bg-blue-50"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="collector"
                              className="accent-blue-500"
                              checked={selectedCollectorId === c.id}
                              onChange={() => setSelectedCollectorId(c.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800">{c.name}</p>
                              <p className="text-[10px] text-gray-400">{c.phone} · Xe {c.vehicleId}</p>
                            </div>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              c.activeReports >= 5 ? "bg-red-50 text-red-500" :
                              c.activeReports >= 3 ? "bg-amber-50 text-amber-600" :
                              "bg-emerald-50 text-emerald-600"
                            }`}>
                              {c.activeReports} việc
                            </span>
                          </label>
                        ))}
                      </div>

                      <button
                        disabled={selectedCollectorId === null}
                        onClick={handleAssign}
                        className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          selectedCollectorId !== null
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Gửi đến người thu gom
                      </button>
                    </div>
                  )}

                  {/* Already assigned info */}
                  {selectedReport.status === "assigned" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-1">Người thu gom</p>
                      <p className="text-sm font-bold text-blue-700">{selectedReport.assignedTo}</p>
                      <p className="text-[10px] text-blue-400 mt-0.5">Đang trên đường thu gom</p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
    </div>
  );
}
