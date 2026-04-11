"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CampaignRegion } from "@/types/waste-report";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle } from "lucide-react";

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  region: CampaignRegion | null;
}

export function CampaignModal({ isOpen, onClose, region }: CampaignModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (!isOpen || !region) return null;

  // Bỏ chặn quyền cho môi trường dev, mọi user đều có thể tạo chiến dịch
  const isEligible = true; // user?.role === "Tổ trưởng tổ dân phố";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return;

    // Implementation for creating the campaign would go here.
    alert(`Tạo chiến dịch: ${name} thành công!`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tạo chiến dịch dọn rác</DialogTitle>
          <DialogDescription>
            Khu vực: {region.name} ({region.reports.length} báo cáo)
          </DialogDescription>
        </DialogHeader>

        {!isEligible ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 flex items-start gap-3 my-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Không đủ quyền truy cập</p>
              <p>Chỉ người có chức vụ "Tổ trưởng tổ dân phố" mới được phép tạo Chiến dịch dọn rác.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên chiến dịch</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Chủ nhật xanh khu vực A..."
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                <Label>Bán kính (m)</Label>
                <Input value="500" disabled />
              </div>
              <div className="grid gap-2">
                <Label>Tọa độ tâm</Label>
                <Input value={`${region.center.lat.toFixed(4)}, ${region.center.lng.toFixed(4)}`} disabled />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit">Tạo chiến dịch</Button>
            </DialogFooter>
          </form>
        )}
        
        {!isEligible && (
          <DialogFooter>
             <Button type="button" variant="outline" onClick={onClose}>
                Đóng
              </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
