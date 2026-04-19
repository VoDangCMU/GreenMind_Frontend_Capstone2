export type AreaStatus = "red" | "yellow" | "green";

export interface Household {
  id: number;
  wardId: number;
  externalId?: string;
  name: string;
  address: string; 
  lat: number;
  lng: number;
  waste: number; 
  status: AreaStatus;
  reportCount: number; 
}

export interface HouseholdMember {
  name: string;
  wasteKg: number;
  role: string;
}

export interface HouseholdWasteHistory {
  month: string; 
  totalWasteKg: number;
  plasticKg: number;
  organicKg: number;
  mixedKg: number;
  hazardousKg: number;
  pollution?: PollutionMetrics;
  pollutionCO2: number;
  pollutionDioxin: number;
  pollutionMicroplastic: number;
  pollutionNonBiodegradable: number;
}

export interface PollutionMetrics {
  Cd: number;
  Hg: number;
  Pb: number;
  CH4: number;
  CO2: number;
  NOx: number;
  SO2: number;
  'PM2.5': number;
  dioxin: number;
  nitrate: number;
  styrene: number;
  microplastic: number;
  toxic_chemicals: number;
  chemical_residue: number;
  non_biodegradable: number;
}

export interface HouseholdImageHistory {
  id: string | number;
  uploadedAt: string;
  imageUrl: string;
  label: string;
  sender?: string;
  items?: WasteReportItem[];
  total_objects?: number;
  pollution?: PollutionMetrics;
  caption?: string;
}

export interface HouseholdGreenScoreItem {
  id: string;
  previousScore: number;
  delta: number;
  finalScore: number;
  householdId: string;
  items?: WasteReportItem[] | null;
  reasons?: string[] | null;
  createdAt: string;
}

export interface HouseholdProfile extends Household {
  familySize: number;
  members: HouseholdMember[];
  wasteHistory: HouseholdWasteHistory[];
  imageHistory: HouseholdImageHistory[];
  greenScore?: number;
  greenScores?: HouseholdGreenScoreItem[];
}

export interface UrbanArea {
  id: number;
  name: string;
  district: string; 
  population: number; 
  areaKm2: number; 
  lat: number;
  lng: number;
  totalWaste: number; 
  status: AreaStatus;
  reports: number; 
  bounds?: [number, number][]; 
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}



export type WasteType = "plastic" | "organic" | "mixed" | "hazardous";
export type ReportStatus = "pending" | "assigned" | "done";

export interface WasteReportItem {
  name: string;
  quantity: number;
  area: number;
}

export interface WasteReport {
  id: string;
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
  reportedBy?: string;
  assignedTo: string | null;
  collectorId: number | null;
  resolvedAt: string | null;
  imageUrl?: string;
  items?: WasteReportItem[];
  total_objects?: number;
  pollution?: PollutionMetrics;
}

export interface Collector {
  id: number;
  name: string;
  phone: string;
  zones: number[]; 
  vehicleId: string;
  activeReports: number;
}



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
