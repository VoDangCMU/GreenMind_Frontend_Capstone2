"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { clusterReports } from "@/lib/clustering";
import { CampaignModal } from "@/components/campaign/CampaignModal";
import { CampaignRegion, WasteReport, WasteType, ReportStatus } from "@/types/waste-report";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, MapPin, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getAccessToken } from "@/lib/auth";

// Dynamically import Map to prevent SSR issues
const CampaignMap = dynamic(
  () => import("@/components/campaign/CampaignMap").then((mod) => mod.CampaignMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] flex items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }
);

export default function CampaignManagementPage() {
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const token = getAccessToken();
        const res = await fetch("https://vodang-api.gauas.com/waste-monitoring?limit=100", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        
        if (res.ok) {
          const apiData = await res.json();
          const rawList: any[] = Array.isArray(apiData) ? apiData : (apiData?.data ?? []);
          
          const wasteTypeMap: Record<string, WasteType> = {
            plastic: "plastic",
            organic: "organic",
            hazardous: "hazardous",
            mixed: "mixed",
          };
          const statusMap: Record<string, ReportStatus> = {
            pending: "pending",
            assigned: "assigned",
            done: "done",
            collected: "done",
            resolved: "done",
          };

          const validReports: WasteReport[] = rawList.map((r: any) => ({
            id: r.id,
            code: r.code || "",
            householdId: 0,
            householdName: r.reportedBy || "Không rõ",
            wardId: 0,
            wardName: r.wardName || "Không rõ",
            lat: r.lat ?? 0,
            lng: r.lng ?? 0,
            wasteKg: r.wasteKg || 0,
            wasteType: wasteTypeMap[r.wasteType] ?? "mixed",
            description: r.description || "Không có nội dung",
            status: statusMap[r.status] ?? "pending",
            reportedAt: r.createdAt || new Date().toISOString(),
            assignedTo: r.assignedTo || null,
            collectorId: r.collectorId || null,
            resolvedAt: r.resolvedAt || null,
            imageUrl: r.imageUrl || null,
            imageEvidenceUrl: r.imageEvidenceUrl || null,
          }));
          
          setReports(validReports);
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  // Cluster reports whenever reports change
  const regions = useMemo(() => {
    return clusterReports(reports, 500);
  }, [reports]);

  // Mock chart data for previous months + current month dynamically
  const campaignChartData = useMemo(() => [
    { month: "T10", count: 12 },
    { month: "T11", count: 15 },
    { month: "T12", count: 18 },
    { month: "T01", count: 14 },
    { month: "T02", count: 20 },
    { month: "T03", count: 25 },
    { month: "T04", count: regions.length || 23 },
  ], [regions.length]);

  const selectedRegion = useMemo(() => {
    return regions.find(r => r.id === selectedRegionId) || null;
  }, [regions, selectedRegionId]);

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col gap-6 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trash cleanup campaign</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Group trash reports to plan cleanup (500m radius)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 flex-1">
        {/* Sidebar List */}
        <Card className="lg:col-span-1 shadow-sm border-slate-200 flex flex-col min-h-0 overflow-hidden">
          <Tabs defaultValue="list" className="flex flex-col flex-1 min-h-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0 rounded-t-xl space-y-3">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Khu vực cần xử lý ({regions.length})
                {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />}
              </h2>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">Danh sách</TabsTrigger>
                <TabsTrigger value="stats">Thống kê</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="list" className="flex-1 min-h-0 overflow-hidden m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-3">
                  {regions.map((region) => (
                    <div
                      key={region.id}
                      onClick={() => setSelectedRegionId(region.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedRegionId === region.id
                        ? "bg-primary/5 border-primary/20 shadow-sm ring-1 ring-primary/20"
                        : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm"
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-slate-800">{region.name}</h3>
                        <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100">
                          {region.reports.length} báo cáo
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-500 mb-4">
                        Tâm: {region.center.lat.toFixed(4)}, {region.center.lng.toFixed(4)}
                      </div>

                      {selectedRegionId === region.id && (
                        <Button
                          className="w-full text-xs h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsModalOpen(true);
                          }}
                        >
                          Tạo chiến dịch
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className="flex-1 min-h-0 overflow-y-auto m-0 data-[state=inactive]:hidden p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Chiến dịch theo tháng</h3>
              <p className="text-xs text-slate-500 mb-4">Số lượng dự kiến và đã thực hiện</p>
              
              <div className="h-[200px] w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Chiến dịch"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  Tháng này có <span className="font-bold text-lg">{regions.length}</span> chiến dịch chờ triển khai dựa trên cụm điểm đen rác thải thực tế trên bản đồ.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Map View */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative min-h-[400px]">
          <CampaignMap
            regions={regions}
            selectedRegionId={selectedRegionId}
            onRegionSelect={(region) => setSelectedRegionId(region ? region.id : null)}
            radiusInMeters={500}
          />
        </div>
      </div>

      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        region={selectedRegion}
      />
    </div>
  );
}
