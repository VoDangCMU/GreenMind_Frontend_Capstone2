"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { HOUSEHOLDS } from "@/data/wardData";
import { WASTE_REPORTS } from "@/data/reportData";
import { getHouseholdProfiles } from "@/lib/household";
import { HouseholdDetailsPanel } from "@/components/household/HouseholdDetailsPanel";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import type { HouseholdProfile } from "@/types/monitoring";

const HouseholdManagementMap = dynamic(
    () => import("@/components/household/HouseholdManagementMap").then((m) => m.HouseholdManagementMap),
    { ssr: false }
);

export default function HouseholdManagementPage() {
    const allHouseholds = useMemo<HouseholdProfile[]>(() => getHouseholdProfiles(HOUSEHOLDS), []);
    const [selectedHousehold, setSelectedHousehold] = useState<HouseholdProfile | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const summary = useMemo(() => {
        const totalWastePerDay = allHouseholds.reduce((acc, hh) => acc + hh.waste, 0);
        const totalReports = allHouseholds.reduce((acc, hh) => acc + hh.reportCount, 0);
        const red = allHouseholds.filter((hh) => hh.status === "red").length;
        const yellow = allHouseholds.filter((hh) => hh.status === "yellow").length;
        const green = allHouseholds.filter((hh) => hh.status === "green").length;

        return { totalWastePerDay, totalReports, red, yellow, green };
    }, [allHouseholds]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
            <div className="shrink-0 px-6 pt-4 pb-3 bg-white border-b border-gray-200">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý hộ gia đình - Đà Nẵng</h1>
                        <p className="text-sm text-gray-500 mt-1">Bản đồ vị trí hộ dân, thống kê rác hàng tháng, lịch sử hình ảnh.</p>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                        <p>Hộ dân: <strong>{allHouseholds.length}</strong></p>
                        <p>Ngày: <strong>{new Date().toLocaleDateString("vi-VN")}</strong></p>
                        <p>Tổng rác/ngày: <strong>{summary.totalWastePerDay.toFixed(1)} kg</strong></p>
                        <p>Báo cáo: <strong>{summary.totalReports}</strong></p>
                        <p>Trạng thái: <strong className="text-red-500">{summary.red}</strong> | <strong className="text-amber-500">{summary.yellow}</strong> | <strong className="text-emerald-500">{summary.green}</strong></p>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 p-4">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-full">
                    <div className="xl:col-span-3 h-[calc(100vh-120px)]">
                        <HouseholdManagementMap
                            households={allHouseholds}
                            selectedHouseholdId={selectedHousehold?.id ?? null}
                            onHouseholdSelect={(household) => {
                                setSelectedHousehold(household);
                                setIsDialogOpen(true);
                            }}
                            loading={false}
                        />
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="max-w-none">
                            <DialogTitle>Chi tiết hộ gia đình</DialogTitle>
                            <DialogDescription>
                                Xem thông tin toàn diện, thành viên, rác thải, ảnh và báo cáo.
                            </DialogDescription>
                            {selectedHousehold && (
                                <HouseholdDetailsPanel household={selectedHousehold} reports={WASTE_REPORTS} />
                            )}
                            <DialogClose asChild>
                                <button className="mt-4 rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold">Đóng</button>
                            </DialogClose>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}