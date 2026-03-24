"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface ZoneTrendItem {
    time: string;
    SonTra: number;
    ThanhKhe: number;
    LienChieu: number;
    HaiChau: number;
    CamLe: number;
    NguHanhSon: number;
    HoaVang: number;
}

interface MonthlyZoneData {
    month: string;
    SonTra: number;
    ThanhKhe: number;
    LienChieu: number;
    HaiChau: number;
    CamLe: number;
    NguHanhSon: number;
    HoaVang: number;
}

const zoneTrendData: ZoneTrendItem[] = [
    { time: "08:00", SonTra: 12, ThanhKhe: 18, LienChieu: 9, HaiChau: 14, CamLe: 10, NguHanhSon: 7, HoaVang: 6 },
    { time: "10:00", SonTra: 16, ThanhKhe: 22, LienChieu: 12, HaiChau: 17, CamLe: 13, NguHanhSon: 9, HoaVang: 8 },
    { time: "12:00", SonTra: 20, ThanhKhe: 25, LienChieu: 14, HaiChau: 20, CamLe: 15, NguHanhSon: 11, HoaVang: 9 },
    { time: "14:00", SonTra: 18, ThanhKhe: 24, LienChieu: 13, HaiChau: 21, CamLe: 14, NguHanhSon: 12, HoaVang: 10 },
    { time: "16:00", SonTra: 24, ThanhKhe: 28, LienChieu: 19, HaiChau: 24, CamLe: 16, NguHanhSon: 14, HoaVang: 12 },
    { time: "18:00", SonTra: 28, ThanhKhe: 32, LienChieu: 22, HaiChau: 27, CamLe: 18, NguHanhSon: 15, HoaVang: 14 },
];

const monthlyZoneData: MonthlyZoneData[] = [
    { month: "2025-04", SonTra: 280, ThanhKhe: 390, LienChieu: 210, HaiChau: 450, CamLe: 240, NguHanhSon: 160, HoaVang: 120 },
    { month: "2025-05", SonTra: 300, ThanhKhe: 410, LienChieu: 220, HaiChau: 470, CamLe: 250, NguHanhSon: 170, HoaVang: 125 },
    { month: "2025-06", SonTra: 320, ThanhKhe: 430, LienChieu: 230, HaiChau: 490, CamLe: 260, NguHanhSon: 180, HoaVang: 130 },
    { month: "2025-07", SonTra: 340, ThanhKhe: 450, LienChieu: 240, HaiChau: 510, CamLe: 270, NguHanhSon: 190, HoaVang: 135 },
    { month: "2025-08", SonTra: 360, ThanhKhe: 470, LienChieu: 250, HaiChau: 530, CamLe: 280, NguHanhSon: 200, HoaVang: 140 },
    { month: "2025-09", SonTra: 350, ThanhKhe: 460, LienChieu: 245, HaiChau: 520, CamLe: 275, NguHanhSon: 195, HoaVang: 138 },
    { month: "2025-10", SonTra: 370, ThanhKhe: 480, LienChieu: 255, HaiChau: 540, CamLe: 285, NguHanhSon: 205, HoaVang: 145 },
    { month: "2025-11", SonTra: 390, ThanhKhe: 500, LienChieu: 270, HaiChau: 560, CamLe: 295, NguHanhSon: 215, HoaVang: 150 },
    { month: "2025-12", SonTra: 410, ThanhKhe: 520, LienChieu: 285, HaiChau: 580, CamLe: 305, NguHanhSon: 225, HoaVang: 155 },
    { month: "2026-01", SonTra: 330, ThanhKhe: 420, LienChieu: 230, HaiChau: 480, CamLe: 250, NguHanhSon: 170, HoaVang: 130 },
    { month: "2026-02", SonTra: 300, ThanhKhe: 390, LienChieu: 210, HaiChau: 460, CamLe: 230, NguHanhSon: 160, HoaVang: 120 },
    { month: "2026-03", SonTra: 360, ThanhKhe: 430, LienChieu: 250, HaiChau: 500, CamLe: 270, NguHanhSon: 180, HoaVang: 140 },
];

