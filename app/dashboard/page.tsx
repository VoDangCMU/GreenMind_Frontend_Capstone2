"use client"

import { useEffect, useState, useCallback } from "react"
import { StatsCards } from "@/components/stats-cards"
import { ChartsSection } from "@/components/charts-section"
import { RecentActivity } from "@/components/recent-activity"
import { HeroStats } from "@/components/hero-stats"
import { activityService, Activity, Stats, Area } from "@/services/activity.service"

interface DashboardStats {
  totalUsers: number
  totalCampaigns: number
  totalActivities: number
  totalWaste: number
  wasteClassificationCount: number
  greenMealCount: number
  electricityKwh: number
  totalHouseholds: number
  avgPlastic: number
}

interface ChartData {
  wasteTrend: { date: string; value: number }[]
  electricityTrend: { date: string; value: number }[]
  plasticTrend: { month: string; value: number }[]
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCampaigns: 0,
    totalActivities: 0,
    totalWaste: 0,
    wasteClassificationCount: 0,
    greenMealCount: 0,
    electricityKwh: 0,
    totalHouseholds: 0,
    avgPlastic: 0,
  })
  const [chartData, setChartData] = useState<ChartData>({
    wasteTrend: [],
    electricityTrend: [],
    plasticTrend: [],
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const [areas, setAreas] = useState<Area[]>([])

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {

      const [overviewRes, activitiesRes, areasRes] = await Promise.all([
        activityService.getOverview().catch(() => null),
        activityService.getActivities({ limit: 10, sort: 'newest' }).catch(() => ({ data: [] })),
        activityService.getAreas().catch(() => []),
      ])


      if (overviewRes) {
        setStats({
          totalUsers: areasRes?.reduce((sum, a) => sum + a.total_households, 0) || 0,
          totalCampaigns: 0,
          totalActivities: overviewRes.total_activities || 0,
          totalWaste: overviewRes.totalWaste || 0,
          wasteClassificationCount: overviewRes.waste_classification_count || 0,
          greenMealCount: overviewRes.green_meal_count || 0,
          electricityKwh: overviewRes.electricity_kwh || 0,
          totalHouseholds: overviewRes.totalHouseholds || 0,
          avgPlastic: overviewRes.avgPlastic || 0,
        })
      }


      setActivities(activitiesRes?.data || [])


      setAreas(areasRes || [])


      if (areasRes && areasRes.length > 0) {
        const areaDetail = await activityService.getAreaDetail(areasRes[0].id).catch(() => null)
        if (areaDetail) {
          setChartData({
            wasteTrend: areaDetail.wasteTrend || [],
            electricityTrend: areaDetail.electricityTrend || [],
            plasticTrend: areaDetail.plasticTrend || [],
          })
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])


  const statsData = [
    {
      title: "Total Users",
      value: stats.totalHouseholds?.toLocaleString() || "0",
      change: stats.totalHouseholds > 0 ? "+5.2%" : "0%",
      trend: stats.totalHouseholds > 0 ? "up" as const : "down" as const,
    },
    {
      title: "Total Activities",
      value: stats.totalActivities?.toLocaleString() || "0",
      change: stats.totalActivities > 0 ? "+12.5%" : "0%",
      trend: stats.totalActivities > 0 ? "up" as const : "down" as const,
    },
    {
      title: "Waste Classified",
      value: stats.wasteClassificationCount?.toLocaleString() || "0",
      change: stats.wasteClassificationCount > 0 ? "+8.1%" : "0%",
      trend: stats.wasteClassificationCount > 0 ? "up" as const : "down" as const,
    },
    {
      title: "Green Meals",
      value: stats.greenMealCount?.toLocaleString() || "0",
      change: stats.greenMealCount > 0 ? "+15.3%" : "0%",
      trend: stats.greenMealCount > 0 ? "up" as const : "down" as const,
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden">

      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30" />
        <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-4 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative p-6 lg:p-8 space-y-8">
        { }
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 lg:p-12 shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                System Online
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Welcome Back
                <span className="block text-emerald-200">Dashboard</span>
              </h1>
              <p className="text-lg text-white/80 max-w-md">
                Explore your GreenMind system metrics and activity in real-time
              </p>
              <div className="flex gap-3 pt-2">
                <button className="px-6 py-2.5 rounded-xl bg-white text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors shadow-lg">
                  View Details
                </button>
                <button className="px-6 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold hover:bg-white/20 transition-colors border border-white/20">
                  Reports
                </button>
              </div>
            </div>
            <HeroStats data={{ activities: stats.totalActivities, households: stats.totalHouseholds, avgPlastic: stats.avgPlastic }} />
          </div>
        </div>

        { }
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          { }
          <div className="lg:col-span-2 space-y-8">
            { }
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <StatsCards data={statsData} loading={loading} />
            </div>

            { }
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <ChartsSection wasteTrend={chartData.wasteTrend} electricityTrend={chartData.electricityTrend} loading={loading} />
            </div>
          </div>

          { }
          <div className="space-y-6">
            { }
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <RecentActivity activities={activities} loading={loading} />
            </div>

            { }
            <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">Areas Overview</h3>
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))
                ) : areas.length > 0 ? (
                  areas.map((area) => (
                    <div
                      key={area.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{area.name}</p>
                        <p className="text-sm text-muted-foreground">{area.total_households} households</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{area.total_waste.toLocaleString()} kg</p>
                        <p className={`text-xs ${area.risk_level === 'HIGH' ? 'text-rose-600' :
                            area.risk_level === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                          {area.risk_level} Risk
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No area data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}