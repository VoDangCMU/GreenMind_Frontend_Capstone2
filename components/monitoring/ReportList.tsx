"use client";

import { useState } from "react";
import type { Report, ReportStatus } from "@/types/monitoring";

interface ReportListProps {
  reports: Report[];
  loading: boolean;
  onReportClick: (areaName: string) => void;
  selectedArea: string | null;
}

const statusConfig: Record<
  ReportStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  assigned: {
    label: "Assigned",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-400",
  },
  done: {
    label: "Done",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-400",
  },
};

const FILTERS: { label: string; value: ReportStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Assigned", value: "assigned" },
  { label: "Done", value: "done" },
];

export function ReportList({
  reports,
  loading,
  onReportClick,
  selectedArea,
}: ReportListProps) {
  const [filter, setFilter] = useState<ReportStatus | "all">("all");

  const filtered =
    filter === "all" ? reports : reports.filter((r) => r.status === filter);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-800 tracking-tight">
              Citizen Reports
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {reports.length} total today
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
            Live
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-3">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all duration-150 ${
                filter === f.value
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100"
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
            No reports found
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((report) => {
              const cfg = statusConfig[report.status];
              const isHighlighted = selectedArea === report.area;
              return (
                <button
                  key={report.id}
                  onClick={() => onReportClick(report.area)}
                  className={`w-full text-left px-5 py-4 transition-all duration-150 hover:bg-gray-50 group ${
                    isHighlighted ? "bg-indigo-50 border-l-2 border-indigo-400" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                        />
                        {cfg.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                      {report.time}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">
                    {report.area}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {report.desc}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
