"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  TreePine,
  FileText,
  Users,
  MessageSquare,
  Brain,
  CheckCircle,
  MapPin,
  Wind,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Flag,
  LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

const modelSurveyItems: NavItem[] = [
  { title: "Tree Management", href: "/dashboard/tree", icon: TreePine },
  { title: "Questions", href: "/dashboard/questions", icon: MessageSquare },
  { title: "Surveys", href: "/dashboard/survey", icon: FileText },
  { title: "Results", href: "/dashboard/survey-results", icon: Users },
  { title: "Verify", href: "/dashboard/models-verify", icon: CheckCircle },
]

const navItems: NavItem[] = [
  { title: "Environmental Impact", href: "/dashboard/environmental-impact", icon: Wind },
  { title: "Household Management", href: "/dashboard/household-management", icon: MapPin },
  { title: "Users", href: "/dashboard/users-ocean", icon: Brain },
  { title: "Waste Report", href: "/dashboard/waste-report", icon: MapPin },
  { title: "Campaigns", href: "/dashboard/campaign-management", icon: Flag },
  { title: "Community", href: "/dashboard/blogs", icon: BookOpen },
]

interface SidebarNavProps {
  isMobile?: boolean
  isExpanded?: boolean
}

export function SidebarNav({ isMobile = false, isExpanded = false }: SidebarNavProps) {
  const pathname = usePathname()

  const isModelSurveyActive = useMemo(
    () => modelSurveyItems.some((item) => pathname.startsWith(item.href)),
    [pathname]
  )

  const [isModelSurveyOpen, setIsModelSurveyOpen] = useState(isModelSurveyActive)

  useEffect(() => {
    if (isModelSurveyActive) setIsModelSurveyOpen(true)
  }, [isModelSurveyActive])

  return (
    <nav className="flex-1 px-2 py-1">

      <div className={cn("mb-2", isMobile && "")}>
        <Collapsible open={isModelSurveyOpen} onOpenChange={setIsModelSurveyOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-w-0",
                isModelSurveyActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <FileText className={cn("h-[18px] w-[18px] shrink-0", isModelSurveyActive && "text-emerald-600 dark:text-emerald-400")} />

              <span
                className={cn(
                  "flex-1 truncate whitespace-nowrap overflow-hidden text-left text-sm",
                  "transition-all duration-200",
                  (isExpanded || isMobile) ? "opacity-100" : "opacity-0",
                  isModelSurveyActive && "font-medium"
                )}
              >
                Models / Survey
              </span>

              {(isExpanded || isMobile) && (
                <span className="shrink-0">
                  {isModelSurveyOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className={cn("space-y-0.5 pl-4 mt-0.5", !isExpanded && !isMobile && "hidden")}>
            {modelSurveyItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all min-w-0",
                    isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-[16px] w-[16px] shrink-0" />
                  <span className="truncate whitespace-nowrap overflow-hidden text-sm">
                    {item.title}
                  </span>
                </Link>
              )
            })}
          </CollapsibleContent>
        </Collapsible>
      </div>


      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-w-0 mb-0.5",
              isActive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-emerald-600 dark:text-emerald-400")} />

            <span
              className={cn(
                "flex-1 truncate whitespace-nowrap overflow-hidden text-left",
                "transition-all duration-200",
                (isExpanded || isMobile) ? "opacity-100" : "opacity-0",
                isActive && "font-medium"
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