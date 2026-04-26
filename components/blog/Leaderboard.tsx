"use client"

import { LeaderboardUser } from "@/services/blog.service"
import { Trophy } from "lucide-react"

interface Props {
  leaderboard: LeaderboardUser[]
  title?: string
  subtitle?: string
  emptyTitle?: string
  emptySubtitle?: string
  hideAvatar?: boolean
}

const PODIUM_ORDER = [1, 0, 2]
const PODIUM_HEIGHT = ["h-20", "h-28", "h-16"]
const AVATAR_SIZE = ["h-10 w-10", "h-14 w-14", "h-9 w-9"]
const RANK_BG = [
  "bg-slate-100 border-slate-300",
  "bg-amber-50 border-amber-300",
  "bg-orange-50 border-orange-300",
]
const AVATAR_RING = [
  "ring-2 ring-slate-400",
  "ring-4 ring-amber-400",
  "ring-2 ring-orange-400",
]
const LABEL_COLOR = [
  "text-slate-500",
  "text-amber-500 font-bold",
  "text-orange-500",
]

export function Leaderboard({
  leaderboard,
  title = "Contribution Leaderboard",
  subtitle = "Top reporters this period",
  emptyTitle = "No households yet",
  emptySubtitle = "Start tracking to see rankings",
  hideAvatar = false,
}: Props) {
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)
  const hasLeaderboard = leaderboard.length > 0
  const podiumOrder = top3.length === 3 ? PODIUM_ORDER : top3.map((_, index) => index)

  const formatLocation = (location?: string) => location?.split(",")[0]?.trim() || ""
  const getLabel = (user: LeaderboardUser) => formatLocation(user.location) || user.fullName || user.username

  return (
    <aside className="flex flex-col gap-4">
      {/* Header */}
      <div className="px-5 pt-5">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      {hasLeaderboard ? (
        <>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-end justify-center gap-2">
              {podiumOrder.map((idx, pos) => {
                const user = top3[idx]
                if (!user) return null
                return (
                  <div key={user.userId} className="flex flex-col items-center gap-1.5 flex-1">
                    {/* Name / Address */}
                    <p className="text-sm font-semibold text-foreground text-center line-clamp-2 w-full">
                      {getLabel(user)}
                    </p>
                    {user.location && user.fullName && user.location !== user.fullName ? (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 w-full">
                        {user.fullName}
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">{user.reportCount}</p>
                    {user.rank === 1 && (
                      <span className="text-2xl leading-none">🏆</span>
                    )}
                    {!hideAvatar && (
                      <div
                        className={`${AVATAR_SIZE[pos]} rounded-full bg-linear-to-br from-emerald-400 to-teal-500 ${AVATAR_RING[pos]} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                      >
                        {(user.fullName || user.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div
                      className={`w-full rounded-t-lg border ${PODIUM_HEIGHT[pos]} ${RANK_BG[pos]} flex items-center justify-center`}
                    >
                      <span className={`text-xs font-semibold ${LABEL_COLOR[pos]}`}>
                        {user.rank === 1 ? "1st" : user.rank === 2 ? "2nd" : "3rd"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {rest.length > 0 && (
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              {rest.map((user, idx) => (
                <div
                  key={user.userId}
                  className={`flex items-center gap-3 px-4 py-3 text-sm ${idx !== rest.length - 1 ? "border-b border-border/50" : ""} hover:bg-muted/40 transition-colors`}
                >
                  <span className="w-5 text-center text-xs font-bold text-muted-foreground shrink-0">
                    {user.rank}
                  </span>
                  {!hideAvatar && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {(user.fullName || user.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm line-clamp-2">
                      {getLabel(user)}
                    </p>
                    {user.location && user.fullName && user.location !== user.fullName ? (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {user.fullName}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 shrink-0">
                    {user.reportCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
          <p className="text-xs text-muted-foreground mt-1">{emptySubtitle}</p>
        </div>
      )}
    </aside>
  )
}
