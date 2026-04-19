"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"

interface ChartDataPoint {
  date?: string
  month?: string
  value: number
}

interface ChartsSectionProps {
  wasteTrend?: ChartDataPoint[]
  electricityTrend?: ChartDataPoint[]
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-muted-foreground">
            <span style={{ color: entry.color }}>{entry.name}: </span>
            <span className="font-semibold">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ChartsSection({ wasteTrend = [], electricityTrend = [], loading = false }: ChartsSectionProps) {

  const hasData = wasteTrend.length > 0 || electricityTrend.length > 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Waste Trend</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Daily waste over the last 14 days</p>
              </div>
              {wasteTrend.length > 0 && (
                <div className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold dark:bg-emerald-900/50 dark:text-emerald-400">
                  {Math.round(wasteTrend.reduce((sum, d) => sum + d.value, 0) / wasteTrend.length)} kg/day avg
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="h-[280px] flex items-center justify-center">
                <div className="w-full h-full bg-muted animate-pulse rounded-lg" />
              </div>
            ) : hasData ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={wasteTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(162 70% 40%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(162 70% 40%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value?.slice(5) || ''}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Waste"
                    stroke="hsl(162 70% 40%)"
                    strokeWidth={2}
                    fill="url(#wasteGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No waste trend data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Electricity Usage</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Daily electricity consumption (kWh)</p>
              </div>
              {electricityTrend.length > 0 && (
                <div className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold dark:bg-amber-900/50 dark:text-amber-400">
                  {Math.round(electricityTrend.reduce((sum, d) => sum + d.value, 0) / electricityTrend.length)} kWh/day avg
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="h-[280px] flex items-center justify-center">
                <div className="w-full h-full bg-muted animate-pulse rounded-lg" />
              </div>
            ) : hasData ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={electricityTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value?.slice(5) || ''}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Electricity"
                    stroke="hsl(38 92% 50%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(38 92% 50%)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No electricity data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}