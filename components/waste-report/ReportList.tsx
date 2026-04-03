import { useState } from "react";
import type { WasteReport, ReportStatus, WasteType, Collector, UrbanArea } from "@/types/waste-report";

interface ReportListProps {
  wasteReports: WasteReport[];
  collectors: Collector[];
  loading?: boolean;
  onReportClick: (report: WasteReport) => void;
  onAssign: (reportId: string, collectorId: string) => void;
  selectedArea: UrbanArea | null;
}

const STATUS_CFG: Record<ReportStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
  pending:  { label: "Chờ xử lý",   bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400",     border: "border-red-200" },
  assigned: { label: "Đang thu gom", bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400",    border: "border-blue-200" },
  done:     { label: "Hoàn thành",   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", border: "border-emerald-200" },
};

const WASTE_TYPE_CFG: Record<WasteType, { label: string; color: string }> = {
  plastic:   { label: "Nhựa",     color: "text-blue-600 bg-blue-50" },
  organic:   { label: "Hữu cơ",   color: "text-emerald-600 bg-emerald-50" },
  mixed:     { label: "Hỗn hợp",  color: "text-amber-600 bg-amber-50" },
  hazardous: { label: "Nguy hại", color: "text-red-600 bg-red-50" },
};

const FILTERS: { label: string; value: ReportStatus | "all" }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ",    value: "pending" },
  { label: "Đang thu", value: "assigned" },
  { label: "Xong",   value: "done" },
];

// ─── Detail Modal ────────────────────────────────────────────────────────────
export function ReportDetailModal({
  report,
  onClose,
}: {
  report: WasteReport;
  onClose: () => void;
}) {
  const scfg  = STATUS_CFG[report.status];
  const wtcfg = WASTE_TYPE_CFG[report.wasteType] ?? { label: report.wasteType, color: "text-gray-500 bg-gray-50" };

  const reportedTime = (() => {
    try { return new Date(report.reportedAt).toLocaleString("vi-VN"); } catch { return "N/A"; }
  })();
  const resolvedTime = report.resolvedAt ? (() => {
    try { return new Date(report.resolvedAt!).toLocaleString("vi-VN"); } catch { return "N/A"; }
  })() : null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 pt-5 pb-4 rounded-t-2xl z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5 font-mono">{report.code || report.id.slice(0, 8).toUpperCase()}</p>
              <h3 className="text-base font-bold text-gray-900 leading-tight">{report.wardName}</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${scfg.bg} ${scfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${scfg.dot} ${report.status === "pending" ? "animate-pulse" : ""}`} />
                {scfg.label}
              </span>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* ── Ảnh báo cáo ── */}
          {report.imageUrl && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Ảnh báo cáo</p>
              <img
                src={report.imageUrl}
                alt="Ảnh báo cáo rác"
                className="w-full rounded-xl object-cover max-h-52 border border-gray-100 shadow-sm"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {/* ── Ảnh bằng chứng (sau khi thu gom) ── */}
          {report.status === "done" && report.imageEvidenceUrl && (
            <div>
              <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span>✓</span> Ảnh bằng chứng sau thu gom
              </p>
              <img
                src={report.imageEvidenceUrl}
                alt="Ảnh bằng chứng thu gom"
                className="w-full rounded-xl object-cover max-h-52 border border-emerald-100 shadow-sm"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {/* ── Thông tin cơ bản ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-0.5">Loại rác</p>
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${wtcfg.color}`}>
                {wtcfg.label}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-0.5">Khối lượng</p>
              <p className="text-sm font-bold text-gray-800">{report.wasteKg.toLocaleString()} kg</p>
            </div>
          </div>

          {/* ── Mô tả ── */}
          {report.description && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-1">Mô tả</p>
              <p className="text-xs text-gray-700 leading-relaxed">{report.description}</p>
            </div>
          )}

          {/* ── Người báo cáo ── */}
          <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-indigo-400">Người báo cáo</p>
              <p className="text-xs font-semibold text-indigo-800 truncate">{report.householdName}</p>
            </div>
          </div>

          {/* ── Người thu gom (nếu có) ── */}
          {report.assignedTo && (
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 00-8 0v2" /><circle cx="12" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-blue-400">Nhân viên thu gom</p>
                <p className="text-xs font-semibold text-blue-800 truncate">{report.assignedTo}</p>
              </div>
            </div>
          )}

          {/* ── Timeline ── */}
          <div className="border border-gray-100 rounded-xl p-3 space-y-2.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Thời gian</p>
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Báo cáo lúc</p>
                <p className="text-xs font-medium text-gray-700">{reportedTime}</p>
              </div>
            </div>
            {resolvedTime && (
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Hoàn thành lúc</p>
                  <p className="text-xs font-medium text-gray-700">{resolvedTime}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Tọa độ ── */}
          {(report.lat !== 0 || report.lng !== 0) && (
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span>📍</span>
              <span>{report.lat.toFixed(6)}, {report.lng.toFixed(6)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ReportList({
  wasteReports,
  collectors,
  loading,
  onReportClick,
  onAssign,
  selectedArea,
}: ReportListProps) {
  const [filter, setFilter]               = useState<ReportStatus | "all">("all");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [selectedCollectorId, setSelectedCollectorId] = useState<string | null>(null);
  const [detailReport, setDetailReport]   = useState<WasteReport | null>(null);

  const filtered = filter === "all" ? wasteReports : wasteReports.filter(r => r.status === filter);

  const pendingCount  = wasteReports.filter(r => r.status === "pending").length;
  const assignedCount = wasteReports.filter(r => r.status === "assigned").length;
  const doneCount     = wasteReports.filter(r => r.status === "done").length;

  const handleAssign = (reportId: string) => {
    if (selectedCollectorId === null) return;
    onAssign(reportId, selectedCollectorId);
    setExpandedReportId(null);
    setSelectedCollectorId(null);
  };

  const handleBoxClick = (report: WasteReport) => {
    if (report.status === "pending") {
      // pending → mở collector assignment inline (giữ nguyên)
      setExpandedReportId(expandedReportId === report.id ? null : report.id);
      setSelectedCollectorId(null);
    } else {
      // assigned / done → mở modal chi tiết
      setDetailReport(report);
      onReportClick(report);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-50 shrink-0">
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
              { label: "Chờ xử lý", count: pendingCount,  color: "text-red-600",     bg: "bg-red-50" },
              { label: "Đang thu",  count: assignedCount, color: "text-blue-600",    bg: "bg-blue-50" },
              { label: "Xong",      count: doneCount,     color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-lg px-2 py-1.5 text-center`}>
                <p className={`text-base font-bold ${s.color}`}>{s.count}</p>
                <p className="text-[10px] text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setExpandedReportId(null); }}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all duration-150 whitespace-nowrap ${
                  filter === f.value ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0">
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
                const scfg  = STATUS_CFG[report.status] ?? { label: "Không xác định", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400", border: "border-gray-200" };
                const wtcfg = WASTE_TYPE_CFG[report.wasteType] ?? { label: "Không xác định", color: "text-gray-500 bg-gray-50" };
                const isHL       = selectedArea?.name === report.wardName;
                const isExpanded = expandedReportId === report.id;
                const isClickable = report.status !== "pending";

                let time = "N/A";
                try { time = new Date(report.reportedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); } catch {}

                return (
                  <div key={report.id} className="w-full text-left">
                    <button
                      onClick={() => handleBoxClick(report)}
                      className={`w-full text-left px-4 py-3.5 transition-all duration-150 hover:bg-gray-50 group block ${
                        isHL || isExpanded ? "bg-indigo-50 border-l-2 border-indigo-400" : ""
                      }`}
                    >
                      {/* Row 1: status + time + click hint */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${scfg.bg} ${scfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${scfg.dot} ${report.status === "pending" ? "animate-pulse" : ""}`} />
                          {scfg.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isClickable && (
                            <span className="text-[9px] text-gray-300 group-hover:text-gray-400 transition-colors hidden group-hover:inline">
                              Xem chi tiết →
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">{time}</span>
                        </div>
                      </div>

                      {/* Row 2: ward + waste type */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-semibold text-gray-800">{report.wardName}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${wtcfg.color}`}>
                          {report.wasteKg} kg · {wtcfg.label}
                        </span>
                      </div>

                      {/* Row 3: reporter */}
                      <p className="text-[11px] text-gray-500 mb-0.5 truncate">{report.householdName}</p>

                      {/* Row 4: description */}
                      <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-1">{report.description}</p>
                    </button>

                    {/* Expanded: Collector Assignment (pending only) */}
                    {isExpanded && report.status === "pending" && (
                      <div className="px-4 py-3 bg-amber-50/50 border-t border-b border-indigo-100">
                        <p className="text-xs font-semibold text-amber-700 mb-2">Giao cho nhân viên thu gom:</p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto mb-3 pr-1">
                          {collectors.map((c) => (
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
                                name={`collector-${report.id}`}
                                className="accent-blue-500 shrink-0"
                                checked={selectedCollectorId === c.id}
                                onChange={() => setSelectedCollectorId(c.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{c.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{c.phone}</p>
                              </div>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                                c.activeReports >= 5 ? "bg-red-50 text-red-500" :
                                c.activeReports >= 3 ? "bg-amber-50 text-amber-600" :
                                "bg-emerald-50 text-emerald-600"
                              }`}>
                                {c.activeReports} <span className="hidden sm:inline">việc</span>
                              </span>
                            </label>
                          ))}
                        </div>
                        <button
                          disabled={selectedCollectorId === null}
                          onClick={() => handleAssign(report.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-lg transition-colors"
                        >
                          Giao nhiệm vụ
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
        />
      )}
    </>
  );
}
