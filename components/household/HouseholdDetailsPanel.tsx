"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { User, Users, TrendingUp, BarChart3 } from "lucide-react";
import type { HouseholdProfile, WasteReport } from "@/types/monitoring";

interface HouseholdDetailsPanelProps {
    household: HouseholdProfile | null;
    reports?: WasteReport[];
    imageHistory?: HouseholdProfile["imageHistory"];
    imageHistoryLoading?: boolean;
    historyError?: string | null;
    greenScoreHistory?: HouseholdProfile["greenScores"];
    greenScoreLoading?: boolean;
    greenScoreError?: string | null;
}

type CaptureTrendPoint = {
    month: string; // YYYY-MM
    captureCount: number;
    pollutionCO2: number;
    pollutionDioxin: number;
    pollutionMicroplastic: number;
    pollutionNonBiodegradable: number;
};

type GreenScoreTrendPoint = {
    month: string; // YYYY-MM
    label: string; // formatted for axis/tooltip
    finalScore: number | null;
    delta?: number;
    previousScore?: number;
    reasons?: string[] | null;
    items?: {
        area: number;
        name: string;
        quantity: number;
    }[] | null;
};

function buildGreenScoreTrendFromHistory(greenScoreHistory: NonNullable<HouseholdProfile["greenScores"]>): GreenScoreTrendPoint[] {
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i -= 1) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(formatMonth(dt));
    }

    const latestEntryByMonth = new Map<string, NonNullable<HouseholdProfile["greenScores"]>[number]>();
    greenScoreHistory
        .slice()
        .filter((entry) => !Number.isNaN(new Date(entry.createdAt).getTime()))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .forEach((entry) => {
            const monthKey = formatMonth(new Date(entry.createdAt));
            latestEntryByMonth.set(monthKey, entry);
        });

    const trend: GreenScoreTrendPoint[] = [];

    for (const month of months) {
        const entry = latestEntryByMonth.get(month);
        if (entry) {
            trend.push({
                month,
                label: month.slice(5),
                finalScore: entry.finalScore,
                delta: entry.delta,
                previousScore: entry.previousScore,
                reasons: entry.reasons,
                items: entry.items,
            });
        } else {
            trend.push({
                month,
                label: month.slice(5),
                finalScore: 0,
                reasons: undefined,
                items: null,
            });
        }
    }

    return trend;
}

function createSeededRandom(seed: number) {
    let state = Math.floor(seed) % 2147483647;
    if (state <= 0) state += 2147483646;

    return () => {
        state = (state * 16807) % 2147483647;
        return (state - 1) / 2147483646;
    };
}

function formatMonth(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function generateMockCaptureTrend(householdId: number): CaptureTrendPoint[] {
    const rand = createSeededRandom((householdId || 1) * 97);
    const now = new Date();

    const start = 6 + rand() * 10;
    const end = start + (rand() - 0.5) * 8;

    const points: CaptureTrendPoint[] = [];

    for (let i = 11; i >= 0; i -= 1) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const t = (11 - i) / 11;
        const base = start + (end - start) * t;
        const captureCount = clamp(Math.round(base + (rand() - 0.5) * 6), 0, 40);

        points.push({
            month: formatMonth(dt),
            captureCount,
            pollutionCO2: Math.round(captureCount * (8 + rand() * 6) * 10) / 10,
            pollutionDioxin: Math.round(captureCount * (0.008 + rand() * 0.01) * 1000) / 1000,
            pollutionMicroplastic: Math.round(captureCount * (0.02 + rand() * 0.02) * 1000) / 1000,
            pollutionNonBiodegradable: Math.round(captureCount * (0.9 + rand() * 0.6) * 10) / 10,
        });
    }

    return points;
}

