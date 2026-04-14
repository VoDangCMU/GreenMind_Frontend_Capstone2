import { useState } from "react";
import type { WasteReport, ReportStatus, WasteType, UrbanArea } from "@/types/waste-report";

interface ReportListProps {
  wasteReports: WasteReport[];
  loading?: boolean;
  onReportClick: (report: WasteReport) => void;
  onCreateCampaign?: (report: WasteReport) => void;
  selectedArea: UrbanArea | null;
}

const STATUS_CFG: Record<ReportStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
  pending:  { label: "Chờ xử lý",  bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400",     border: "border-red-200" },
  approved: { label: "Đã duyệt",   bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400",    border: "border-blue-200" },
  done:     { label: "Hoàn thành", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", border: "border-emerald-200" },
};

const WASTE_TYPE_CFG: Record<WasteType, { label: string; color: string }> = {
  plastic:   { label: "Nhựa",     color: "text-blue-600 bg-blue-50" },
  organic:   { label: "Hữu cơ",   color: "text-emerald-600 bg-emerald-50" },
  mixed:     { label: "Hỗn hợp",  color: "text-amber-600 bg-amber-50" },
  hazardous: { label: "Nguy hại", color: "text-red-600 bg-red-50" },
};

type FilterMode = "no-campaign" | "approved" | "all";

const FILTERS: { label: string; value: FilterMode }[] = [
  { label: "Chờ tạo chiến dịch", value: "no-campaign" },
  { label: "Đã được duyệt",       value: "approved" },
  { label: "Tất cả báo cáo",      value: "all" },
];

// ─── Detail Modal ────────────────────────────────────────────────────────────
export function ReportDetailModal({
  report,
  onClose,
  onCreateCampaign,
}: {
  report: WasteReport;
  onClose: () => void;
  onCreateCampaign?: (report: WasteReport) => void;
}) {
  const scfg  = STATUS_CFG[report.status] ?? STATUS_CFG["pending"];
  const wtcfg = WASTE_TYPE_CFG[report.wasteType] ?? { label: report.wasteType, color: "text-gray-500 bg-gray-50" };

  const reportedTime = (() => {
    try { return new Date(report.createdAt).toLocaleString("vi-VN"); } catch { return "N/A"; }
  })();
  const resolvedTime = report.resolvedAt ? (() => {
    try { return new Date(report.resolvedAt!).toLocaleString("vi-VN"); } catch { return "N/A"; }
  })() : null;

  const hasAiImages = !!(report.segmentedImageUrl || report.depthImageUrl || report.heatmapUrl);
  const hasAiData   = report.pollutionScore != null || report.pollutionLevel || report.segmentRatio != null;

  const reporterName = typeof report.reportedBy === "string" ? report.reportedBy : report.reportedBy?.fullName || report.reportedByName || "Lê Quang Huy";

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3 md:p-5"
      onClick={onClose}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal card — wide enough for 2-col layout */}
      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="shrink-0 bg-white border-b border-gray-100 px-8 pt-6 pb-5 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-sm font-mono text-gray-400 bg-gray-50 px-3 py-1 rounded-md">
                {report.code || report.id.slice(0, 8).toUpperCase()}
              </span>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${scfg.bg} ${scfg.text}`}>
                <span className={`w-2 h-2 rounded-full ${scfg.dot} ${report.status === "pending" ? "animate-pulse" : ""}`} />
                {scfg.label}
              </span>
              <span className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-full ${wtcfg.color}`}>
                {wtcfg.label}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{report.wardName}</h3>
            {(report.lat !== 0 || report.lng !== 0) && (
              <p className="text-sm text-gray-400 font-mono mt-1">
                📍 {report.lat.toFixed(6)}, {report.lng.toFixed(6)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        </div>

        {/* ── Body — scrollable ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

            {/* ═══ LEFT COLUMN: Images ═══ */}
            <div className="p-6 space-y-5">

              {/* Main report image */}
              {report.imageUrl ? (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ảnh báo cáo</p>
                  <img
                    src={report.imageUrl}
                    alt="Ảnh báo cáo rác"
                    className="w-full rounded-xl object-cover max-h-80 border border-gray-100 shadow-sm bg-gray-50"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">Không có ảnh báo cáo</p>
                </div>
              )}

              {/* Evidence image (after collection) */}
              {report.status === "done" && report.imageEvidenceUrl && (
                <div>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
                    Ảnh sau khi thu gom
                  </p>
                  <img
                    src={report.imageEvidenceUrl}
                    alt="Ảnh bằng chứng thu gom"
                    className="w-full rounded-xl object-cover max-h-64 border border-emerald-100 shadow-sm bg-emerald-50/20"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}

              {/* AI-generated images */}
              {hasAiImages && (
                <div>
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>✨</span> Ảnh phân tích AI
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {report.segmentedImageUrl && (
                      <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                        <p className="text-xs text-gray-500 font-semibold text-center mb-1">Phân vùng</p>
                        <img
                          src={report.segmentedImageUrl}
                          alt="Segment mask"
                          className="w-full aspect-square object-cover rounded-md bg-black/5"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                    {report.depthImageUrl && (
                      <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                        <p className="text-xs text-gray-500 font-semibold text-center mb-1">Độ sâu</p>
                        <img
                          src={report.depthImageUrl}
                          alt="Depth map"
                          className="w-full aspect-square object-cover rounded-md bg-black/5"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                    {report.heatmapUrl && (
                      <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                        <p className="text-xs text-gray-500 font-semibold text-center mb-1">Nhiệt độ</p>
                        <img
                          src={report.heatmapUrl}
                          alt="Heatmap"
                          className="w-full aspect-square object-cover rounded-md bg-black/5"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ═══ RIGHT COLUMN: Info ═══ */}
            <div className="p-6 space-y-4">

              {/* Description */}
              {report.description && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mô tả</p>
                  <p className="text-base text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
                    {report.description}
                  </p>
                </div>
              )}

              {/* AI Analysis data */}
              {hasAiData && (
                <div className="bg-indigo-50/60 rounded-xl p-5 border border-indigo-100/60">
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <span>✨</span> Phân tích AI
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {report.pollutionScore != null && (
                      <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                        <p className="text-sm text-gray-400 mb-1">Điểm ô nhiễm</p>
                        <p className="text-3xl font-black text-indigo-600 leading-none">
                          {(Number(report.pollutionScore) * 10).toFixed(1)}
                          <span className="text-sm text-indigo-300 font-bold"> /10</span>
                        </p>
                      </div>
                    )}
                    {report.pollutionLevel && (
                      <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                        <p className="text-sm text-gray-400 mb-1">Mức độ ô nhiễm</p>
                        <p className="text-base font-bold text-red-600 capitalize">{report.pollutionLevel}</p>
                      </div>
                    )}
                    {report.segmentRatio != null && (
                      <div className="col-span-2 bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                        <p className="text-sm text-gray-400 mb-1">Tỷ lệ thành phần rác (segment ratio)</p>
                        <p className="text-base font-bold text-indigo-700 font-mono">
                          {(Number(report.segmentRatio) * 100).toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reporter */}
                <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Người báo cáo</p>
                    <p className="text-base font-semibold text-slate-800">{reporterName}</p>
                  </div>
                </div>

              {/* Timeline */}
              <div className="rounded-xl border border-gray-100 p-5 bg-white">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Thời gian</p>
                <div className="relative pl-6 border-l-2 border-gray-100 space-y-5">
                  <div className="relative">
                    <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[19px] top-1 ring-4 ring-indigo-50" />
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Báo cáo lúc</p>
                    <p className="text-sm font-semibold text-gray-700">{reportedTime}</p>
                  </div>
                  {resolvedTime && (
                    <div className="relative">
                      <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[19px] top-1 ring-4 ring-emerald-50" />
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Hoàn thành lúc</p>
                      <p className="text-sm font-semibold text-emerald-700">{resolvedTime}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Campaign */}
              {report.campaignId && (
                <div className="flex items-center gap-4 bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-xl">
                    🏕️
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-amber-500 font-medium mb-0.5">Thuộc chiến dịch</p>
                    <p className="text-sm font-mono text-amber-700 break-all">{report.campaignId}</p>
                  </div>
                </div>
              )}

              {/* All raw fields table */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin chi tiết</p>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { label: "Mã báo cáo", value: report.code || "—" },
                      { label: "Phường / Xã", value: report.wardName },
                      { label: "Loại rác", value: wtcfg.label },
                      { label: "Trạng thái", value: scfg.label },
                      { label: "Tọa độ", value: `${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}` },
                      { label: "Người báo cáo", value: reporterName },
                      { label: "Ngày tạo", value: reportedTime },
                      { label: "Ngày xong", value: resolvedTime || "—" },
                      { label: "Pollution Score", value: report.pollutionScore != null ? (report.pollutionScore * 10).toFixed(4) : "—" },
                      { label: "Pollution Level", value: report.pollutionLevel || "—" },
                      { label: "Segment Ratio", value: report.segmentRatio != null ? (report.segmentRatio * 100).toFixed(2) + "%" : "—" },
                    ].map(({ label, value }) => (
                      <tr key={label} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-gray-500 font-medium whitespace-nowrap w-48">{label}</td>
                        <td className="px-5 py-3 text-gray-800 font-mono break-all">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Sticky footer: Nút tạo chiến dịch ── */}
          {report.status === "pending" && !report.campaignId && onCreateCampaign && (
            <div className="shrink-0 bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-indigo-100 px-8 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-indigo-800">Báo cáo này có mức ô nhiễm cao</p>
                <p className="text-xs text-indigo-400 mt-0.5">Tạo chiến dịch thu gom để xử lý khu vực này</p>
              </div>
              <button
                onClick={() => { onCreateCampaign(report); onClose(); }}
                className="flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all whitespace-nowrap"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                Tạo chiến dịch
              </button>
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
  loading,
  onReportClick,
  onCreateCampaign,
  selectedArea,
}: ReportListProps) {
  const [filter, setFilter]             = useState<FilterMode>("no-campaign");
  const [detailReport, setDetailReport] = useState<WasteReport | null>(null);

  // Báo cáo chờ tạo chiến dịch: pending, chưa có campaign, pollutionScore > 0.2
  // Sắp xếp từ cao → thấp theo pollutionScore
  const noCampaignReports = wasteReports
    .filter(r => r.status === "pending" && !r.campaignId && (r.pollutionScore ?? 0) > 0.2)
    .sort((a, b) => (b.pollutionScore ?? 0) - (a.pollutionScore ?? 0));

  // Báo cáo đã được duyệt (có chiến dịch)
  const approvedReports = wasteReports
    .filter(r => r.status === "approved")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered =
    filter === "no-campaign" ? noCampaignReports :
    filter === "approved"    ? approvedReports :
    wasteReports;

  const noCampaignCount = noCampaignReports.length;
  const approvedCount   = approvedReports.length;
  const totalCount      = wasteReports.length;

  const handleBoxClick = (report: WasteReport) => {
    setDetailReport(report);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Panel header */}
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800">Báo cáo rác</h2>
            <span className="text-xs text-gray-400">{wasteReports.length} báo cáo</span>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div
              onClick={() => setFilter("no-campaign")}
              className={`rounded-lg px-2 py-1.5 text-center cursor-pointer transition-all ${
                filter === "no-campaign" ? "bg-red-100 ring-2 ring-red-300" : "bg-red-50 hover:bg-red-100"
              }`}
            >
              <p className="text-base font-bold text-red-600">{noCampaignCount}</p>
              <p className="text-[10px] text-red-500/70 leading-tight">Chờ chiến dịch</p>
            </div>
            <div
              onClick={() => setFilter("approved")}
              className={`rounded-lg px-2 py-1.5 text-center cursor-pointer transition-all ${
                filter === "approved" ? "bg-blue-100 ring-2 ring-blue-300" : "bg-blue-50 hover:bg-blue-100"
              }`}
            >
              <p className="text-base font-bold text-blue-600">{approvedCount}</p>
              <p className="text-[10px] text-blue-500/70 leading-tight">Đã duyệt</p>
            </div>
            <div
              onClick={() => setFilter("all")}
              className={`rounded-lg px-2 py-1.5 text-center cursor-pointer transition-all ${
                filter === "all" ? "bg-gray-200 ring-2 ring-gray-400" : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <p className="text-base font-bold text-gray-700">{totalCount}</p>
              <p className="text-[10px] text-gray-500 leading-tight">Tất cả</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 pb-1">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all duration-150 whitespace-nowrap ${
                  filter === f.value ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {filter === "no-campaign" && (
            <div className="mt-2.5 bg-indigo-50/80 border border-indigo-100 p-2.5 rounded-lg flex items-start gap-2.5">
              <div className="text-indigo-500 mt-0.5 shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              </div>
              <p className="text-[11px] font-medium text-indigo-800 leading-relaxed">
                Đây là các khu vực có mức độ ô nhiễm cao, <strong className="font-bold">cần được ưu tiên tạo chiến dịch thu gom</strong> sớm nhất có thể.
              </p>
            </div>
          )}
          {filter === "approved" && (
            <div className="mt-2.5 bg-blue-50/80 border border-blue-100 p-2.5 rounded-lg flex items-start gap-2.5">
              <div className="text-blue-500 mt-0.5 shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <p className="text-[11px] font-medium text-blue-800 leading-relaxed">
                Các báo cáo đã được <strong className="font-bold">phê duyệt và gán vào chiến dịch</strong>. Đang chờ thu gom thực tế.
              </p>
            </div>
          )}
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
                const scfg  = STATUS_CFG[report.status] ?? STATUS_CFG["pending"];
                const wtcfg = WASTE_TYPE_CFG[report.wasteType] ?? { label: report.wasteType, color: "text-gray-500 bg-gray-50" };
                const isHL  = selectedArea?.name === report.wardName;

                let time = "N/A";
                try { time = new Date(report.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); } catch {}

                return (
                  <div key={report.id} className="w-full text-left">
                    <button
                      onClick={() => handleBoxClick(report)}
                      className={`w-full text-left px-4 py-3.5 transition-all duration-150 hover:bg-gray-50 group block ${
                        isHL ? "bg-indigo-50 border-l-2 border-indigo-400" : ""
                      }`}
                    >
                      {/* Row 1: status + time */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${scfg.bg} ${scfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${scfg.dot} ${report.status === "pending" ? "animate-pulse" : ""}`} />
                          {scfg.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-gray-300 group-hover:text-gray-400 transition-colors hidden group-hover:inline">
                            Xem chi tiết →
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">{time}</span>
                        </div>
                      </div>

                      {/* Row 2: ward + waste type */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-semibold text-gray-800">{report.wardName}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${wtcfg.color}`}>
                          {wtcfg.label}
                        </span>
                      </div>

                      {/* Row 3: reporter */}
                      {report.reportedByName && (
                        <p className="text-[11px] text-gray-500 mb-0.5 truncate">{report.reportedByName}</p>
                      )}

                      {/* Row 4: description */}
                      {report.description && (
                        <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-1">{report.description}</p>
                      )}
                    </button>
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
          onCreateCampaign={onCreateCampaign}
        />
      )}
    </>
  );
}