export type AreaStatus = "red" | "yellow" | "green";

export interface Household {
  id: number;
  wardId: number;
  name: string;
  lat: number;
  lng: number;
  waste: number; // kg/month
  status: AreaStatus;
}

export interface UrbanArea {
  id: number;
  name: string;
  lat: number;
  lng: number;
  totalWaste: number;
  status: AreaStatus;
  reports: number;
  bounds?: [number, number][]; // polygon corners [[lat, lng], ...]
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

export type ReportStatus = "pending" | "assigned" | "done";

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
    other: number;
  };
}