function buildCaptureTrendFromDates(dates: string[], householdId: number): CaptureTrendPoint[] {
    const rand = createSeededRandom((householdId || 1) * 53);
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i -= 1) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(formatMonth(dt));
    }

    const countsByMonth = new Map<string, number>();
    dates.forEach((iso) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return;
        const key = formatMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        countsByMonth.set(key, (countsByMonth.get(key) ?? 0) + 1);
    });

    return months.map((month) => {
        const captureCount = countsByMonth.get(month) ?? 0;
        return {
            month,
            captureCount,
            pollutionCO2: Math.round(captureCount * (8 + rand() * 6) * 10) / 10,
            pollutionDioxin: Math.round(captureCount * (0.008 + rand() * 0.01) * 1000) / 1000,
            pollutionMicroplastic: Math.round(captureCount * (0.02 + rand() * 0.02) * 1000) / 1000,
            pollutionNonBiodegradable: Math.round(captureCount * (0.9 + rand() * 0.6) * 10) / 10,
        };
    });
}

function generateMockImageHistory(householdId: number): HouseholdProfile["imageHistory"] {
    const rand = createSeededRandom((householdId || 1) * 13);
    const now = new Date();

    return Array.from({ length: 5 }, (_, idx) => {
        const dt = new Date(now.getTime() - idx * 1000 * 60 * 60 * 24 * 7);
        const totalObjects = 6 + Math.floor(rand() * 18);

        return {
            id: (householdId || 1) * 100 + idx,
            uploadedAt: dt.toISOString(),
            imageUrl: `https://via.placeholder.com/320x240.png?text=Household+${encodeURIComponent(String(householdId))}+%23${idx + 1}`,
            label: `Report #${idx + 1}`,
            caption: "Mock: household waste image",
            total_objects: totalObjects,
            items: [
                { name: "Nhựa", quantity: 1 + Math.floor(rand() * 6), area: Math.round((rand() * 12 + 3) * 10) / 10 },
                { name: "Hữu cơ", quantity: 1 + Math.floor(rand() * 5), area: Math.round((rand() * 10 + 2) * 10) / 10 },
                { name: "Hỗn hợp", quantity: 1 + Math.floor(rand() * 4), area: Math.round((rand() * 8 + 2) * 10) / 10 },
            ],
        };
    });
}

