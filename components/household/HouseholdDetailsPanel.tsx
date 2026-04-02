"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

    const historyItems = useMemo(() => {
        if (!household) return [];

        const imageByDate = new Map<string, typeof household.imageHistory[0]>();
        household.imageHistory.forEach((image) => {
            const key = new Date(image.uploadedAt).toDateString();
            imageByDate.set(key, image);
        });

        return householdReports.map((report) => {
            const reportDate = new Date(report.reportedAt).toDateString();
            return {
                ...report,
                image: imageByDate.get(reportDate) ?? null,
                reportDate,
            };
        });
    }, [household, householdReports]);

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
        <div className="space-y-6 h-[82vh] max-h-[82vh] overflow-y-auto p-4 bg-slate-50 rounded-2xl shadow-inner">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <Card className="p-4 shadow-lg border border-slate-200 bg-white">
                    <CardHeader>
                        <CardTitle>Thông tin hộ dân</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <p><strong>Chủ hộ:</strong> {household.members.length ? household.members[0].name : household.name}</p>
                            <p>Địa chỉ: {household.address}</p>
                            <p>Phường ID: {household.wardId}</p>
                            <p>Quy mô hộ: {household.familySize} người</p>
                            <p>Trạng thái: <span className={household.status === "red" ? "text-red-600" : household.status === "yellow" ? "text-amber-600" : "text-emerald-600"}>{household.status.toUpperCase()}</span></p>
                            <p>Tổng rác hiện tại: {household.waste.toFixed(1)} kg/ngày - {household.reportCount} báo cáo</p>
                            <p>Rác tháng gần nhất: {latest.totalWasteKg.toLocaleString()} kg</p>
                            <p>Phân loại: {pctPlastic}% nhựa | {pctOrganic}% hữu cơ | {100 - pctPlastic - pctOrganic}% hỗn hợp/khác</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border border-slate-200 bg-white">
                    <CardHeader>
                        <CardTitle>Thành viên hộ gia đình</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-auto max-h-44">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-700">
                                        <th className="px-2 py-1 border">Thành viên</th>
                                        <th className="px-2 py-1 border">Vai trò</th>
                                        <th className="px-2 py-1 border">Rác/ngày kg</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {household.members.map((member) => (
                                        <tr key={member.name} className="even:bg-white odd:bg-slate-50">
                                            <td className="px-2 py-1 border">{member.name}</td>
                                            <td className="px-2 py-1 border">{member.role}</td>
                                            <td className="px-2 py-1 border text-right">{member.wasteKg.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg border border-slate-200 bg-white">
                <CardHeader>
                    <CardTitle>Biểu đồ đường tổng rác 12 tháng</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-80 md:h-88 xl:h-96">
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
                                <Legend verticalAlign="top" align="right" height={36} />
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

            <Card className="shadow-sm border border-gray-100">
                <CardHeader>
                    <CardTitle>Xu hướng rác & ô nhiễm 12 tháng</CardTitle>
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
                                <Legend verticalAlign="top" align="right" height={36} />
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
                    <div className="space-y-3 max-h-44 overflow-y-auto">
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