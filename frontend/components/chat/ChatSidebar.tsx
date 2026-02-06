"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Logo } from "@/components/logo"
import { Plus, MessageSquare, Trash2, Search, Settings, LogOut } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Conversation, ChatSidebarProps } from "@/types/chat"
import { Sidebar, SidebarBody } from "@/components/ui/sidebar"
import { useUserProfile } from "@/hooks/useUserProfile"
import { clearAuth } from "@/lib/auth"

const formatRelativeTime = (date: Date, nowMs: number) => {
  const diff = nowMs - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const defaultHandleLogout = () => {
  clearAuth()
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

export function ChatSidebar({
  conversations = [],
  currentId,
  sidebarOpen,
  setSidebarOpen,
  onNewConversation,
  onDelete,
  onSelect,
  searchQuery = "",
  setSearchQuery,
  handleLogout = defaultHandleLogout,
  onOpenSettings,
}: ChatSidebarProps) {
  const userInfo = useUserProfile()
  const [isMobile, setIsMobile] = useState(false)
  const [nowMs, setNowMs] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const query = window.matchMedia("(max-width: 767px)")
    const update = () => setIsMobile(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  const collapsed = useMemo(() => !sidebarOpen && isMobile, [sidebarOpen, isMobile])

  useEffect(() => {
    // Avoid using Date.now() during the first render to prevent SSR/CSR mismatch
    setNowMs(Date.now())
    const interval = setInterval(() => setNowMs(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const groupedConversations = filtered.reduce((groups, conv) => {
    const nowTime = nowMs ?? 0
    const convDate = new Date(conv.updatedAt)
    const diffTime = nowTime - convDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    let group = "Earlier"
    if (diffDays === 0) group = "Today"
    else if (diffDays === 1) group = "Yesterday"
    else if (diffDays < 7) group = "Last 7 days"
    else if (diffDays < 30) group = "Last 30 days"

    if (!groups[group]) groups[group] = []
    groups[group].push(conv)
    return groups
  }, {} as Record<string, Conversation[]>)

  const groupOrder = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "Earlier"]

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between bg-sidebar text-sidebar-foreground border-r border-sidebar-border/80">
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-4 border-b border-sidebar-border/80",
              collapsed && "justify-center",
            )}
          >
            <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center shadow-sm">
              <Logo className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>

            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="text-sm font-semibold tracking-tight">Privia</span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Online • Workspace assistant
                </span>
              </motion.div>
            )}
          </div>

          <div className="px-3 py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onNewConversation}
                  className={cn(
                    "w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-all shadow-sm",
                    collapsed && "px-0 justify-center"
                  )}
                >
                  <Plus className="h-5 w-5" />
                  {!collapsed && <span className="ml-2">New chat</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  <p>New chat</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {!collapsed && (
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-md bg-sidebar text-sidebar-foreground border-sidebar-border text-sm"
                />
              </div>
            </div>
          )}

          <ScrollArea className="flex-1">
            {groupOrder.map((groupName) => {
              const groupConvs = groupedConversations[groupName]
              if (!groupConvs?.length) return null

              return (
                <div key={groupName} className="px-3 py-2">
                  {!collapsed && (
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                      {groupName}
                    </div>
                  )}

                  {groupConvs.map((conv) => (
                    <Tooltip key={conv.id}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => onSelect(conv.id)}
                          className={cn(
                            "flex items-center rounded-md px-2 py-2 text-sm cursor-pointer transition-all",
                            "hover:bg-sidebar-accent/80",
                            currentId === conv.id && "bg-sidebar-accent border border-sidebar-border",
                            collapsed && "justify-center"
                          )}
                        >
                          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />

                          {!collapsed && (
                            <div className="ml-3 flex-1 truncate">
                              <div className="truncate">{conv.title}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {nowMs ? formatRelativeTime(conv.updatedAt, nowMs) : ""}
                              </div>
                            </div>
                          )}

                          {!collapsed && conversations.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete(conv.id)
                              }}
                              className="ml-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">
                          <p className="max-w-xs truncate">{conv.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </div>
              )
            })}
          </ScrollArea>

          <div className="p-3 border-t border-sidebar-border/80">
            {!collapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent/40 border border-sidebar-border"
              >
                <div className="h-9 w-9 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-xs font-semibold">
                  PR
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{userInfo?.full_name || "Workspace user"}</span>
                  <span className="text-xs text-muted-foreground">{userInfo?.role || "Privia"}</span>
                </div>
              </motion.div>
            ) : (
              <div className="flex justify-center mb-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-9 w-9 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-xs font-semibold cursor-pointer">
                      PR
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{userInfo?.full_name || "Workspace user"}</p>
                    <p className="text-xs text-muted-foreground">{userInfo?.role || "Privia"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            <div className="mt-3 flex flex-col gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all",
                      !collapsed ? "justify-start px-2" : "justify-center px-0"
                    )}
                    onClick={onOpenSettings}
                  >
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span className="ml-2">Preferences</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    <p>Preferences</p>
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
                      !collapsed ? "justify-start px-2" : "justify-center px-0"
                    )}
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    {!collapsed && <span className="ml-2">Sign out</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    <p>Sign out</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
    </TooltipProvider>
  )
}
