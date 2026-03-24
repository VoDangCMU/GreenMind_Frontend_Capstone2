"use client";

import { useState } from "react";
import type { WasteReport, ReportStatus, WasteType } from "@/types/monitoring";

interface ReportListProps {
  wasteReports: WasteReport[];
  loading: boolean;
  onReportClick: (report: WasteReport) => void;
  selectedArea: string | null;
}

const STATUS_CFG: Record<ReportStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending:  { label: "Chờ xử lý",    bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400"     },
  assigned: { label: "Đang thu gom", bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400"    },
  done:     { label: "Hoàn thành",   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
};

const WASTE_TYPE_CFG: Record<WasteType, { label: string }> = {
  plastic:   { label: "Nhựa"    },
  organic:   { label: "Hữu cơ"  },
  mixed:     { label: "Hỗn hợp" },
  hazardous: { label: "Nguy hại"},
};

const FILTERS: { label: string; value: ReportStatus | "all" }[] = [
  { label: "Tất cả",     value: "all"      },
  { label: "Chờ",        value: "pending"  },
  { label: "Đang thu",   value: "assigned" },
  { label: "Xong",       value: "done"     },
];

export function ReportList({ wasteReports, loading, onReportClick, selectedArea }: ReportListProps) {
  const [filter, setFilter] = useState<ReportStatus | "all">("all");

  const filtered = filter === "all" ? wasteReports : wasteReports.filter(r => r.status === filter);

  const pendingCount  = wasteReports.filter(r => r.status === "pending").length;
  const assignedCount = wasteReports.filter(r => r.status === "assigned").length;
  const doneCount     = wasteReports.filter(r => r.status === "done").length;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-800 tracking-tight">Báo cáo rác thải</h2>
            <p className="text-xs text-gray-400 mt-0.5">{wasteReports.length} báo cáo hôm nay</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Chờ xử lý", count: pendingCount, color: "text-red-600", bg: "bg-red-50" },
            { label: "Đang thu",  count: assignedCount,  color: "text-blue-600",  bg: "bg-blue-50" },
            { label: "Xong",      count: doneCount,   color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-lg px-2 py-1.5 text-center`}>
              <p className={`text-base font-bold ${s.color}`}>{s.count}</p>
              <p className="text-[10px] text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all duration-150 ${
                filter === f.value ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-2 bg-gray-100 rounded w-full" />
                <div className="h-2 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">
            Không có báo cáo
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(report => {
              const scfg   = STATUS_CFG[report.status];
              const wtcfg  = WASTE_TYPE_CFG[report.wasteType];
              const isHL   = selectedArea === report.wardName;
              const time   = new Date(report.reportedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

              return (
                <button
                  key={report.id}
                  onClick={() => onReportClick(report)}
                  className={`w-full text-left px-4 py-3.5 transition-all duration-150 hover:bg-gray-50 group ${
                    isHL ? "bg-indigo-50 border-l-2 border-indigo-400" : ""
                  }`}
                >
                  {/* Row 1: status badge + time */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${scfg.bg} ${scfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${scfg.dot} ${report.status === "pending" ? "animate-pulse" : ""}`} />
                      {scfg.label}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">{time}</span>
                  </div>

                  {/* Row 2: ward + waste type */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs font-semibold text-gray-800">{report.wardName}</p>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{report.wasteKg} kg · {wtcfg.label}</span>
                  </div>

                  {/* Row 3: household name */}
                  <p className="text-[11px] text-gray-500 mb-0.5 truncate">{report.householdName}</p>

                  {/* Row 4: description */}
                  <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-1">{report.description}</p>

                  {/* Pipeline mini-timeline */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {/* Step 1 */}
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      </span>
                      <span className="text-[9px] text-gray-400">Báo cáo</span>
                    </div>
                    <div className={`h-px flex-1 min-w-[14px] max-w-[20px] ${report.status !== "pending" ? "bg-blue-300" : "bg-gray-200"}`} />
                    {/* Step 2 */}
                    <div className="flex items-center gap-1">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${report.status !== "pending" ? "bg-blue-100" : "bg-gray-100"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${report.status !== "pending" ? "bg-blue-400" : "bg-gray-300"}`} />
                      </span>
                      <span className={`text-[9px] ${report.status !== "pending" ? "text-blue-600 font-semibold" : "text-gray-300"}`}>
                        {report.assignedTo ? report.assignedTo.split(" ").pop() : "Chờ giao"}
                      </span>
                    </div>
                    <div className={`h-px flex-1 min-w-[14px] max-w-[20px] ${report.status === "done" ? "bg-emerald-300" : "bg-gray-200"}`} />
                    {/* Step 3 */}
                    <div className="flex items-center gap-1">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${report.status === "done" ? "bg-emerald-100" : "bg-gray-100"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${report.status === "done" ? "bg-emerald-400" : "bg-gray-300"}`} />
                      </span>
                      <span className={`text-[9px] ${report.status === "done" ? "text-emerald-600 font-semibold" : "text-gray-300"}`}>Xong</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
