"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { User, Users, TrendingUp, CalendarDays, BarChart3 } from "lucide-react";
import type { HouseholdProfile, WasteReport } from "@/types/monitoring";

interface HouseholdDetailsPanelProps {
    household: HouseholdProfile | null;
    reports?: WasteReport[];
}

function getLatestMonth(wasteHistory: HouseholdProfile["wasteHistory"]) {
    return wasteHistory[wasteHistory.length - 1];
}

export function HouseholdDetailsPanel({ household, reports }: HouseholdDetailsPanelProps) {
    const householdReports = useMemo(() => {
        if (!household || !reports) return [];
        return reports.filter((r) => r.householdId === household.id);
    }, [household, reports]);

    if (!household) {
        return (
            <div className="p-4 rounded-2xl border border-dashed border-gray-200 bg-white h-full flex items-center justify-center text-gray-500">
                Vui lòng chọn một hộ gia đình trên bản đồ.
            </div>
        );
    }

    const latest = getLatestMonth(household.wasteHistory);
    const pctPlastic = Math.round((latest.plasticKg / latest.totalWasteKg) * 100);
    const pctOrganic = Math.round((latest.organicKg / latest.totalWasteKg) * 100);

    return (
        <div className="min-h-[70vh] overflow-y-auto p-4 bg-slate-50 text-slate-800">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 mb-3 min-h-[260px]">
                <Card className="p-3 shadow-lg border border-slate-200 bg-white rounded-xl min-h-[220px]">
                    <CardHeader className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-emerald-600" />
                        <CardTitle className="text-base font-semibold">Thông tin hộ dân</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <p><strong>Chủ hộ:</strong> {household.members.length ? household.members[0].name : household.name}</p>
                            <p>Địa chỉ: {household.address}</p>
                            <p>Phường ID: {household.wardId}</p>
                            <p>Quy mô hộ: {household.familySize} người</p>
                            <p>Trạng thái: <span className={household.status === "red" ? "text-red-600" : household.status === "yellow" ? "text-amber-600" : "text-emerald-600"}>{household.status.toUpperCase()}</span></p>
                            <p>Tổng lượt detect: {household.reportCount} lần</p>
                            <p>Tổng lượt upload ảnh: {household.imageHistory?.length ?? 0} lần</p>
                            <p>Rác tháng gần nhất: {latest.totalWasteKg.toLocaleString()} kg</p>
                            <p>Phân loại: {pctPlastic}% nhựa | {pctOrganic}% hữu cơ | {100 - pctPlastic - pctOrganic}% hỗn hợp/khác</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border border-slate-200 bg-white rounded-xl min-h-[320px]">
                    <CardHeader className="mb-1 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <CardTitle className="text-base font-semibold">Thành viên hộ gia đình</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-auto max-h-[400px] min-h-[220px] pr-2">
                            <table className="min-w-[500px] w-full text-[11px] border-separate border-spacing-y-1">
                                <thead>
                                    <tr className="bg-blue-50 text-blue-700 text-[12px] uppercase tracking-widest ">
                                        <th className="px-3 py-2 text-left">Thành viên</th>
                                        <th className="px-3 py-2 text-center">Vai trò</th>
                                        <th className="px-3 py-2 text-right">Tổng số lần chụp rác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {household.members.map((member, idx) => (
                                        <tr key={member.name} className={idx % 2 === 0 ? "bg-white hover:bg-slate-100" : "bg-slate-50 hover:bg-slate-100"}>
                                            <td className="px-3 py-2">{member.name}</td>
                                            <td className="px-3 py-2 text-center">{member.role}</td>
                                            <td className="px-3 py-2 text-right">{member.wasteKg.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg border border-slate-200 bg-white rounded-2xl">
                <CardHeader className="mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <CardTitle className="text-base font-semibold">Biểu đồ đường tổng rác 12 tháng</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-72 md:h-76 xl:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={household.wasteHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tickFormatter={(value) => value.slice(5)} />
                                <YAxis />
                                <Tooltip formatter={(value: any) => {
                                    if (value == null) return "";
                                    const val = Number(value);
                                    if (Number.isNaN(val)) return String(value);
                                    return `${val.toLocaleString()} kg`;
                                }} />
                                <Legend verticalAlign="bottom" align="center" height={36} />
                                <Line
                                    type="monotone"
                                    dataKey="totalWasteKg"
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
                    <CardTitle className="text-base font-semibold">Xu hướng rác & ô nhiễm 12 tháng</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-56 md:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={household.wasteHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tickFormatter={(value) => value.slice(5)} />
                                <YAxis yAxisId="waste" />
                                <YAxis yAxisId="pollution" orientation="right" />
                                <Tooltip
                                    content={({ active, payload, label }: any) => {
                                        if (!active || !payload?.length) return null;
                                        const row = payload[0]?.payload as HouseholdProfile["wasteHistory"][number] | undefined;
                                        const pollution = row?.pollution;

                                        const pollutionEntries = pollution
                                            ? Object.entries(pollution).filter(([, value]) => Number(value) !== 0)
                                            : [];

                                        return (
                                            <div className="rounded-lg border bg-background p-3 text-xs shadow-sm">
                                                <div className="font-semibold">Tháng {String(label).slice(5)}</div>
                                                <div className="mt-2 space-y-1">
                                                    <div>Rác: <span className="font-semibold">{Number(row?.totalWasteKg ?? 0).toLocaleString()} kg</span></div>
                                                    {pollution && (
                                                        <div className="pt-2">
                                                            <div className="font-semibold">Pollution</div>
                                                            {pollutionEntries.length ? (
                                                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
                                                                    {pollutionEntries.map(([key, value]) => (
                                                                        <div key={key}>
                                                                            {key}: {Number(value).toFixed(3)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="mt-1 text-slate-500">Không có chỉ số ô nhiễm khác.</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Legend verticalAlign="bottom" align="center" height={36} />
                                <Line
                                    yAxisId="waste"
                                    type="monotone"
                                    dataKey="totalWasteKg"
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
                    <CardTitle>Lịch sử ảnh báo cáo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                        {household.imageHistory.map((image) => {
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
                                                <p className="font-semibold text-slate-700">Ảnh rác thải {new Date(image.uploadedAt).toLocaleDateString("vi-VN")}</p>
                                                <span className="text-[11px] text-slate-500">{new Date(image.uploadedAt).toLocaleTimeString("vi-VN")}</span>
                                            </div>
                                            <p className="text-slate-600">{image.caption || "Rác thải hộ gia đình"}</p>

                                            <p className="text-sm">
                                                <span className="font-medium">Người gửi:</span> {relatedReport?.reportedBy || relatedReport?.householdName || "Chưa rõ"}
                                            </p>

                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {relatedReport ? (
                                                    <>
                                                        <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">{relatedReport.status}</span>
                                                        <span className="px-2 py-1 rounded bg-slate-100">{relatedReport.wasteType}</span>
                                                    </>
                                                ) : (
                                                    <span className="px-2 py-1 rounded bg-rose-100 text-rose-700">Không có báo cáo cùng ngày</span>
                                                )}
                                            </div>

                                            {image.total_objects != null && (
                                                <p className="text-xs text-slate-500">Tổng đối tượng: {image.total_objects}</p>
                                            )}

                                            {image.items?.length ? (
                                                <div className="text-xs">
                                                    <p className="font-medium">Danh sách vật phẩm:</p>
                                                    <ul className="ml-4 list-disc space-y-1">
                                                        {image.items.map((item) => (
                                                            <li key={item.name} className="leading-tight">{item.name} - {item.quantity} (area {item.area})</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : null}

                                            {image.pollution && (
                                                <div className="mt-2 text-xs">
                                                    <p className="font-medium">Pollution image:</p>
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