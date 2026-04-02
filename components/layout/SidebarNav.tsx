"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  TreePine,
  FileText,
  Users,
  MessageSquare,
  Brain,
  CheckCircle,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Models", href: "/dashboard/tree", icon: TreePine },
  { title: "Questions", href: "/dashboard/questions", icon: MessageSquare },
  { title: "Surveys", href: "/dashboard/survey", icon: FileText },
  { title: "Results", href: "/dashboard/survey-results", icon: Users },
  { title: "Verify", href: "/dashboard/models-verify", icon: CheckCircle },
  { title: "Waste Report", href: "/dashboard/waste-report", icon: MapPin },
  { title: "Giám sát rác", href: "/dashboard/garbage-analytics", icon: MapPin },
  { title: "Quản lý hộ gia đình", href: "/dashboard/household-management", icon: MapPin },
  { title: "Users", href: "/dashboard/users-ocean", icon: Brain },
]

interface SidebarNavProps {
  isMobile?: boolean
}

export function SidebarNav({ isMobile = false }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 p-2">
      {navItems.map(item => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.title}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200 min-w-0",
              isActive
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {/* Icon — luôn hiển thị, canh giữa khi thu */}
            <item.icon
              className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-slate-400")}
            />
            {/* Label — ẩn khi thu, hiện khi hover (dùng group từ Sidebar) */}
            <span
              className={cn(
                "truncate whitespace-nowrap overflow-hidden",
                "opacity-0 group-hover:opacity-100",
                "transition-opacity duration-150 delay-75",
                isMobile && "opacity-100"
              )}
            >
              {item.title}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
