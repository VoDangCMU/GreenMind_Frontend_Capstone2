"use client";

import dynamic from "next/dynamic";
import { useMemo, useEffect, useState } from "react";
import { getAllHouseholdProfiles, getHouseholdDetectionHistoryByHousehold, mapHouseholdDetectionRecordsToImageHistory } from "@/lib/household";
import { HouseholdDetailsPanel } from "@/components/household/HouseholdDetailsPanel";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import type { HouseholdProfile } from "@/types/monitoring";

const HouseholdManagementMap = dynamic(
    () => import("@/components/household/HouseholdManagementMap").then((m) => m.HouseholdManagementMap),
    { ssr: false }
);

export default function HouseholdManagementPage() {
    const [allHouseholds, setAllHouseholds] = useState<HouseholdProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [selectedHousehold, setSelectedHousehold] = useState<HouseholdProfile | null>(null);
    const [selectedHouseholdHistory, setSelectedHouseholdHistory] = useState<HouseholdProfile["imageHistory"] | undefined>(undefined);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const fetchHouseholds = async () => {
            setIsLoading(true);
            setApiError(null);

            try {
                const profiles = await getAllHouseholdProfiles();

                if (!cancelled) {
                    setAllHouseholds(profiles);
                }
            } catch (error: any) {
                if (!cancelled) {
                    setApiError(error?.message ?? 'Unknown error');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchHouseholds();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!selectedHousehold?.externalId) {
            setSelectedHouseholdHistory(undefined);
            setHistoryLoading(false);
            setHistoryError(null);
            return;
        }

        let cancelled = false;
        setSelectedHouseholdHistory(undefined);
        setHistoryLoading(true);
        setHistoryError(null);

        const loadHouseholdHistory = async () => {
            try {
                const records = await getHouseholdDetectionHistoryByHousehold(selectedHousehold.externalId!);
                if (!cancelled) {
                    setSelectedHouseholdHistory(mapHouseholdDetectionRecordsToImageHistory(records));
                }
            } catch (error: any) {
                if (!cancelled) {
                    setHistoryError(error?.message ?? "Failed to load detection history");
                    setSelectedHouseholdHistory([]);
                }
            } finally {
                if (!cancelled) {
                    setHistoryLoading(false);
                }
            }
        };

        loadHouseholdHistory();

        return () => {
            cancelled = true;
        };
    }, [selectedHousehold?.externalId]);

    const summary = useMemo(() => {
        const totalWastePerDay = allHouseholds.reduce((acc, hh) => acc + hh.waste, 0);
        const totalReports = allHouseholds.reduce((acc, hh) => acc + hh.reportCount, 0);
        const totalImageUploads = allHouseholds.reduce((acc, hh) => acc + (hh.imageHistory?.length ?? 0), 0);
        const red = allHouseholds.filter((hh) => hh.status === "red").length;
        const yellow = allHouseholds.filter((hh) => hh.status === "yellow").length;
        const green = allHouseholds.filter((hh) => hh.status === "green").length;

        return { totalWastePerDay, totalReports, totalImageUploads, red, yellow, green };
    }, [allHouseholds]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-sky-50">
            <div className="shrink-0 px-6 pt-4 pb-3 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Household Management - Da Nang</h1>
                        <p className="text-sm text-slate-500 mt-1">Household locations, monthly waste metrics, and image history.</p>
                    </div>
                    <div className="text-sm text-slate-600 space-y-2 rounded-xl bg-white p-3 shadow-sm border border-gray-200">
                        {isLoading && <p>Loading household data...</p>}
                        {apiError && <p className="text-red-600">API error: {apiError}</p>}
                        {!isLoading && !apiError && (
                            <>
                                <p>Households: <strong>{allHouseholds.length}</strong></p>
                                <p>Date: <strong>{new Date().toLocaleDateString("en-US")}</strong></p>
                                <p>Total detections: <strong>{summary.totalReports}</strong></p>
                                <p>Total image uploads: <strong>{summary.totalImageUploads}</strong></p>
                                <p>Status:
                                    <span className="ml-2 px-2 py-1 rounded-md bg-red-100 text-red-700">{summary.red}</span>
                                    <span className="ml-2 px-2 py-1 rounded-md bg-amber-100 text-amber-700">{summary.yellow}</span>
                                    <span className="ml-2 px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">{summary.green}</span>
                                </p>
                            </>
                        )}
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
                            loading={isLoading}
                        />
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="w-[90vw] max-w-[90vw] sm:w-[75vw] sm:max-w-[75vw] h-[90vh] max-h-[90vh] overflow-hidden">
                            <DialogTitle>Household Details</DialogTitle>
                            <DialogDescription>
                                View full household information, members, waste, images and reports.
                            </DialogDescription>
                            {selectedHousehold && (
                                <HouseholdDetailsPanel
                                    household={selectedHousehold}
                                    imageHistory={selectedHouseholdHistory}
                                    imageHistoryLoading={historyLoading}
                                    historyError={historyError}
                                />
                            )}
                            <DialogClose asChild>
                                <button className="mt-4 rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold">Close</button>
                            </DialogClose>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}