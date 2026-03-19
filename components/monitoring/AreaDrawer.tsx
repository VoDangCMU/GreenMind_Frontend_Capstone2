"use client";

import { useEffect, useRef } from "react";
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
import type { UrbanArea } from "@/types/monitoring";
import { HOUSEHOLDS } from "@/data/wardData";

interface AreaDrawerProps {
  area: UrbanArea | null;
  onClose: () => void;
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

export function AreaDrawer({ area, onClose }: AreaDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const detail = area
    ? AREA_DETAILS[area.id] ?? defaultDetail(area)
    : null;

  const statusCfg = area ? STATUS_LABEL[area.status] : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300 ${
          area ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-[420px] z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          area ? "translate-x-0" : "translate-x-full"
        }`}
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
              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Số hộ dân",
                    value: detail.households.toLocaleString(),
                    accent: "text-blue-700",
                  },
                  {
                    label: "Tổng rác thải",
                    value: `${area.totalWaste.toLocaleString()} kg`,
                    accent: "text-red-600",
                  },
                  {
                    label: "Tỷ lệ nhựa",
                    value: `${detail.plasticRatio}%`,
                    accent: "text-violet-600",
                  },
                  {
                    label: "Báo cáo chờ",
                    value: area.reports,
                    accent: "text-amber-600",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                  >
                    <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.accent}`}>
                      {stat.value}
                    </p>
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

              {/* Chart 3: Electricity Consumption */}
              <ChartCard title="Tiêu thụ điện (kWh)">
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={detail.electricityByMonth}>
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
                    <defs>
                      <linearGradient
                        id="electricGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="kwh"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#electricGrad)"
                    />
                  </AreaChart>
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
                      <linearGradient
                        id="emissionGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f59e0b"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f59e0b"
                          stopOpacity={0}
                        />
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

              {/* Household list */}
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
                              <th className="text-left px-3 py-2 text-gray-500 font-semibold">Hộ</th>
                              <th className="text-right px-3 py-2 text-gray-500 font-semibold">Rác (kg)</th>
                              <th className="text-center px-3 py-2 text-gray-500 font-semibold">Mức độ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {wardHouseholds
                              .sort((a, b) => b.waste - a.waste)
                              .map((hh) => {
                                const statusCfgHH = STATUS_LABEL[hh.status];
                                return (
                                  <tr key={hh.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-3 py-2 text-gray-700 font-medium">{hh.name}</td>
                                    <td className="px-3 py-2 text-right font-bold text-gray-900">{hh.waste.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfgHH.bg} ${statusCfgHH.text}`}>
                                        {statusCfgHH.label === "Critical" ? "Cao" : statusCfgHH.label === "Moderate" ? "TB" : "Thấp"}
                                      </span>
                                    </td>
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
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              Chọn một phường trên bản đồ
            </div>
          )}
        </div>
      </div>
    </>
  );
}
