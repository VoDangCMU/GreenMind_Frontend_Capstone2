

import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL
const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null


async function apiGet<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await axios.get(`${API_BASE}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    return response.data
  } catch (error) {
    console.warn(`API ${endpoint} failed:`, error)
    return null
  }
}

export type ActivityType =
  | "WASTE_CLASSIFICATION"
  | "GREEN_MEAL"
  | "ELECTRICITY_USAGE"
  | "TRASH_DISPOSAL"
  | "NOTE"

export interface Area {
  id: string
  name: string
  total_households: number
  total_waste: number
  plastic_percentage: number
  electricity_usage: number
  risk_level: "LOW" | "MEDIUM" | "HIGH"
}

export interface Activity {
  id: string
  activity_type: ActivityType
  user: { id: string; name: string }
  area: { id: string; name: string }
  metadata: Record<string, any>
  media_url?: string
  location?: { lat: number; lng: number }
  created_at: string
}

export interface Stats {
  total_activities: number
  waste_classification_count: number
  green_meal_count: number
  electricity_kwh: number
  totalWaste: number
  totalHouseholds: number
  avgPlastic: number
}

export interface WasteReport {
  id: string
  description: string
  area: { id: string; name: string }
  lat: number
  lng: number
  status: "pending" | "assigned" | "collected"
  assigned_collector?: { id: string; name: string } | null
  reported_at: string
  household_id?: string
}

export interface ActivityResponse {
  data: Activity[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface AreaDetailResponse {
  area: Area
  wasteTrend: { date: string; value: number }[]
  plasticTrend: { month: string; value: number }[]
  electricityTrend: { date: string; value: number }[]
}


export const mockData = {
  stats: {
    total_activities: 247,
    waste_classification_count: 89,
    green_meal_count: 156,
    electricity_kwh: 1842,
    totalWaste: 11500,
    totalHouseholds: 320,
    avgPlastic: 42,
  } as Stats,
  areas: [
    { id: 'a1', name: 'Zone A', total_households: 120, total_waste: 6000, plastic_percentage: 55, electricity_usage: 20000, risk_level: 'HIGH' as const },
    { id: 'a2', name: 'Zone B', total_households: 80, total_waste: 1800, plastic_percentage: 30, electricity_usage: 12000, risk_level: 'LOW' as const },
    { id: 'a3', name: 'Zone C', total_households: 120, total_waste: 3700, plastic_percentage: 40, electricity_usage: 22000, risk_level: 'MEDIUM' as const },
  ] as Area[],
  activities: [
    { id: 'act-1', activity_type: 'GREEN_MEAL' as ActivityType, user: { id: 'u1', name: 'Nguyen Van A' }, area: { id: 'a1', name: 'Zone A' }, metadata: {}, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'act-2', activity_type: 'WASTE_CLASSIFICATION' as ActivityType, user: { id: 'u2', name: 'Tran Thi B' }, area: { id: 'a2', name: 'Zone B' }, metadata: {}, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'act-3', activity_type: 'ELECTRICITY_USAGE' as ActivityType, user: { id: 'u3', name: 'Le Van C' }, area: { id: 'a1', name: 'Zone A' }, metadata: {}, created_at: new Date(Date.now() - 10800000).toISOString() },
    { id: 'act-4', activity_type: 'GREEN_MEAL' as ActivityType, user: { id: 'u4', name: 'Pham Thi D' }, area: { id: 'a3', name: 'Zone C' }, metadata: {}, created_at: new Date(Date.now() - 14400000).toISOString() },
    { id: 'act-5', activity_type: 'WASTE_CLASSIFICATION' as ActivityType, user: { id: 'u5', name: 'Hoang Van E' }, area: { id: 'a2', name: 'Zone B' }, metadata: {}, created_at: new Date(Date.now() - 18000000).toISOString() },
  ] as Activity[],
  wasteTrend: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10),
    value: Math.round(150 + Math.random() * 100),
  })),
  electricityTrend: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10),
    value: Math.round(600 + Math.random() * 200),
  })),
}

export const activityService = {
  getAreas: async (): Promise<Area[]> => {
    const data = await apiGet<{ data?: Area[] }>('/areas')
    return data?.data || mockData.areas
  },

  getActivities: async (params: {
    page?: number
    limit?: number
    area_id?: string
    activity_type?: ActivityType | "" | undefined
    sort?: "newest" | "oldest"
  } = {}): Promise<ActivityResponse> => {
    const data = await apiGet<ActivityResponse>('/activities')
    if (data?.data) return data
    return { data: mockData.activities.slice(0, params.limit || 10), pagination: { page: 1, limit: 10, total: mockData.activities.length } }
  },

  getOverview: async (): Promise<Stats> => {
    const data = await apiGet<Stats>('/activities/stats')
    return data || mockData.stats
  },

  getStats: async () => {
    return mockData.stats
  },

  getHeatmap: async () => {
    return []
  },

  getAreaDetail: async (areaId: string): Promise<AreaDetailResponse | null> => {
    const area = mockData.areas.find(a => a.id === areaId) || mockData.areas[0]
    return {
      area,
      wasteTrend: mockData.wasteTrend,
      plasticTrend: [
        { month: 'Jan', value: area.plastic_percentage - 5 },
        { month: 'Feb', value: area.plastic_percentage - 2 },
        { month: 'Mar', value: area.plastic_percentage },
      ],
      electricityTrend: mockData.electricityTrend,
    }
  },

  getWasteReports: async (params?: { status?: string }) => {
    return []
  },

  assignCollector: async (reportId: string, collector: { id: string; name: string }) => {
    throw new Error('Not implemented')
  },

  updateReportStatus: async (reportId: string, status: "pending" | "assigned" | "collected") => {
    throw new Error('Not implemented')
  },
}

export interface Campaign {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  status: 'active' | 'upcoming' | 'ended'
  participant_count: number
  target_participants: number
  cover_image?: string
  created_at: string
}

export interface CampaignStats {
  total_campaigns: number
  active_campaigns: number
  total_participants: number
  avg_participation_rate: number
}

export const campaignService = {
  getCampaigns: async (): Promise<Campaign[]> => {
    const data = await apiGet<{ data?: Campaign[] }>('/campaigns')
    return data?.data || []
  },

  getCampaignStats: async (): Promise<CampaignStats> => {
    const data = await apiGet<CampaignStats>('/campaigns/stats')
    return data || { total_campaigns: 0, active_campaigns: 0, total_participants: 0, avg_participation_rate: 0 }
  },
}

export interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: string
  created_at: string
}

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const data = await apiGet<{ data?: User[] }>('/auth/get-alls')
    return data?.data || []
  },

  getUserStats: async () => {
    return { total_users: 0, new_users_this_month: 0, active_users: 0 }
  },
}

export interface BlogStats {
  total_blogs: number
  total_comments: number
  total_likes: number
}

export const blogService = {
  getStats: async (): Promise<BlogStats> => {
    return { total_blogs: 0, total_comments: 0, total_likes: 0 }
  },
}