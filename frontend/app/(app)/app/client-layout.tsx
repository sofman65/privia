"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { ChatSidebar } from "@/components/chat/ChatSidebar"

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-full min-h-0 overflow-hidden bg-background">
      {/* Sidebar */}
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main area */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
