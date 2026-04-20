"use client"

import Link from "next/link"
import { Menu, Leaf, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { UserNav } from "@/components/layout/UserNav"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { Input } from "@/components/ui/input"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/60 backdrop-blur-xl px-6 md:px-10 lg:px-14">
      <div className="flex items-center gap-6">
        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 hover:bg-muted/50 rounded-lg"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
            <div className="flex h-16 items-center border-b px-6">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold tracking-tight">GreenMind</span>
              </Link>
            </div>
            <SidebarNav isMobile={true} />
          </SheetContent>
        </Sheet>

        {/* Search Bar */}
        <div className="hidden md:flex items-center w-64 lg:w-80">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 h-9 bg-muted/40 border-transparent focus:bg-muted/60 focus:border-border/50 rounded-lg text-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-muted/50 rounded-lg"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500" />
          <span className="sr-only">Notifications</span>
        </Button>

        <UserNav />
      </div>
    </header>
  )
}
