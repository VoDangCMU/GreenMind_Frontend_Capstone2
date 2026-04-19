"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Campaign } from "@/types/campaign";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  MessageCircle,
  BarChart3,
  MapPin,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAccessToken } from "@/lib/auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CampaignChatPanel } from "@/components/campaign/CampaignChatPanel";

// ── Suspense wrapper vì useSearchParams cần boundary trong App Router ─────────
export default function CampaignManagementPage() {
  return (
    <Suspense fallback={<CampaignPageLoading />}>
      <CampaignManagementContent />
    </Suspense>
  );
}

function CampaignPageLoading() {
  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col gap-6 overflow-hidden bg-slate-50">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="h-4 bg-slate-200 rounded w-96" />
        <div className="h-[600px] bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main content — dùng useSearchParams bên trong Suspense ──────────────────
function CampaignManagementContent() {
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Campaign được chọn để chat — null = hiển thị biểu đồ
  // Ưu tiên từ URL query, fallback vào state user chọn
  const urlCampaignId = searchParams.get("campaignId");
  const [userSelectedCampaign, setUserSelectedCampaign] = useState<Campaign | null>(null);

  // selectedCampaign = campaign từ URL (ưu tiên cao nhất) hoặc user tự chọn
  const selectedCampaign = (() => {
    if (urlCampaignId) {
      return campaigns.find((c) => c.id === urlCampaignId) ?? null;
    }
    return userSelectedCampaign;
  })();

  // Khi URL có campaignId, đồng bộ campaigns list → auto-select
  useEffect(() => {
    if (urlCampaignId && campaigns.length > 0) {
      const found = campaigns.find((c) => c.id === urlCampaignId);
      if (found) setUserSelectedCampaign(found);
    }
  }, [urlCampaignId, campaigns]);

  // Chart state
  const [chartMode, setChartMode] = useState<"day" | "month" | "year">("day");

  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
      try {
        const token = getAccessToken();
        const res = await fetch("https://vodang-api.gauas.com/campaigns?limit=100", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store",
        });
        if (res.ok) {
          const apiData = await res.json();
          const rawList: any[] = Array.isArray(apiData) ? apiData : (apiData?.data ?? []);
          setCampaigns(rawList);
        }
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  const renderStatus = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Đã hoàn thành</Badge>;
      case "ONGOING":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Đang diễn ra</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">Sắp diễn ra</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-600 hover:bg-red-200 border-none">Đã hủy</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none">{status ?? "Không rõ"}</Badge>;
    }
  };

  // ─── CHART AGGREGATION ──────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    if (campaigns.length === 0) return [];

    campaigns.forEach((c) => {
      if (!c.startDate) return;
      const d = new Date(c.startDate);
      let dateStr = "";
      if (chartMode === "day") {
        dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      } else if (chartMode === "month") {
        dateStr = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      } else {
        dateStr = `${d.getFullYear()}`;
      }
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });

    const entries = Object.entries(counts).map(([date, count]) => ({ date, count }));
    entries.sort((a, b) => {
      if (chartMode === "day") {
        const [d1, m1, y1] = a.date.split("/");
        const [d2, m2, y2] = b.date.split("/");
        if (y1 !== y2) return parseInt(y1) - parseInt(y2);
        if (m1 !== m2) return parseInt(m1) - parseInt(m2);
        return parseInt(d1) - parseInt(d2);
      } else if (chartMode === "month") {
        const [m1, y1] = a.date.split("/");
        const [m2, y2] = b.date.split("/");
        if (y1 !== y2) return parseInt(y1) - parseInt(y2);
        return parseInt(m1) - parseInt(m2);
      } else {
        return parseInt(a.date) - parseInt(b.date);
      }
    });
    return entries;
  }, [campaigns, chartMode]);

  const pendingCount   = campaigns.filter((c) => c.status?.toUpperCase() === "PENDING").length;
  const ongoingCount   = campaigns.filter((c) => c.status?.toUpperCase() === "ONGOING").length;
  const completedCount = campaigns.filter((c) => c.status?.toUpperCase() === "COMPLETED").length;

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col gap-6 overflow-hidden bg-slate-50">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Chiến dịch</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Theo dõi mật độ tạo chiến dịch và điều phối đợt ra quân tình nguyện.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 flex-1">

        {/* ══ Cột trái: Danh sách chiến dịch ══════════════════════════════════ */}
        <Card className="lg:col-span-5 xl:col-span-4 shadow-sm border-slate-200 flex flex-col min-h-0 overflow-hidden bg-white">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Tất cả Chiến dịch
            </h2>
            <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700">
              {campaigns.length}
            </Badge>
          </div>

          <ScrollArea className="flex-1 min-h-0 p-3">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Không có chiến dịch nào được ghi nhận.
              </div>
            ) : (
              <div className="space-y-2.5 pb-4">
                {campaigns.map((campaign) => {
                  const isSelected = selectedCampaign?.id === campaign.id;
                  return (
                    <div
                      key={campaign.id}
                      onClick={() => setUserSelectedCampaign(isSelected ? null : campaign)}
                      className={`p-3.5 rounded-xl cursor-pointer transition-all border group ${
                        isSelected
                          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100 shadow-sm"
                          : "border-slate-100 bg-white hover:border-blue-300 hover:shadow-sm hover:ring-2 ring-blue-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h3
                          className={`font-bold text-sm leading-snug transition-colors ${
                            isSelected ? "text-blue-700" : "text-slate-800 group-hover:text-blue-700"
                          }`}
                        >
                          {campaign.name}
                        </h3>
                        <div className="shrink-0">{renderStatus(campaign.status)}</div>
                      </div>

                      <div className="text-xs font-medium text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(campaign.startDate).toLocaleDateString("vi-VN")}
                        </span>
                        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">
                          <Users className="w-3 h-3 text-emerald-500" />
                          {campaign.participantsCount ?? campaign.participants?.length ?? 0} tham gia
                        </span>
                      </div>

                      {/* Hint khi hover */}
                      {!isSelected && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MessageCircle className="w-3 h-3" />
                          Click để mở chat chiến dịch
                        </div>
                      )}
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-500">
                          <MessageCircle className="w-3 h-3" />
                          Đang xem chat
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* ══ Cột phải: Stats + (Chart | Chat) ════════════════════════════════ */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 min-h-0">

          {/* Quick Stats — luôn hiển thị */}
          <div className="grid grid-cols-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0 divide-x divide-slate-100">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Tổng</p>
                <p className="text-2xl font-black text-slate-800">{campaigns.length}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">Sắp diễn ra</p>
                <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Đang diễn ra</p>
                <p className="text-2xl font-black text-blue-700">{ongoingCount}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">Hoàn thành</p>
                <p className="text-2xl font-black text-emerald-700">{completedCount}</p>
              </div>
            </div>
          </div>

          {/* ── Khu vực chính: Chart ↔ Chat ──────────────────────────────────── */}
          <Card className="flex-1 min-h-0 shadow-sm border-slate-200 flex flex-col overflow-hidden bg-white">
            {selectedCampaign ? (
              /* ── CHAT VIEW ──────────────────────────────────────────────────── */
              <>
                {/* Header campaign khi đang chat */}
                <div className="px-5 py-3.5 border-b border-slate-100 bg-white shrink-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4.5 h-4.5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate leading-tight">
                        {selectedCampaign.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {renderStatus(selectedCampaign.status)}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(selectedCampaign.startDate).toLocaleDateString("vi-VN")}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {selectedCampaign.participantsCount ?? selectedCampaign.participants?.length ?? 0} người
                        </span>
                        {(selectedCampaign as any).lat && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {Number((selectedCampaign as any).lat).toFixed(3)}, {Number((selectedCampaign as any).lng).toFixed(3)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nút quay lại biểu đồ */}
                  <button
                    onClick={() => setUserSelectedCampaign(null)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all border border-slate-200"
                    title="Quay lại biểu đồ"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Biểu đồ
                  </button>
                </div>

                {/* Chat panel chiếm toàn bộ phần còn lại */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <CampaignChatPanel campaignId={selectedCampaign.id} />
                </div>
              </>
            ) : (
              /* ── CHART VIEW ─────────────────────────────────────────────────── */
              <div className="flex flex-col h-full p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 shrink-0">
                  <div>
                    <h2 className="font-bold text-lg text-slate-800 mb-1">
                      Tần suất tổ chức chiến dịch theo{" "}
                      {chartMode === "day" ? "ngày" : chartMode === "month" ? "tháng" : "năm"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Click vào một chiến dịch bên trái để mở chat nhóm.
                    </p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                    {(["day", "month", "year"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setChartMode(mode)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          chartMode === mode
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {mode === "day" ? "Ngày" : mode === "month" ? "Tháng" : "Năm"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#f1f5f9" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          fontWeight: "bold",
                        }}
                        labelStyle={{ color: "#64748b", fontSize: "12px", marginBottom: "4px", fontWeight: "normal" }}
                        formatter={(value: any) => [`${value} chiến dịch`, "Số lượng"]}
                      />
                      <Bar
                        dataKey="count"
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={60}
                        label={{ position: "top", fill: "#3b82f6", fontSize: 12, fontWeight: "bold", dy: -8 }}
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Hint chưa chọn campaign */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400 shrink-0">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chọn một chiến dịch từ danh sách bên trái để xem chat nhóm
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
