"use client"

import Link from "next/link"
import { Leaf } from "lucide-react"
import { SidebarNav } from "./SidebarNav"
import { useState, useRef, useEffect } from "react"

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    const handleMouseLeave = () => {
      setIsExpanded(false)
    }

    sidebar.addEventListener('mouseleave', handleMouseLeave)
    return () => sidebar.removeEventListener('mouseleave', handleMouseLeave)
  }, [])

  return (
    <aside
      ref={sidebarRef}
      className={`
        hidden lg:flex flex-col h-full shrink-0
        bg-background border-r border-border/50
        transition-all duration-300 ease-out
        ${isExpanded ? 'w-56' : 'w-16'}
      `}
      onMouseEnter={() => setIsExpanded(true)}
    >

      <div className="flex items-center h-16 px-4 border-b border-border/50 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 min-w-0"
        >

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
            <Leaf className="h-5 w-5 text-white" />
          </div>


          <span
            className={`
              text-base font-semibold whitespace-nowrap text-foreground
              transition-all duration-200
              ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
            `}
          >
            GreenMind
          </span>
        </Link>
      </div>


      <div className="flex-1 pt-4 overflow-y-auto">
        <SidebarNav isExpanded={isExpanded} />
      </div>
    </aside>
  )
}