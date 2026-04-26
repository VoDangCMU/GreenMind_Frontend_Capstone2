"use client";

import dynamic from "next/dynamic";
import { useMemo, useEffect, useState } from "react";
import { getAllHouseholdProfiles, getHouseholdDetectionHistoryByHousehold, getHouseholdGreenScoreHistory, mapHouseholdDetectionRecordsToImageHistory } from "@/lib/household";
import { HouseholdDetailsPanel } from "@/components/household/HouseholdDetailsPanel";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Leaderboard } from "@/components/blog/Leaderboard";
import type { HouseholdProfile } from "@/types/monitoring";
import { Users, TrendingUp, Award, MapPin, RefreshCw } from "lucide-react";
import type { LeaderboardUser } from "@/services/blog.service";

const HouseholdManagementMap = dynamic(
    () => import("@/components/household/HouseholdManagementMap").then((m) => m.HouseholdManagementMap),
    { ssr: false }
);

function StatCard({ icon: Icon, label, value, gradient, subLabel }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    gradient: string;
    subLabel?: string;
}) {
    return (
        <div
            className="relative overflow-hidden rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 p-3"
        >
            <div className="relative flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
                    {subLabel && <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{subLabel}</p>}
                </div>

                <div className={`shrink-0 p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
        </div>
    );
}

export default function HouseholdManagementPage() {
    const [allHouseholds, setAllHouseholds] = useState<HouseholdProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [selectedHousehold, setSelectedHousehold] = useState<HouseholdProfile | null>(null);
    const [selectedHouseholdHistory, setSelectedHouseholdHistory] = useState<HouseholdProfile["imageHistory"] | undefined>(undefined);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [selectedHouseholdGreenScores, setSelectedHouseholdGreenScores] = useState<HouseholdProfile["greenScores"] | undefined>(undefined);
    const [greenScoreLoading, setGreenScoreLoading] = useState(false);
    const [greenScoreError, setGreenScoreError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHouseholds = async () => {
        setIsLoading(true);
        setApiError(null);

        try {
            const profiles = await getAllHouseholdProfiles();
            setAllHouseholds(profiles);
        } catch (error: any) {
            setApiError(error?.message ?? 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHouseholds();
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

    useEffect(() => {
        const selectedExternalId = selectedHousehold?.externalId;
        if (!selectedExternalId) {
            setSelectedHouseholdGreenScores(undefined);
            setGreenScoreLoading(false);
            setGreenScoreError(null);
            return;
        }

        let cancelled = false;
        setSelectedHouseholdGreenScores(undefined);
        setGreenScoreLoading(true);
        setGreenScoreError(null);

        const loadGreenScoreHistory = async () => {
            try {
                const scores = await getHouseholdGreenScoreHistory(selectedExternalId);
                if (!cancelled) {
                    setSelectedHouseholdGreenScores(scores);

                    const sortedScores = scores
                        .slice()
                        .filter((item) => !Number.isNaN(new Date(item.createdAt).getTime()))
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    const latestScore = sortedScores.length ? sortedScores[sortedScores.length - 1].finalScore : undefined;

                    if (latestScore != null) {
                        setSelectedHousehold((prev) =>
                            prev && prev.externalId === selectedExternalId
                                ? { ...prev, greenScore: latestScore }
                                : prev
                        );

                        setAllHouseholds((prev) =>
                            prev.map((household) =>
                                household.externalId === selectedExternalId
                                    ? { ...household, greenScore: latestScore }
                                    : household
                            )
                        );
                    }
                }
            } catch (error: any) {
                if (!cancelled) {
                    setGreenScoreError(error?.message ?? "Failed to load green score history");
                    setSelectedHouseholdGreenScores([]);
                }
            } finally {
                if (!cancelled) {
                    setGreenScoreLoading(false);
                }
            }
        };

        loadGreenScoreHistory();

        return () => {
            cancelled = true;
        };
    }, [selectedHousehold?.externalId]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchHouseholds();
        setRefreshing(false);
    };

    const summary = useMemo(() => {
        const totalReports = allHouseholds.reduce((acc, hh) => acc + hh.reportCount, 0);
        const totalImageUploads = allHouseholds.reduce((acc, hh) => acc + (hh.imageHistory?.length ?? 0), 0);
        const red = allHouseholds.filter((hh) => hh.status === "red").length;
        const yellow = allHouseholds.filter((hh) => hh.status === "yellow").length;
        const green = allHouseholds.filter((hh) => hh.status === "green").length;
        const validScores = allHouseholds.filter(hh => hh.greenScore != null);
        const avgScore = validScores.length > 0
            ? Math.round(validScores.reduce((acc, hh) => acc + (hh.greenScore ?? 0), 0) / validScores.length)
            : 0;

        return { totalReports, totalImageUploads, red, yellow, green, avgScore };
    }, [allHouseholds]);

    const leaderboard = useMemo((): LeaderboardUser[] => {
        const sorted = allHouseholds
            .slice()
            .sort((a, b) => (b.greenScore ?? 0) - (a.greenScore ?? 0));

        return sorted.map((household, idx) => ({
            rank: idx + 1,
            userId: `household-${household.id}`,
            fullName: household.name.split(",")[0].trim(),
            username: household.name.split(",")[0].trim(),
            reportCount: household.greenScore ?? 0,
        }));
    }, [allHouseholds]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-300/20 blur-3xl animate-pulse-soft" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-br from-cyan-200/20 to-blue-300/10 blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative shrink-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="px-4 pt-3 pb-3">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        {/* Title */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
                                <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    Household Management
                                </h1>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Da Nang City • {allHouseholds.length} households
                                </div>
                            </div>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing || isLoading}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-xs transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
                        <StatCard
                            icon={Users}
                            label="Total Households"
                            value={allHouseholds.length}
                            gradient="from-emerald-500 to-teal-600"
                            subLabel="Registered"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Avg. Score"
                            value={summary.avgScore || "—"}
                            gradient="from-cyan-500 to-blue-600"
                            subLabel="Community avg"
                        />
                        <StatCard
                            icon={Award}
                            label="Top Score"
                            value={leaderboard[0]?.reportCount || "—"}
                            gradient="from-amber-500 to-orange-600"
                            subLabel={leaderboard[0]?.fullName || "No data"}
                        />
                        <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 p-3">
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2">Status Distribution</p>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold">{summary.green}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-xs font-bold">{summary.yellow}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold">{summary.red}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="relative flex-1 min-h-0 p-3 lg:p-4 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 lg:gap-4 h-full">
                    {/* Map Section */}
                    <div className="lg:col-span-3 xl:col-span-4 h-full">
                        <div className="relative h-full rounded-2xl overflow-hidden shadow-xl border border-white/20 dark:border-slate-700/50">
                            {/* Top accent line */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 z-20" />

                            {/* Decorative corner */}
                            <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 blur-2xl z-10" />

                            {apiError && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 rounded-2xl px-5 py-2.5 shadow-xl">
                                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                        Error: {apiError}
                                    </span>
                                </div>
                            )}

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
                    </div>

                    {/* Leaderboard Panel */}
                    <div className="lg:col-span-2 xl:col-span-1 h-full overflow-hidden">
                        <div className="h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-xl overflow-hidden">
                            <Leaderboard
                                leaderboard={leaderboard}
                                title="Top Households"
                                subtitle="Ranked by green score"
                                emptyTitle="No households yet"
                                emptySubtitle="Start tracking to see rankings"
                                hideAvatar
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent showCloseButton={false} className="w-[95vw] max-w-[95vw] lg:w-[85vw] lg:max-w-[85vw] h-[90vh] max-h-[90vh] overflow-hidden p-0">
                    <DialogTitle className="sr-only">Household Details</DialogTitle>
                    <DialogDescription className="sr-only">
                        View full household information, members, waste, images and reports.
                    </DialogDescription>
                    <div className="p-6 h-full overflow-y-auto">
                        {selectedHousehold && (
                            <HouseholdDetailsPanel
                                household={selectedHousehold}
                                imageHistory={selectedHouseholdHistory}
                                imageHistoryLoading={historyLoading}
                                historyError={historyError}
                                greenScoreHistory={selectedHouseholdGreenScores}
                                greenScoreLoading={greenScoreLoading}
                                greenScoreError={greenScoreError}
                            />
                        )}
                    </div>
                    <DialogClose asChild>
                        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-lg">
                            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </DialogClose>
                </DialogContent>
            </Dialog>

            {/* Global Styles for Animations */}
            <style>{`
                @keyframes fade-up {
                    from {
                        opacity: 0;
                        transform: translateY(16px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-up {
                    animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                }
                .animate-fade-up-delay-1 { animation-delay: 100ms; }
                .animate-fade-up-delay-2 { animation-delay: 200ms; }
                .animate-fade-up-delay-3 { animation-delay: 300ms; }
                .animate-pulse-soft {
                    animation: pulse-soft 4s ease-in-out infinite;
                }
                @keyframes pulse-soft {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
}
