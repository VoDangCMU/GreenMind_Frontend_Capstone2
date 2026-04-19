"use client";

import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label }    from "@/components/ui/label";
import { CampaignRegion } from "@/types/waste-report";
import { useState } from "react";
import { getAccessToken } from "@/lib/auth";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { createBlog } from "@/services/blog.service";

const API_BASE = "https://vodang-api.gauas.com";

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  region: CampaignRegion | null;
  onSuccess?: () => void;          // callback để reload list sau khi tạo xong
}

export function CampaignModal({ isOpen, onClose, region, onSuccess }: CampaignModalProps) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [radius,      setRadius]      = useState(500);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !region) return null;

  const reportIds = region.reports.map((r) => r.id);

  const resetForm = () => {
    setName(""); setDescription(""); setStartDate(""); setEndDate("");
    setRadius(500); setError(null); setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = getAccessToken();
      const body = {
        name,
        description,
        startDate,
        endDate,
        lat:       region.center.lat,
        lng:       region.center.lng,
        radius,
        reportIds,
      };

      const res = await fetch(`${API_BASE}/campaigns`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Lỗi ${res.status}`);
      }

      const campaignData = await res.json();
      const campaignId: string = campaignData?.id ?? campaignData?.data?.id ?? "";

      // Auto-create a community blog post for this campaign (fire-and-forget)
      const startFormatted = startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "?";
      const endFormatted   = endDate   ? new Date(endDate).toLocaleDateString("vi-VN")   : "?";
      const blogContent = `<p><strong>${name}</strong></p>
<p>${description}</p>
<p>Thời gian: <strong>${startFormatted}</strong> – <strong>${endFormatted}</strong></p>
<p>Khu vực: ${region.name}</p>
${campaignId ? `<p><a href="/dashboard/campaign-management?id=${campaignId}" target="_blank" rel="noopener">Xem chiến dịch: ${name}</a></p>` : ""}`;

      createBlog({
        title:   `[Chiến dịch] ${name}`,
        content: blogContent,
        tags:    ["chiến dịch", "tình nguyện"],
      }).catch(() => { /* silent – campaign already created */ });

      setSuccess(true);
      onSuccess?.();

      // Tự đóng sau 1.5 giây để người dùng thấy thông báo thành công
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tạo chiến dịch dọn rác</DialogTitle>
          <DialogDescription>
            Khu vực: <span className="font-semibold text-gray-700">{region.name}</span>
            {" "}({reportIds.length} báo cáo được liên kết)
          </DialogDescription>
        </DialogHeader>

        {/* ── Success state ── */}
        {success ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="text-base font-semibold text-emerald-700">Tạo chiến dịch thành công!</p>
            <p className="text-sm text-gray-400">Cửa sổ sẽ tự đóng...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Tên chiến dịch */}
            <div className="grid gap-2">
              <Label htmlFor="camp-name">Tên chiến dịch <span className="text-red-500">*</span></Label>
              <Input
                id="camp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Chủ nhật xanh khu vực A..."
                required
                disabled={loading}
              />
            </div>

            {/* Mô tả */}
            <div className="grid gap-2">
              <Label htmlFor="camp-desc">Mô tả <span className="text-red-500">*</span></Label>
              <Textarea
                id="camp-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết mục tiêu chiến dịch..."
                rows={3}
                required
                disabled={loading}
              />
            </div>

            {/* Ngày bắt đầu / kết thúc */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="camp-start">Ngày bắt đầu <span className="text-red-500">*</span></Label>
                <Input
                  id="camp-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="camp-end">Ngày kết thúc <span className="text-red-500">*</span></Label>
                <Input
                  id="camp-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Bán kính + Tọa độ */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="camp-radius">Bán kính (m) <span className="text-red-500">*</span></Label>
                <Input
                  id="camp-radius"
                  type="number"
                  min={50}
                  max={5000}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label>Tọa độ tâm</Label>
                <Input
                  value={`${region.center.lat.toFixed(6)}, ${region.center.lng.toFixed(6)}`}
                  disabled
                  className="bg-gray-50 text-gray-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Report IDs preview */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              <span className="font-semibold text-gray-600">Báo cáo liên kết ({reportIds.length}):</span>
              <span className="ml-1 font-mono">{reportIds.slice(0, 3).map(id => id.slice(0, 8)).join(", ")}{reportIds.length > 3 ? ` +${reportIds.length - 3} khác` : ""}</span>
            </div>

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading} className="min-w-[130px]">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </span>
                ) : "Tạo chiến dịch"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
