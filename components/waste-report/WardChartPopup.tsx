"use client";

import { useMemo, useState } from "react";
import { type WasteReport } from "@/types/waste-report";
import {
  ComposedChart,
  Bar,
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
  onClose?: () => void;
}

export function WardChartPopup({ wardName, reports, onClose }: WardChartPopupProps) {
  // Tính toán tóm tắt
  const stats = useMemo(() => {
    const wPending = reports.filter((r) => r.status === "pending").length;
    const wAssigned = reports.filter((r) => r.status === "assigned").length;
    const wDone = reports.filter((r) => r.status === "done").length;
    const wTotalKg = reports.reduce((s, r) => s + r.wasteKg, 0);
    const wTotal = reports.length;
    return { wPending, wAssigned, wDone, wTotalKg, wTotal };
  }, [reports]);

  const [timeView, setTimeView] = useState<"day" | "month" | "year">("day");

  // Nhóm dự liệu cho biểu đồ theo ngày/tháng/năm
  const chartData = useMemo(() => {
    if (reports.length === 0) return [];

    const map = new Map<string, { count: number; kg: number; sortKey: string; displayDate: string }>();

    reports.forEach((r) => {
      try {
        const d = typeof r.reportedAt === "string" ? parseISO(r.reportedAt) : new Date(r.reportedAt);
        // Fallback safely if date parsing fails
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

        const existing = map.get(key) || { count: 0, kg: 0, sortKey: key, displayDate: display };
        existing.count += 1;
        existing.kg += r.wasteKg;
        map.set(key, existing);
      } catch (err) {
        // ignore invalid dates
      }
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Nếu chỉ có 1 data point, thêm 2 điểm ảo 2 bên để graph render cân bằng
    if (sorted.length === 1) {
       // Thêm "-01" để đảm bảo parseISO xử lý đúng format nếu chỉ có "yyyy" hoặc "yyyy-MM"
       const centerD = parseISO(sorted[0].sortKey + (timeView==="month"?"-01":timeView==="year"?"-01-01":""));
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
          { count: 0, kg: 0, sortKey: "00", displayDate: format(preD, displayFormat, { locale: vi }) },
          sorted[0],
          { count: 0, kg: 0, sortKey: "ZZ", displayDate: format(postD, displayFormat, { locale: vi }) }
       ];
    }

    return sorted;
  }, [reports, timeView]);

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
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Stats Board */}
      {stats.wTotal > 0 ? (
        <>
          <div className="grid grid-cols-4 gap-3 mb-4">
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
            <div className="bg-violet-50 rounded-xl p-3 text-center flex flex-col justify-center">
              <div className="text-lg font-extrabold text-violet-500 leading-tight">{stats.wTotalKg}</div>
              <div className="text-xs text-gray-500 mt-1">Kg rác</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mb-4 mt-2">
            <div className="text-sm text-gray-400 flex items-center gap-1.5">
              <span>Tổng số {stats.wTotal} báo cáo</span>
              <span>·</span>
              <span className="font-medium text-gray-500">Biểu đồ rác thải</span>
            </div>
            
            <div className="bg-gray-100/80 p-1 rounded-xl flex gap-1 shadow-inner border border-gray-200/50">
              {[
                {id: "day", label: "Ngày"}, 
                {id: "month", label: "Tháng"}, 
                {id: "year", label: "Năm"}
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTimeView(t.id as any)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    timeView === t.id 
                      ? "bg-white text-blue-600 shadow-sm border border-gray-200/60" 
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 border border-transparent"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Container */}
          <div className="flex-1 min-h-[260px] w-full bg-white border border-gray-100 rounded-xl overflow-hidden -ml-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="sortKey"
                  scale="band"
                  tickFormatter={(val) => {
                    const item = chartData.find((d) => d.sortKey === val);
                    return item ? item.displayDate : val;
                  }}
                  tick={{ fontSize: 9, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                
                {/* Trục Y trái: Khối lượng (Bar) */}
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 9, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}kg`}
                />
                
                {/* Trục Y phải: Số lượng report (Line) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 9, fill: "#ef4444" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val} đơn`}
                />
                
                <RechartsTooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "11px", padding: "6px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  labelStyle={{ fontWeight: "bold", color: "#374151", marginBottom: "4px" }}
                  cursor={{ fill: "#f9fafb" }}
                />

                {/* Khối lượng (Bar) dùng trục trái */}
                <Bar 
                  yAxisId="left" 
                  dataKey="kg" 
                  name="Khối lượng (kg)" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />

                {/* Số lượng báo cáo (Line) dùng trục phải */}
                <Line
                  yAxisId="right"
                  type="linear"
                  dataKey="count"
                  name="Báo cáo"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#ef4444", strokeWidth: 1.5, stroke: "#fff" }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="text-[11px] text-gray-400 py-2 border-t border-gray-100">
          Không có báo cáo rác nào được ghi nhận tại đây.
        </div>
      )}
    </div>
  );
}
