"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Logo } from "@/components/logo"
import { Card } from "@/components/ui/card"
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect"
import { motion } from "framer-motion"
import { FileText, Shield, Zap, BookOpen } from "lucide-react"
import { useUserProfile } from "@/hooks/useUserProfile"
import type { EmptyStateProps } from "@/types/chat"

const starterPrompts = [
  {
    icon: FileText,
    title: "Summarize a thread",
    prompt: "Summarize the last customer support conversation into key decisions and next steps.",
  },
  {
    icon: Shield,
    title: "Policy reminder",
    prompt: "Draft a short reminder on how we handle customer data retention across workspaces.",
  },
  {
    icon: BookOpen,
    title: "Product handoff",
    prompt: "Turn these release notes into a concise update for engineering managers.",
  },
  {
    icon: Zap,
    title: "Follow-up email",
    prompt: "Write a calm follow-up email recapping our meeting and the agreed actions.",
  },
]

export function EmptyState({ onPromptClick }: EmptyStateProps) {
  const userInfo = useUserProfile()
  const { resolvedTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  useEffect(() => setThemeMounted(true), [])
  const logoMode = themeMounted && resolvedTheme === "dark" ? "dark" : "light"

  const words = userInfo?.full_name
    ? [
        {
          text: "Welcome",
        },
        {
          text: userInfo.full_name,
        },
      ]
    : [
        {
          text: "Welcome",
        },
      ]

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-4 py-2 md:px-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-3xl flex-col items-center"
      >
        <div className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden md:mb-6 md:h-28 md:w-28">
          <Logo variant="flower" mode={logoMode} className="h-14 w-auto md:h-20" />
        </div>

        <TypewriterEffectSmooth words={words} className="mb-2 md:mb-3" cursorClassName="bg-accent" />

        <p className="mb-3 max-w-xl text-center text-sm leading-relaxed text-muted-foreground line-clamp-2 md:mb-8 md:text-base md:line-clamp-none">
          A calm workspace for product teams and engineers. Start a conversation, ground answers in your docs,
          and keep everything organized for the team.
        </p>

        <div className="grid w-full max-w-2xl grid-cols-2 gap-2 md:grid-cols-2 md:gap-4">
          {starterPrompts.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card
                  className="group flex min-h-14 cursor-pointer items-center justify-center p-2.5 transition-all hover:border-accent/50 hover:bg-accent/10 md:min-h-0 md:block md:p-4"
                  onClick={() => onPromptClick(item.prompt)}
                >
                  <div className="flex h-full items-center justify-center gap-2 md:items-start md:justify-start md:gap-3">
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-accent group-hover:text-accent-foreground md:flex">
                      <Icon className="h-3.5 w-3.5 md:h-5 md:w-5" />
                    </div>
                    <div className="min-w-0 text-center md:flex-1 md:text-left">
                      <h3 className="mb-0.5 text-xs font-semibold leading-snug md:mb-1 md:text-sm">{item.title}</h3>
                      <p className="hidden text-xs text-muted-foreground md:line-clamp-2 md:block">{item.prompt}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
