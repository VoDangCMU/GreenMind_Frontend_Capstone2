"use client"

import Link from "next/link"
import { Leaf } from "lucide-react"
import { SidebarNav } from "./SidebarNav"

export function Sidebar() {
  return (
    <aside
      className={`
        hidden h-full shrink-0 flex-col border-r bg-background lg:flex
        w-16 hover:w-64
        transition-[width] duration-200 ease-in-out
        overflow-hidden
        group
      `}
    >
      {/* LOGO */}
      <div className="flex h-16 items-center border-b px-4 overflow-hidden">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-600">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span
            className="text-lg font-semibold whitespace-nowrap overflow-hidden
              opacity-0 group-hover:opacity-100
              transition-opacity duration-150 delay-75"
          >
            GreenMind
          </span>
        </Link>
      </div>

      <SidebarNav />
    </aside>
  )
}
