import { Card, CardContent } from "@/components/ui/card"
import { Users, Recycle, Utensils, Activity } from "lucide-react"

interface StatItem {
  title: string
  value: string
  change: string
  trend: "up" | "down"
}

interface StatsCardsProps {
  data?: StatItem[]
  loading?: boolean
}

const defaultStats = [
  {
    title: "Total Users",
    value: "0",
    change: "0%",
    trend: "up" as const,
    icon: Users,
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "Total Activities",
    value: "0",
    change: "0%",
    trend: "up" as const,
    icon: Activity,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Waste Classified",
    value: "0",
    change: "0%",
    trend: "up" as const,
    icon: Recycle,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    title: "Green Meals",
    value: "0",
    change: "0%",
    trend: "up" as const,
    icon: Utensils,
    color: "from-cyan-500 to-blue-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
]

export function StatsCards({ data, loading = false }: StatsCardsProps) {
  const stats = data && data.length === 4 ? data.map((item, index) => ({
    ...defaultStats[index],
    ...item,
  })) : defaultStats

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.title}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <Card className="group relative overflow-hidden bg-card border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">

              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />


              <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${stat.bgColor} opacity-50 group-hover:scale-150 transition-transform duration-500`} />

              <CardContent className="p-6 relative">
                {loading ? (
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-muted animate-pulse rounded-xl" />
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stat.trend === "up"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400"
                        }`}>
                        {stat.change}
                      </span>
                    </div>

                    <div className="mt-6">
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
                    </div>


                    <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${stat.color} transition-all duration-500`}
                        style={{ width: stat.trend === "up" ? "75%" : "45%" }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}