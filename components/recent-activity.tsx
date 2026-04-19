import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Recycle, Utensils, Zap, Trash, FileText } from "lucide-react"
import { Activity, ActivityType } from "@/services/activity.service"

interface RecentActivityProps {
  activities?: Activity[]
  loading?: boolean
}

const activityConfig: Record<ActivityType, { icon: typeof Recycle; label: string; badge: string; dot: string }> = {
  WASTE_CLASSIFICATION: {
    icon: Recycle,
    label: "Waste",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  GREEN_MEAL: {
    icon: Utensils,
    label: "Meal",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400",
    dot: "bg-teal-500",
  },
  ELECTRICITY_USAGE: {
    icon: Zap,
    label: "Electricity",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  TRASH_DISPOSAL: {
    icon: Trash,
    label: "Disposal",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  NOTE: {
    icon: FileText,
    label: "Note",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
    dot: "bg-blue-500",
  },
}

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  } catch {
    return "Unknown"
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function RecentActivity({ activities = [], loading = false }: RecentActivityProps) {
  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Latest actions from your community</p>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {activities.length} activities
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-border">
                <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="divide-y divide-border">
            {activities.map((activity, index) => {
              const config = activityConfig[activity.activity_type] || activityConfig.NOTE
              const ActivityIcon = config.icon
              const initials = getInitials(activity.user?.name || 'U')

              return (
                <div
                  key={activity.id}
                  className="animate-fade-in-up flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  { }
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-semibold">
                      {initials}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${config.dot}`} />
                  </div>

                  { }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {activity.user?.name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                      <ActivityIcon className="w-3.5 h-3.5" />
                      {activity.area?.name || 'Unknown Area'}
                    </p>
                  </div>

                  { }
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(activity.created_at)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs px-2 py-0.5 ${config.badge} flex items-center gap-1`}
                    >
                      <ActivityIcon className="w-3 h-3" />
                      {config.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No recent activities</p>
          </div>
        )}

        { }
        <div className="p-4 border-t border-border bg-muted/20">
          <button className="w-full py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors font-medium">
            View all activity
          </button>
        </div>
      </CardContent>
    </Card>
  )
}