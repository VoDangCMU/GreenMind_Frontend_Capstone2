"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Campaign, CampaignParticipant } from "@/types/campaign";
import { getAccessToken } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, MapPin, UserCircle, Users, AlertCircle, Loader2, MessageCircle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampaignChatPanel } from "@/components/campaign/CampaignChatPanel";

interface CampaignDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string | null;
}

type ActiveTab = "info" | "chat";

export function CampaignDetailModal({ isOpen, onClose, campaignId }: CampaignDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("info");

  useEffect(() => {
    if (!isOpen || !campaignId) return;
    // Reset tab về info khi mở modal mới
    setActiveTab("info");

    let isMounted = true;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const token = getAccessToken();
        const res = await fetch(`https://vodang-api.gauas.com/campaigns/${campaignId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Lỗi khi tải dữ liệu chiến dịch");
        }
        
        const data = await res.json();
        if (isMounted) {
          setDetail(data);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetail();

    return () => { isMounted = false; };
  }, [isOpen, campaignId]);

  const renderStatus = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <Badge className="bg-emerald-100 text-emerald-700 border-none">Đã hoàn thành</Badge>;
      case "ONGOING":
        return <Badge className="bg-blue-100 text-blue-700 border-none">Đang diễn ra</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-700 border-none">Sắp diễn ra</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-600 border-none">Đã hủy</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 border-none">{status ?? "Không rõ"}</Badge>;
    }
  };

  const renderParticipantStatus = (status: "REGISTERED" | "CHECKED_IN" | "COMPLETED") => {
    switch (status) {
      case "COMPLETED":
        return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành</span>;
      case "CHECKED_IN":
        return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full"><MapPin className="w-3.5 h-3.5" /> Đã điểm danh</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full"> Đăng ký</span>;
    }
  };

  const finalParticipants: CampaignParticipant[] = detail?.participants || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-7xl w-[97vw] p-0 overflow-hidden flex flex-col max-h-[90vh] bg-slate-50">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center justify-between mt-1">
            <span>Thông tin Chiến dịch</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
           <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-4" />
              <p className="text-sm text-slate-500">Đang tải chi tiết...</p>
           </div>
        ) : error ? (
           <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white">
              <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 font-medium hover:bg-slate-200"
              >
                 Đóng
              </button>
           </div>
        ) : detail ? (
           <div className="flex-1 min-h-0 flex overflow-hidden">

             {/* ── LEFT: Info + Participants ──────────────────── */}
             <div className="flex flex-col min-h-0 overflow-hidden border-r border-slate-100" style={{ width: "58%" }}>

               {/* Header Info Banner */}
               <div className="px-6 py-4 bg-white border-b border-slate-100 shrink-0">
                 <div className="flex items-start justify-between mb-3 mt-1">
                   <div className="pr-6">
                     <h2 className="text-xl font-bold text-slate-900 mb-1">{detail.name}</h2>
                     <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{detail.description || "Không có mô tả chi tiết."}</p>
                   </div>
                   <div className="shrink-0">{renderStatus(detail.status)}</div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 mt-3">
                   {detail.createdBy?.fullName && (
                     <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl p-3">
                       <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                         <UserCircle className="w-5 h-5 text-slate-500" />
                       </div>
                       <div className="min-w-0">
                         <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Người tổ chức</p>
                         <p className="font-semibold text-slate-800 text-sm truncate">{detail.createdBy.fullName}</p>
                       </div>
                     </div>
                   )}

                   <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                       <Calendar className="w-4 h-4 text-blue-600" />
                     </div>
                     <div className="min-w-0">
                       <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">Thời gian</p>
                       <p className="font-semibold text-blue-800 text-xs">
                         {new Date(detail.startDate).toLocaleDateString("vi-VN")} – {new Date(detail.endDate).toLocaleDateString("vi-VN")}
                       </p>
                     </div>
                   </div>

                   <div className="flex items-center gap-2.5 bg-purple-50 border border-purple-100 rounded-xl p-3">
                     <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                       <MapPin className="w-4 h-4 text-purple-600" />
                     </div>
                     <div className="min-w-0">
                       <p className="text-[10px] text-purple-400 font-medium uppercase tracking-wider">Vị trí</p>
                       <p className="font-semibold text-purple-800 text-xs">{detail.lat.toFixed(4)}, {detail.lng.toFixed(4)}</p>
                     </div>
                   </div>

                   <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                     <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                       <Users className="w-4 h-4 text-emerald-600" />
                     </div>
                     <div className="min-w-0">
                       <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Người tham gia</p>
                       <p className="font-bold text-emerald-800 text-lg">{detail.participantsCount ?? finalParticipants.length}</p>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Participants Table */}
               <div className="flex-1 min-h-0 flex flex-col bg-white">
                 <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
                   <h3 className="font-semibold text-slate-800 text-sm">Danh sách Người tham gia</h3>
                 </div>
                 <ScrollArea className="flex-1">
                   <Table>
                     <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                       <TableRow>
                         <TableHead className="w-[240px] pl-6">Người dùng</TableHead>
                         <TableHead>Trạng thái</TableHead>
                         <TableHead>Thay đổi lần cuối</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {finalParticipants.map((p) => (
                         <TableRow key={p.id}>
                           <TableCell className="pl-6">
                             <div className="flex items-center gap-3 py-1">
                               <UserCircle className="w-8 h-8 text-slate-300" />
                               <div>
                                 <p className="font-semibold text-slate-900 text-sm">{p.user?.fullName || "Người dùng ẩn danh"}</p>
                                 <p className="text-xs text-slate-500">{p.user?.email || p.user?.phoneNumber || p.user?.username || "Chưa cập nhật"}</p>
                               </div>
                             </div>
                           </TableCell>
                           <TableCell>{renderParticipantStatus(p.status)}</TableCell>
                           <TableCell className="text-xs text-slate-500">
                             {(() => {
                               const dateObj = p.checkOutTime || p.checkInTime || p.updatedAt || p.createdAt;
                               if (!dateObj) return "N/A";
                               try {
                                 return new Date(dateObj).toLocaleString("vi-VN", {
                                   hour: "2-digit", minute: "2-digit",
                                   day: "2-digit", month: "2-digit", year: "numeric"
                                 });
                               } catch { return "N/A"; }
                             })()}
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </ScrollArea>
               </div>
             </div>

             {/* ── RIGHT: Chat Panel ────────────────────────────── */}
             <div className="flex flex-col min-h-0" style={{ width: "42%" }}>
               {/* Tab header */}
               <div className="flex items-center gap-0 px-4 pt-3 pb-0 bg-white border-b border-slate-100 shrink-0">
                 <button
                   onClick={() => setActiveTab("info")}
                   className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                     activeTab === "info"
                       ? "border-blue-500 text-blue-600 bg-blue-50"
                       : "border-transparent text-slate-500 hover:text-slate-700"
                   }`}
                 >
                   <Info className="w-3.5 h-3.5" />
                   Tổng quan
                 </button>
                 <button
                   onClick={() => setActiveTab("chat")}
                   className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                     activeTab === "chat"
                       ? "border-blue-500 text-blue-600 bg-blue-50"
                       : "border-transparent text-slate-500 hover:text-slate-700"
                   }`}
                 >
                   <MessageCircle className="w-3.5 h-3.5" />
                   Chat nhóm
                 </button>
               </div>

               {/* Tab content */}
               <div className="flex-1 min-h-0 overflow-hidden">
                 {activeTab === "info" ? (
                   <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-slate-50">
                     <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                       <Info className="w-8 h-8 text-blue-500" />
                     </div>
                     <div>
                       <p className="font-semibold text-slate-700 text-base">Thông tin chiến dịch</p>
                       <p className="text-sm text-slate-400 mt-1">Xem thông tin chi tiết bên cột trái.</p>
                     </div>
                     <button
                       onClick={() => setActiveTab("chat")}
                       className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
                     >
                       <MessageCircle className="w-4 h-4" />
                       Mở Chat nhóm
                     </button>
                   </div>
                 ) : (
                   <CampaignChatPanel campaignId={campaignId!} />
                 )}
               </div>
             </div>

           </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
