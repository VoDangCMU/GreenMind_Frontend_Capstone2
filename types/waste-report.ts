export type AreaStatus = "red" | "yellow" | "green";

export interface Household {
  id: number;
  wardId: number;
  name: string;
  address: string; // tên đường thực tế
  lat: number;
  lng: number;
  waste: number; // kg/day (thực tế: 1.5–4.0 bình thường, ≥4.0 cảnh báo, ≥5.0 nguy hiểm)
  status: AreaStatus;
  reportCount: number; // số báo cáo đã gửi
}

export interface UrbanArea {
  id: number;
  name: string;
  district: string; // quận
  population: number; // số dân
  areaKm2: number; // diện tích km²
  lat: number;
  lng: number;
  totalWaste: number; // kg/day (phường: 1,300–13,500 kg/ngày tùy quy mô)
  status: AreaStatus;
  reports: number; // pending reports
  bounds?: [number, number][]; // polygon corners [[lat, lng], ...]
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

// ─── Waste Report (Báo cáo rác từ hộ dân) ──────────────────────────────────

export type WasteType = "plastic" | "organic" | "mixed" | "hazardous";
export type ReportStatus = "pending" | "assigned" | "done";

export interface WasteReport {
  id: string;
  code: string;
  householdId: number;
  householdName: string;
  wardId: number;
  wardName: string;
  lat: number;
  lng: number;
  wasteKg: number;
  wasteType: WasteType;
  description: string;
  status: ReportStatus;
  reportedAt: string;
  assignedTo: string | null;
  collectorId: string | null;
  resolvedAt: string | null;
  imageUrl: string | null;           // ảnh báo cáo rác ban đầu
  imageEvidenceUrl: string | null;   // ảnh bằng chứng sau khi thu gom (status done)
}

// ─── Collector (Người thu gom rác) ─────────────────────────────────────────

export interface Collector {
  id: string;
  name: string;
  phone: string;
  zones: number[]; // wardId[] phụ trách
  vehicleId: string;
  activeReports: number;
}

// ─── Report (legacy — dùng cho ReportList từ API) ──────────────────────────

export interface Report {
  id: number;
  area: string;
  desc: string;
  status: ReportStatus;
  time: string;
}

export interface AreaDetail {
  name: string;
  households: number;
  totalWaste: number;
  plasticRatio: number;
  pendingReports: number;
  wasteTrend: { date: string; waste: number }[];
  plasticByMonth: { month: string; plastic: number }[];
  electricityByMonth: { month: string; kwh: number }[];
  emissionTrend: { date: string; emission: number }[];
}

export interface Summary {
  totalWaste: number;
  urbanAreas: number;
  pendingReports: number;
  wasteDistribution: {
    plastic: number;
    organic: number;
    mixed: number;
    hazardous: number;
  };
}

// ─── Environmental Alert Marker ────────────────────────────────────────────

export type AlertLevel = "normal" | "warning" | "critical";

export interface EnvAlert {
  id: number;
  lat: number;
  lng: number;
  wardName: string;
  level: AlertLevel;
  description?: string; // mô tả ngắn (tuỳ chọn)
}