export function HouseholdDetailsPanel({ household, reports, imageHistory: imageHistoryProp, imageHistoryLoading = false, historyError, greenScoreHistory, greenScoreLoading = false, greenScoreError }: HouseholdDetailsPanelProps) {
    const householdReports = useMemo(() => {
        if (!household || !reports) return [];
        return reports.filter((r) => r.householdId === household.id);
    }, [household, reports]);

    const imageHistory = useMemo(() => {
        if (imageHistoryProp?.length) return imageHistoryProp;
        if (household?.imageHistory?.length) return household.imageHistory;
        return generateMockImageHistory(household?.id ?? 0);
    }, [household?.id, household?.imageHistory, imageHistoryProp]);

    if (!household) {
        return (
            <div className="p-4 rounded-2xl border border-dashed border-gray-200 bg-white h-full flex items-center justify-center text-gray-500">
                Please select a household on the map.
            </div>
        );
    }

    const captureTrend = useMemo(() => {
        const reportDates = householdReports.map((r) => r.reportedAt);
        const imageDates = imageHistory.map((i) => i.uploadedAt);
        const dates = reportDates.length ? reportDates : imageDates;

        const anyValid = dates.some((d) => !Number.isNaN(new Date(d).getTime()));
        if (!anyValid) return generateMockCaptureTrend(household.id);

        const data = buildCaptureTrendFromDates(dates, household.id);
        const sum = data.reduce((acc, p) => acc + p.captureCount, 0);
        return sum > 0 ? data : generateMockCaptureTrend(household.id);
    }, [household.id, householdReports, imageHistory]);

    const greenScoreTrend = useMemo(() => {
        if (!greenScoreHistory?.length) return [];

        const data = buildGreenScoreTrendFromHistory(greenScoreHistory);
        const hasScore = data.some((point) => point.finalScore != null);
        return hasScore ? data : [];
    }, [greenScoreHistory]);

    const latestCaptureMonth = captureTrend.length ? captureTrend[captureTrend.length - 1] : null;
    const latestGreenScore = greenScoreTrend.length ? greenScoreTrend[greenScoreTrend.length - 1] : null;
    const trendChartData = greenScoreTrend.length ? greenScoreTrend : captureTrend;
    const isGreenScoreChart = greenScoreTrend.length > 0;

    const displayGreenScore = household.greenScore != null ? household.greenScore : latestGreenScore?.finalScore;
    const scoreColorClass = displayGreenScore != null
        ? displayGreenScore < 40
            ? "text-red-700 bg-red-100"
            : displayGreenScore < 70
                ? "text-amber-700 bg-amber-100"
                : "text-emerald-700 bg-emerald-100"
        : "text-slate-500 bg-slate-100";
    const displayGreenDelta = latestGreenScore?.delta != null ? `${latestGreenScore.delta >= 0 ? "+" : ""}${latestGreenScore.delta}` : null;

    return (
        <div className="min-h-[55vh] overflow-y-auto p-2 bg-slate-50 text-slate-800">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 mb-2">
                <Card className="p-2 shadow-lg border border-slate-200 bg-white rounded-xl">
                    <CardHeader className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-emerald-600" />
                        <CardTitle className="text-base font-semibold flex items-center gap-2">Household Info
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold ${scoreColorClass}`}>
                                {displayGreenScore != null ? displayGreenScore : "?"}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <p><strong>Household head:</strong> {household.members.length ? household.members[0].name : household.name}</p>
                            <p>Address: {household.address}</p>
                            <p>Total image uploads: {imageHistory.length}</p>
                            <p>Latest month captures: {latestCaptureMonth ? `${latestCaptureMonth.captureCount} captures` : "No data available"}</p>
                            <p>
                                Latest green score: {greenScoreLoading ? "Loading..." : greenScoreError ? greenScoreError : latestGreenScore ? `${latestGreenScore.finalScore} (Δ ${latestGreenScore.delta != null ? `${latestGreenScore.delta >= 0 ? "+" : ""}${latestGreenScore.delta}` : "0"})` : "No green score data"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border border-slate-200 bg-white rounded-xl">
                    <CardHeader className="mb-1 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <CardTitle className="text-sm font-semibold">Household Members</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        <div className="space-y-2">
                            {!household.members?.length ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs text-slate-500">
                                    No members or data available
                                </div>
                            ) : (
                                household.members.map((member, idx) => (
                                    <div key={member.name ?? idx} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs">
                                        <div>
                                            <p className="font-semibold text-slate-800 truncate">{member.name || "N/A"}</p>
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{member.role || "N/A"}</p>
                                        </div>
                                        <div className="text-right min-w-[56px]">
                                            <p className="text-[10px] text-slate-500">Shots</p>
                                            <p className="font-semibold text-slate-700">{typeof member.wasteKg === "number" ? member.wasteKg.toFixed(1) : "0.0"}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg border border-slate-200 bg-white rounded-2xl">
                <CardHeader className="mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <CardTitle className="text-base font-semibold">{isGreenScoreChart ? "12-Month Green Score Trend" : "12-Month Capture Trend"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-48 md:h-52 xl:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart<GreenScoreTrendPoint | CaptureTrendPoint> data={trendChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tickFormatter={(value) => String(value).slice(5)} />
                                <YAxis allowDecimals={false} domain={isGreenScoreChart ? [0, 50] : undefined} />
                                <Tooltip formatter={(value: any) => {
                                    if (value == null) return "";
                                    const val = Number(value);
                                    if (Number.isNaN(val)) return String(value);
                                    return isGreenScoreChart ? `${val.toLocaleString()} pts` : `${val.toLocaleString()} times`;
                                }} />
                                <Legend verticalAlign="bottom" align="center" height={36} />
                                <Line
                                    type="monotone"
                                    dataKey={isGreenScoreChart ? "finalScore" : "captureCount"}
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#10b981" }}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg border border-slate-200 bg-white rounded-2xl">
                <CardHeader className="mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-base font-semibold">12-Month Capture & Pollution Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-40 md:h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={captureTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tickFormatter={(value) => value.slice(5)} />
                                <YAxis yAxisId="capture" allowDecimals={false} />
                                <YAxis yAxisId="pollution" orientation="right" />
                                <Tooltip
                                    content={({ active, payload, label }: any) => {
                                        if (!active || !payload?.length) return null;
                                        const row = payload[0]?.payload as CaptureTrendPoint | undefined;

                                        return (
                                            <div className="rounded-lg border bg-background p-3 text-xs shadow-sm">
                                                <div className="font-semibold">Month {String(label).slice(5)}</div>
                                                <div className="mt-2 space-y-1">
                                                    <div>Captures: <span className="font-semibold">{Number(row?.captureCount ?? 0).toLocaleString()} times</span></div>
                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-2">
                                                        <div>CO2: {Number(row?.pollutionCO2 ?? 0).toFixed(1)}</div>
                                                        <div>Dioxin: {Number(row?.pollutionDioxin ?? 0).toFixed(3)}</div>
                                                        <div>Microplastic: {Number(row?.pollutionMicroplastic ?? 0).toFixed(3)}</div>
                                                        <div>Non-biodeg.: {Number(row?.pollutionNonBiodegradable ?? 0).toFixed(1)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Legend verticalAlign="bottom" align="center" height={36} />
                                <Line
                                    yAxisId="capture"
                                    type="monotone"
                                    dataKey="captureCount"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#10b981" }}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                                <Line
                                    yAxisId="pollution"
                                    type="monotone"
                                    dataKey="pollutionCO2"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                    connectNulls
                                />
                                <Line
                                    yAxisId="pollution"
                                    type="monotone"
                                    dataKey="pollutionDioxin"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                    connectNulls
                                />
                                <Line
                                    yAxisId="pollution"
                                    type="monotone"
                                    dataKey="pollutionMicroplastic"
                                    stroke="#14b8a6"
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                    connectNulls
                                />
                                <Line
                                    yAxisId="pollution"
                                    type="monotone"
                                    dataKey="pollutionNonBiodegradable"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>


            <Card className="shadow-sm border border-gray-100">
                <CardHeader>
                    <CardTitle>Report Image History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[24vh] overflow-y-auto">
                        {imageHistoryLoading ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                                Loading image history...
                            </div>
                        ) : historyError ? (
                            <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 px-3 py-4 text-center text-sm text-rose-700">
                                {historyError}
                            </div>
                        ) : imageHistory.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                                No detection image history available.
                            </div>
                        ) : imageHistory.map((image) => {
                            const relatedReport = householdReports.find((report) => {
                                const reportDate = new Date(report.reportedAt).toDateString();
                                const imageDate = new Date(image.uploadedAt).toDateString();
                                return reportDate === imageDate;
                            });

                            return (
                                <div key={image.id} className="border rounded-xl p-3 bg-white shadow-sm transition hover:shadow-md">
                                    <div className="flex gap-3 items-start">
                                        <img src={image.imageUrl} alt={image.label} className="h-20 w-28 object-cover rounded-lg border" />
                                        <div className="text-xs flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-slate-700">Waste image {new Date(image.uploadedAt).toLocaleDateString("en-US")}</p>
                                                <span className="text-[11px] text-slate-500">{new Date(image.uploadedAt).toLocaleTimeString("en-US")}</span>
                                            </div>
                                            <p className="text-slate-600">{image.caption || "Household waste image"}</p>

                                            <p className="text-sm">
                                                <span className="font-medium">Sender:</span> {image.sender || relatedReport?.reportedBy || relatedReport?.householdName || "Unknown"}
                                            </p>

                                            {relatedReport ? (
                                                <div className="flex flex-wrap gap-2 text-xs">
                                                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">{relatedReport.status}</span>
                                                    <span className="px-2 py-1 rounded bg-slate-100">{relatedReport.wasteType}</span>
                                                </div>
                                            ) : null}

                                            {image.total_objects != null && (
                                                <p className="text-xs text-slate-500">Total objects: {image.total_objects}</p>
                                            )}

                                            {image.items?.length ? (
                                                <div className="text-xs">
                                                    <p className="font-medium">Items:</p>
                                                    <ul className="ml-4 list-disc space-y-1">
                                                        {image.items.map((item) => (
                                                            <li key={item.name} className="leading-tight">{item.name} - {item.quantity} (area {item.area})</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : null}

                                            {image.pollution && (
                                                <div className="mt-2 text-xs">
                                                    <p className="font-medium">Pollution data:</p>
                                                    <div className="grid grid-cols-2 gap-1 text-slate-600">
                                                        {Object.entries(image.pollution).map(([key, value]) => (
                                                            <div key={key} className="bg-slate-50 rounded px-2 py-1">{key}: {Number(value).toFixed(3)}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}