const imageDatabaseMock = [
    {
        id: 1,
        area: "Sơn Trà",
        recordedAt: "2026-03-20 07:30",
        imageUrl: "https://images.unsplash.com/photo-1600180758896-80c8a22f30b5?auto=format&fit=crop&w=800&q=60",
    },
    {
        id: 2,
        area: "Thanh Khê",
        recordedAt: "2026-03-20 12:45",
        imageUrl: "https://images.unsplash.com/photo-1598511722960-1d6fd0a20afb?auto=format&fit=crop&w=800&q=60",
    },
    {
        id: 3,
        area: "Liên Chiểu",
        recordedAt: "2026-03-20 17:15",
        imageUrl: "https://images.unsplash.com/photo-1603808033195-97f8061cd41d?auto=format&fit=crop&w=800&q=60",
    },
];

const zoneOrder = ["Sơn Trà", "Thanh Khê", "Liên Chiểu", "Hải Châu", "Cẩm Lệ", "Ngũ Hành Sơn", "Hòa Vang"];

const zones = ["Tất cả", ...zoneOrder];

const zoneColors: Record<string, string> = {
    "Sơn Trà": "#0ea5e9",
    "Thanh Khê": "#22c55e",
    "Liên Chiểu": "#f59e0b",
    "Hải Châu": "#ef4444",
    "Cẩm Lệ": "#a855f7",
    "Ngũ Hành Sơn": "#fb923c",
    "Hòa Vang": "#14b8a6",
    "Tất cả": "#3b82f6",
};

const SortedTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

    return (
        <div className="rounded-md border border-slate-200 bg-white p-2 shadow-lg">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            {sortedPayload.map((entry: any) => (
                <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name || entry.dataKey}</span>
                    <span className="ml-auto font-semibold">{entry.value?.toLocaleString()} kg</span>
                </div>
            ))}
        </div>
    );
};

const zoneKeyMap: Record<string, keyof MonthlyZoneData> = {
    "Sơn Trà": "SonTra",
    "Thanh Khê": "ThanhKhe",
    "Liên Chiểu": "LienChieu",
    "Hải Châu": "HaiChau",
    "Cẩm Lệ": "CamLe",
    "Ngũ Hành Sơn": "NguHanhSon",
    "Hòa Vang": "HoaVang",
};

