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
        <div className="space-y-5 max-h-[78vh] overflow-y-auto p-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-3 shadow-sm border border-gray-100">
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

                <Card className="shadow-sm border border-gray-100">
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
                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <div className="text-xs text-slate-600">CO2</div>
                            <div className="font-semibold text-slate-900">{latest.pollution?.CO2?.toFixed(3) ?? latest.pollutionCO2.toFixed(3)}</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <div className="text-xs text-slate-600">Dioxin</div>
                            <div className="font-semibold text-slate-900">{latest.pollution?.dioxin?.toFixed(3) ?? latest.pollutionDioxin.toFixed(3)}</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <div className="text-xs text-slate-600">Microplastic</div>
                            <div className="font-semibold text-slate-900">{latest.pollution?.microplastic?.toFixed(3) ?? latest.pollutionMicroplastic.toFixed(3)}</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <div className="text-xs text-slate-600">Non-biodegradable</div>
                            <div className="font-semibold text-slate-900">{latest.pollution?.non_biodegradable?.toFixed(3) ?? latest.pollutionNonBiodegradable.toFixed(3)}</div>
                        </div>
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

                            const reportInfo = relatedReport || householdReports[0] || null;

                            return (
                                <div key={image.id} className="border rounded-xl p-2 bg-slate-50">
                                    <div className="flex gap-2 items-start">
                                        <img src={image.imageUrl} alt={image.label} className="h-20 w-28 object-cover rounded-md" />
                                        <div className="text-xs flex-1">
                                            <p className="font-semibold text-slate-700">{image.label}</p>
                                            <p className="text-slate-500">{image.uploadedAt}</p>
                                            {image.caption && <p className="text-slate-600">{image.caption}</p>}
                                            {reportInfo ? (
                                                <div className="mt-2 rounded-md border border-slate-200 bg-white p-2 text-xs">
                                                    <div className="font-semibold text-slate-700">Thông tin báo cáo liên quan</div>
                                                    <div>Rác: {reportInfo.wasteKg.toFixed(1)} kg</div>
                                                    <div>Phân loại: {reportInfo.wasteType}</div>
                                                    <div>Trạng thái: {reportInfo.status}</div>
                                                    <div>Người gửi: {reportInfo.reportedBy || reportInfo.householdName || "Chưa rõ"}</div>
                                                    {reportInfo.imageUrl && (
                                                        <div className="mt-1">Ảnh báo cáo: <a className="text-sky-700" href={reportInfo.imageUrl} target="_blank" rel="noreferrer">Xem</a></div>
                                                    )}
                                                    {reportInfo.total_objects != null && (
                                                        <div>Tổng đối tượng: {reportInfo.total_objects}</div>
                                                    )}
                                                    {reportInfo.items?.length ? (
                                                        <div className="mt-1">
                                                            <div className="font-semibold">Chi tiết đồ vật:</div>
                                                            <ul className="ml-4 list-disc">
                                                                {reportInfo.items.map((item) => (
                                                                    <li key={item.name}>
                                                                        {item.name} - {item.quantity} (diện tích {item.area})
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : null}
                                                    {reportInfo.pollution && (
                                                        <div className="mt-1">
                                                            <div className="font-semibold">Mức độ ô nhiễm:</div>
                                                            <div className="grid grid-cols-2 gap-1 text-xs">
                                                                {Object.entries(reportInfo.pollution).map(([key, value]) => (
                                                                    <div key={key}>{key}: {Number(value).toFixed(3)}</div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-xs text-slate-500">Không có báo cáo liên quan trong cùng ngày.</div>
                                            )}

                                            {image.total_objects != null && (
                                                <div className="mt-2 text-xs">
                                                    <span className="font-semibold">Tổng đối tượng ảnh:</span> {image.total_objects}
                                                </div>
                                            )}

                                            {image.items?.length ? (
                                                <div className="mt-2 text-xs">
                                                    <div className="font-semibold">Danh sách vật phẩm trong ảnh:</div>
                                                    <ul className="ml-4 list-disc">
                                                        {image.items.map((item) => (
                                                            <li key={item.name}>{item.name} - {item.quantity} (area {item.area})</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : null}

                                            {image.pollution && (
                                                <div className="mt-2 text-xs">
                                                    <div className="font-semibold">Pollution image:</div>
                                                    <div className="grid grid-cols-2 gap-1">
                                                        {Object.entries(image.pollution).map(([key, value]) => (
                                                            <div key={key}>{key}: {Number(value).toFixed(3)}</div>
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
