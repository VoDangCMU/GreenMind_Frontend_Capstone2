"use client"

import Link from "next/link"
import { Menu, Leaf, Bell, Moon, Sun, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/AuthContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut } from "lucide-react"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      <div className="flex h-[60px] items-center justify-between px-4 lg:px-6">

        <div className="flex items-center gap-3">

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 lg:hidden">
                <Menu className="h-5 w-5 text-foreground" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-64">
              <div className="flex h-[60px] items-center px-5 border-b border-border/50">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-sm">
                    <Leaf className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    GreenMind
                  </span>
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <SidebarNav isMobile={true} isExpanded={true} />
              </div>
            </SheetContent>
          </Sheet>


          <div className="hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="h-10 w-[280px] pl-10 pr-4 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-background transition-all"
              />
            </div>
          </div>
        </div>


        <div className="flex items-center gap-1">

          <Button variant="ghost" size="icon" className="h-10 w-10 md:hidden">
            <Search className="h-5 w-5" />
          </Button>


          <Button variant="ghost" size="icon" className="relative h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
          </Button>


          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}


          <div className="h-8 w-px bg-border/50 mx-2 hidden lg:block" />


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-2 gap-3 hover:bg-muted transition-colors">
                <Avatar className="h-9 w-9 ring-2 ring-emerald-500/20">
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                    {user?.fullName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline text-sm font-medium text-foreground">
                  {user?.fullName?.split(' ')[0] || "Account"}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 p-2">

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 mb-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
                  <span className="text-lg font-bold text-white">
                    {user?.fullName?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.fullName || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                <Link href="/dashboard/profile" className="flex items-center gap-3 w-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                <Link href="/dashboard/settings" className="flex items-center gap-3 w-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem onClick={logout} className="cursor-pointer rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                <LogOut className="mr-3 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}