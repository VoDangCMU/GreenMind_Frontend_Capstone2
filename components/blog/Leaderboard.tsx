"use client"

import { LeaderboardUser } from "@/services/blog.service"

interface Props {
  leaderboard: LeaderboardUser[]
}

// Podium order: 2nd (left), 1st (center/tall), 3rd (right)
const PODIUM_ORDER = [1, 0, 2] // indexes into top3 array

const PODIUM_HEIGHT = ["h-20", "h-28", "h-16"]   // bar heights (center tallest)
const AVATAR_SIZE = ["h-10 w-10", "h-14 w-14", "h-9 w-9"]
const RANK_LABEL = ["2nd", "1st", "3rd"]

const RANK_BG = [
  "bg-slate-100 border-slate-300",     // 2nd
  "bg-amber-50 border-amber-300",      // 1st
  "bg-orange-50 border-orange-300",    // 3rd
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

export function Leaderboard({ leaderboard }: Props) {
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <aside className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-foreground">Contribution Leaderboard</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Top reporters this period</p>
      </div>

      {/* Podium */}
      {top3.length >= 3 && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-end justify-center gap-2">
            {PODIUM_ORDER.map((idx, pos) => {
              const user = top3[idx]
              if (!user) return null
              return (
                <div key={user.userId} className="flex flex-col items-center gap-1.5 flex-1">
                  {/* Name */}
                  <p className="text-xs font-semibold text-foreground text-center line-clamp-1 w-full">
                    {(user.fullName || user.username).split(" ").slice(-1)[0]}
                  </p>
                  {/* Report count */}
                  <p className="text-xs text-muted-foreground">{user.reportCount}</p>
                  {/* Trophy for 1st place */}
                  {pos === 1 && (
                    <span className="text-2xl leading-none">🏆</span>
                  )}
                  {/* Avatar */}
                  <div
                    className={`${AVATAR_SIZE[pos]} rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 ${AVATAR_RING[pos]} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                  >
                    {(user.fullName || user.username).charAt(0).toUpperCase()}
                  </div>
                  {/* Podium bar */}
                  <div
                    className={`w-full rounded-t-lg border ${PODIUM_HEIGHT[pos]} ${RANK_BG[pos]} flex items-center justify-center`}
                  >
                    <span className={`text-xs font-semibold ${LABEL_COLOR[pos]}`}>
                      {RANK_LABEL[pos]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Ranks 4–10 */}
      {rest.length > 0 && (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          {rest.map((user, idx) => (
            <div
              key={user.userId}
              className={`flex items-center gap-3 px-4 py-3 text-sm ${idx !== rest.length - 1 ? "border-b border-border/50" : ""
                } hover:bg-muted/40 transition-colors`}
            >
              <span className="w-5 text-center text-xs font-bold text-muted-foreground shrink-0">
                {user.rank}
              </span>
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {(user.fullName || user.username).charAt(0).toUpperCase()}
              </div>
              <p className="flex-1 font-medium text-foreground truncate text-xs">
                {user.fullName || user.username}
              </p>
              <span className="text-xs font-semibold text-emerald-600 shrink-0">
                {user.reportCount}
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
