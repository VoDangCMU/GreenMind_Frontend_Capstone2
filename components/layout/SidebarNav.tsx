"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  LayoutDashboard,
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Models", href: "/dashboard/tree", icon: TreePine },
  { title: "Questions", href: "/dashboard/questions", icon: MessageSquare },
  { title: "Surveys", href: "/dashboard/survey", icon: FileText },
  { title: "Results", href: "/dashboard/survey-results", icon: Users },
  { title: "Verify", href: "/dashboard/models-verify", icon: CheckCircle },
  { title: "Waste Report", href: "/dashboard/waste-report", icon: MapPin },
  { title: "Giám sát rác", href: "/dashboard/garbage-analytics", icon: MapPin },
  { title: "Env. Impact", href: "/dashboard/environmental-impact", icon: Wind },
  { title: "Household Management", href: "/dashboard/household-management", icon: MapPin },
  { title: "Users", href: "/dashboard/users-ocean", icon: Brain },
  { title: "Blogs", href: "/dashboard/blogs", icon: BookOpen },
]

const modelSurveyItems = [
  { title: "Models", href: "/dashboard/tree", icon: TreePine },
  { title: "Questions", href: "/dashboard/questions", icon: MessageSquare },
  { title: "Surveys", href: "/dashboard/survey", icon: FileText },
  { title: "Results", href: "/dashboard/survey-results", icon: Users },
]

interface SidebarNavProps {
  isMobile?: boolean
}

export function SidebarNav({ isMobile = false }: SidebarNavProps) {
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
    <nav className="flex-1 space-y-1 p-2">
      <Collapsible open={isModelSurveyOpen} onOpenChange={setIsModelSurveyOpen}>
        <div className="space-y-1">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              title="Models / Survey"
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200 min-w-0",
                isModelSurveyActive
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <FileText
                className={cn(
                  "h-5 w-5 shrink-0",
                  isModelSurveyActive ? "text-primary" : "text-slate-400"
                )}
              />

              <span
                className={cn(
                  "flex-1 truncate whitespace-nowrap overflow-hidden text-left",
                  "opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-150 delay-75",
                  isMobile && "opacity-100"
                )}
              >
                Models / Survey
              </span>

              <span
                className={cn(
                  "shrink-0",
                  "opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-150 delay-75",
                  isMobile && "opacity-100"
                )}
              >
                {isModelSurveyOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent
            className={cn("space-y-1", !isMobile && "hidden group-hover:block")}
          >
            {modelSurveyItems.map((item) => {
              const isActive = pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 pl-10 text-sm font-semibold transition-colors duration-200 min-w-0",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-primary" : "text-slate-400"
                    )}
                  />
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
          </CollapsibleContent>
        </div>
      </Collapsible>

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
            <item.icon
              className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-slate-400")}
            />
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