export default function GarbageAnalyticsPage() {
    const [selectedMonth, setSelectedMonth] = useState(monthlyZoneData[0].month);
    const [selectedZone, setSelectedZone] = useState<"Tất cả" | "Sơn Trà" | "Thanh Khê" | "Liên Chiểu" | "Hải Châu" | "Cẩm Lệ" | "Ngũ Hành Sơn" | "Hòa Vang">("Tất cả");

    const totalWaste = useMemo(
        () => monthlyZoneData.reduce(
            (sum, row) =>
                sum + row.SonTra + row.ThanhKhe + row.LienChieu + row.HaiChau + row.CamLe + row.NguHanhSon + row.HoaVang,
            0
        ),
        []
    );

    const zoneSummary = useMemo(() => {
        const result = zoneOrder.reduce((acc, zone) => {
            const key = zoneKeyMap[zone];
            acc[key] = 0;
            return acc;
        }, {
            SonTra: 0,
            ThanhKhe: 0,
            LienChieu: 0,
            HaiChau: 0,
            CamLe: 0,
            NguHanhSon: 0,
            HoaVang: 0,
        } as Record<keyof MonthlyZoneData, number>);

        monthlyZoneData.forEach((row) => {
            zoneOrder.forEach((zone) => {
                const key = zoneKeyMap[zone];
                // @ts-expect-error assignment via dynamic key
                result[key] += row[key];
            });
        });
        return result;
    }, []);

    const busiestZone = useMemo(() => {
        const zoneValues = [
            { name: "Sơn Trà", value: zoneSummary.SonTra },
            { name: "Thanh Khê", value: zoneSummary.ThanhKhe },
            { name: "Liên Chiểu", value: zoneSummary.LienChieu },
            { name: "Hải Châu", value: zoneSummary.HaiChau },
            { name: "Cẩm Lệ", value: zoneSummary.CamLe },
            { name: "Ngũ Hành Sơn", value: zoneSummary.NguHanhSon },
            { name: "Hòa Vang", value: zoneSummary.HoaVang },
        ];
        return zoneValues.sort((a, b) => b.value - a.value)[0];
    }, [zoneSummary]);

    const [selectedView, setSelectedView] = useState<"monthly" | "all">("all");

    const monthlyData = useMemo(() => monthlyZoneData.find((row) => row.month === selectedMonth) ?? monthlyZoneData[0], [selectedMonth]);

    const allTimeChartData = useMemo(() => {
        const data = zoneOrder.map((zone) => ({ zone, value: zoneSummary[zoneKeyMap[zone]] }));
        if (selectedZone !== "Tất cả") {
            return data.filter((item) => item.zone === selectedZone);
        }
        return data;
    }, [zoneSummary, selectedZone]);

    const monthlyTrendData = useMemo(() => {
        return monthlyZoneData.map((row) => ({
            month: row.month,
            SonTra: row.SonTra,
            ThanhKhe: row.ThanhKhe,
            LienChieu: row.LienChieu,
            HaiChau: row.HaiChau,
            CamLe: row.CamLe,
            NguHanhSon: row.NguHanhSon,
            HoaVang: row.HoaVang,
        }));
    }, []);

    const chartData = useMemo(() => {
        if (selectedView === "all") {
            return allTimeChartData;
        }

        if (selectedZone === "Tất cả") {
            return zoneOrder.map((zone) => ({
                zone,
                value: monthlyData[zoneKeyMap[zone]],
            }));
        }

        const value =
            selectedZone === "Sơn Trà"
                ? monthlyData.SonTra
                : selectedZone === "Thanh Khê"
                    ? monthlyData.ThanhKhe
                    : selectedZone === "Liên Chiểu"
                        ? monthlyData.LienChieu
                        : selectedZone === "Hải Châu"
                            ? monthlyData.HaiChau
                            : selectedZone === "Cẩm Lệ"
                                ? monthlyData.CamLe
                                : selectedZone === "Ngũ Hành Sơn"
                                    ? monthlyData.NguHanhSon
                                    : monthlyData.HoaVang;

        return [{ zone: selectedZone, value }];
    }, [selectedView, selectedZone, monthlyData, allTimeChartData]);

    return (

        <div className="min-h-screen bg-slate-50">
            <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
                <div className="p-5 rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Waste and Urban Environment Monitoring</h1>
                            <p className="text-sm text-slate-500 mt-1">Da Nang — Data overview across zones and field images</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-700">LIVE</span>
                            <span>Updated: {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Waste (kg)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-blue-700">{totalWaste.toLocaleString()}</p>
                            <p className="text-sm text-slate-500">Last 3 months total</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Highest Waste Region</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{busiestZone.name}</p>
                            <p className="text-sm text-slate-500">{busiestZone.value.toLocaleString()} kg / 3 months</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Selected Month</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{selectedMonth}</p>
                            <p className="text-sm text-slate-500">{selectedZone === "Tất cả" ? "All zones" : selectedZone}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Field Images</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{imageDatabaseMock.length}</p>
                            <p className="text-sm text-slate-500">Raw data from cameras and citizen reports</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                            <div>
                                <CardTitle>Filter Controls</CardTitle>
                                <p className="text-sm text-slate-500">Select month and zone to view trend</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex rounded-md border border-slate-300 overflow-hidden text-xs">
                                    <button
                                        className={`px-3 py-2 ${selectedView === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"}`}
                                        onClick={() => setSelectedView("all")}
                                    >
                                        All-Time
                                    </button>
                                    <button
                                        className={`px-3 py-2 ${selectedView === "monthly" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"}`}
                                        onClick={() => setSelectedView("monthly")}
                                    >
                                        By Month
                                    </button>
                                </div>

                                {selectedView === "monthly" && (
                                    <select
                                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                                        value={selectedMonth}
                                        onChange={(event) => setSelectedMonth(event.target.value)}
                                    >
                                        {monthlyZoneData.map((row) => (
                                            <option key={row.month} value={row.month}>
                                                {row.month}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <select
                                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    value={selectedZone}
                                    onChange={(event) => setSelectedZone(event.target.value as any)}
                                >
                                    {zones.map((zone) => (
                                        <option key={zone} value={zone}>
                                            {zone}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-105">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 16, right: 22, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="zone" stroke="#64748b" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                                <Tooltip content={<SortedTooltip />} formatter={(value) => `${value} kg`} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry) => (
                                        <Cell key={entry.zone} fill={zoneColors[entry.zone] ?? "#3b82f6"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>12-Month Zone Trend</CardTitle>
                        <p className="text-sm text-slate-500">Monthly values for each zone across the last period</p>
                    </CardHeader>
                    <CardContent className="h-105">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyTrendData} margin={{ top: 16, right: 22, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                                <Tooltip content={<SortedTooltip />} formatter={(value) => `${value} kg`} />
                                <Legend />
                                {zoneOrder.map((zone) => {
                                    const dataKey = zoneKeyMap[zone];
                                    return (
                                        <Line
                                            key={zone}
                                            type="monotone"
                                            dataKey={dataKey}
                                            stroke={zoneColors[zone]}
                                            strokeWidth={2}
                                            dot={false}
                                            name={zone}
                                        />
                                    );
                                })}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Zone Details</CardTitle>
                            <p className="text-sm text-slate-500">Monthly data for each district</p>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50">
                                        <tr>
                                            <th className="p-3">Month</th>
                                            <th className="p-3">Son Tra</th>
                                            <th className="p-3">Thanh Khe</th>
                                            <th className="p-3">Lien Chieu</th>
                                            <th className="p-3">Hai Chau</th>
                                            <th className="p-3">Cam Le</th>
                                            <th className="p-3">Ngu Hanh Son</th>
                                            <th className="p-3">Hoa Vang</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlyZoneData.map((entry) => (
                                            <tr key={entry.month} className="border-b even:bg-slate-50">
                                                <td className="p-3 font-medium">{entry.month}</td>
                                                <td className="p-3">{entry.SonTra.toLocaleString()}</td>
                                                <td className="p-3">{entry.ThanhKhe.toLocaleString()}</td>
                                                <td className="p-3">{entry.LienChieu.toLocaleString()}</td>
                                                <td className="p-3">{entry.HaiChau.toLocaleString()}</td>
                                                <td className="p-3">{entry.CamLe.toLocaleString()}</td>
                                                <td className="p-3">{entry.NguHanhSon.toLocaleString()}</td>
                                                <td className="p-3">{entry.HoaVang.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Field Monitoring Images</CardTitle>
                            <p className="text-sm text-slate-500">Images showing real conditions and pollution levels</p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {imageDatabaseMock.map((item) => (
                                    <div key={item.id} className="rounded-lg border border-slate-200 bg-white shadow-sm">
                                        <img className="h-44 w-full object-cover rounded-t-lg" src={item.imageUrl} alt={`${item.area} - ${item.recordedAt}`} />
                                        <div className="space-y-1 p-3">
                                            <p className="text-sm font-semibold">{item.area}</p>
                                            <p className="text-xs text-slate-500">{item.recordedAt}</p>
                                            <p className="text-xs text-slate-500">Source: surveillance camera / citizen report</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
