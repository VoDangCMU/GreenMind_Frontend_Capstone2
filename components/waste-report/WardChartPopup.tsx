"use client";

import { useMemo, useState, useEffect } from "react";
import { getAccessToken } from "@/lib/auth";
import { type WasteReport } from "@/types/waste-report";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface WardChartPopupProps {
  wardName: string;
  reports: WasteReport[];
  allReports?: WasteReport[];
  onClose?: () => void;
}

export function WardChartPopup({ wardName, reports, allReports, onClose }: WardChartPopupProps) {
  // Tính toán tóm tắt
  const stats = useMemo(() => {
    const wPending = reports.filter((r) => r.status === "pending").length;
    const wAssigned = reports.filter((r) => r.status === "assigned").length;
    const wDone = reports.filter((r) => r.status === "done").length;
    const wTotalKg = reports.reduce((s, r) => s + r.wasteKg, 0);
    const wTotal = reports.length;
    return { wPending, wAssigned, wDone, wTotalKg, wTotal };
  }, [reports]);

  const [globalReports, setGlobalReports] = useState<WasteReport[]>(allReports || []);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    async function fetchAllStatuses() {
      try {
        const token = getAccessToken();
        // Lấy dữ liệu mới nhất (số lượng lớn) để thống kê 100% biểu đồ không bị gò ép bởi status đang mở của user
        const res = await fetch("https://vodang-api.gauas.com/waste-monitoring?limit=2000", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const apiData = await res.json();
          const rawList = Array.isArray(apiData) ? apiData : (apiData?.data ?? []);
          const mapped = rawList.map((r: any) => ({
            id: r.id,
            wardName: r.wardName || "Không rõ",
            wasteKg: r.wasteKg || 0,
            reportedAt: r.createdAt || new Date().toISOString(),
            status: r.status || "pending",
          } as WasteReport));
          setGlobalReports(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch all statuses for chart", err);
      } finally {
        setLoadingChart(false);
      }
    }
    fetchAllStatuses();
  }, []);

  // Tìm top 10 phường có tổng số báo cáo nhiều nhất từ globalReports
  const top10Wards = useMemo(() => {
    if (!globalReports || globalReports.length === 0) return [wardName];
    const counts: Record<string, number> = {};
    globalReports.forEach(r => {
      counts[r.wardName] = (counts[r.wardName] || 0) + 1;
    });
    // Sắp xếp và lấy 10 phường cao nhất
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(e => e[0]);
    // Đảm bảo wardName hiện tại có trong mảng, hoặc bạn có thể giữ nguyên top 10
    return top;
  }, [allReports, wardName]);



  const [timeView, setTimeView] = useState<"day" | "month" | "year">("day");

  // Nhóm dự liệu cho biểu đồ theo ngày/tháng/năm
  const chartData = useMemo(() => {
    if (!globalReports || globalReports.length === 0) return [];
    const map = new Map<string, any>();

    globalReports.forEach((r) => {
      if (!top10Wards.includes(r.wardName)) return;

      try {
        const d = typeof r.reportedAt === "string" ? parseISO(r.reportedAt) : new Date(r.reportedAt);
        if (isNaN(d.getTime())) return;

        let key = "";
        let display = "";
        if (timeView === "day") {
          key = format(d, "yyyy-MM-dd");
          display = format(d, "dd/MM", { locale: vi });
        } else if (timeView === "month") {
          key = format(d, "yyyy-MM");
          display = format(d, "MM/yyyy", { locale: vi });
        } else {
          key = format(d, "yyyy");
          display = format(d, "yyyy");
        }

        if (!map.has(key)) {
          const initObj: any = { sortKey: key, displayDate: display };
          top10Wards.forEach(w => initObj[w] = 0);
          map.set(key, initObj);
        }

        map.get(key)[r.wardName] += 1;
      } catch (err) {
        // ignore invalid dates
      }
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Nếu chỉ có 1 data point, thêm 2 điểm ảo 2 bên để graph render cân bằng
    if (sorted.length === 1) {
      const centerD = parseISO(sorted[0].sortKey + (timeView === "month" ? "-01" : timeView === "year" ? "-01-01" : ""));
      const preD = new Date(centerD);
      const postD = new Date(centerD);

      if (timeView === "day") {
        preD.setDate(preD.getDate() - 1);
        postD.setDate(postD.getDate() + 1);
      } else if (timeView === "month") {
        preD.setMonth(preD.getMonth() - 1);
        postD.setMonth(postD.getMonth() + 1);
      } else {
        preD.setFullYear(preD.getFullYear() - 1);
        postD.setFullYear(postD.getFullYear() + 1);
      }

      const displayFormat = timeView === "day" ? "dd/MM" : timeView === "month" ? "MM/yyyy" : "yyyy";
      return [
        { sortKey: "00", displayDate: format(preD, displayFormat, { locale: vi }) },
        sorted[0],
        { sortKey: "ZZ", displayDate: format(postD, displayFormat, { locale: vi }) }
      ];
    }

    return sorted;
  }, [globalReports, top10Wards, timeView]);

  // Màu cố định cho tối đa 10 phường
  const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#fb923c", "#14b8a6", "#ec4899", "#8b5cf6", "#64748b"];

  const SortedTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));
    return (
      <div className="rounded-md border border-slate-200 bg-white p-2 shadow-lg z-[10000]">
        <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
        <div className="max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
          {sortedPayload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center gap-2 text-xs mb-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="w-24 truncate">{entry.name || entry.dataKey}</span>
              <span className="ml-auto font-semibold whitespace-nowrap">{entry.value?.toLocaleString()} báo cáo</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans flex flex-col w-full h-full">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <span className="text-base font-bold text-gray-900">{wardName}</span>
        {stats.wPending > 0 ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
            {stats.wPending} chờ xử lý
          </span>
        ) : stats.wTotal > 0 ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            OK
          </span>
        ) : (
          <span className="text-[10px] text-gray-400">Không có dữ liệu</span>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Stats Board */}
      {stats.wTotal > 0 ? (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-red-50 rounded-xl p-3 text-center flex flex-col justify-center">
            <div className="text-lg font-extrabold text-red-500 leading-tight">{stats.wPending}</div>
            <div className="text-xs text-gray-500 mt-1">Chờ xử lý</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center flex flex-col justify-center">
            <div className="text-lg font-extrabold text-blue-500 leading-tight">{stats.wAssigned}</div>
            <div className="text-xs text-gray-500 mt-1">Thu gom</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center flex flex-col justify-center">
            <div className="text-lg font-extrabold text-emerald-500 leading-tight">{stats.wDone}</div>
            <div className="text-xs text-gray-500 mt-1">Xong</div>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-gray-400 py-3 border-y border-gray-100 mb-4 text-center">
          Phường {wardName} hiện tại chưa có báo cáo rác nào được ghi nhận.
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-4 mt-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-slate-800">Top 10 Wards Trend</h3>
          <p className="text-xs text-slate-500">
            Biểu đồ top 10 phường có lượng báo cáo cao nhất trong toàn hệ thống.
          </p>
        </div>

        <div className="bg-gray-100/80 p-1 rounded-xl flex gap-1 shadow-inner border border-gray-200/50">
          {[
            { id: "day", label: "Ngày" },
            { id: "month", label: "Tháng" },
            { id: "year", label: "Năm" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeView(t.id as any)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${timeView === t.id
                ? "bg-white text-blue-600 shadow-sm border border-gray-200/60"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 border border-transparent"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full bg-white border border-gray-100 rounded-xl overflow-hidden -ml-2 pb-4 relative">
        {loadingChart && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <span className="text-xs text-gray-500 font-medium animate-pulse">Đang tải dữ liệu biểu đồ...</span>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 16, right: 30, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dx={-10}
              tickFormatter={(val) => `${val}`}
            />
            <RechartsTooltip content={<SortedTooltip />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: "15px", paddingLeft: "10px", maxHeight: "60px", overflowY: "auto" }}
              layout="horizontal"
            />

            {top10Wards.map((ward, idx) => (
              <Line
                key={ward}
                type="monotone"
                dataKey={ward}
                name={ward}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2, fill: "white", strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
}
