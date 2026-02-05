import type { ReactNode } from "react"
import { Suspense } from "react"

import { ChatSidebar } from "@/components/chat/ChatSidebar"
import Loading from "@/app/loading"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar (app-level UI) */}
      <ChatSidebar />

      {/* Main application area */}
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
