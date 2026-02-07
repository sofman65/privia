"use client"

import { Logo } from "@/components/logo"
import { Card } from "@/components/ui/card"
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect"
import { motion } from "framer-motion"
import { FileText, Shield, Zap, BookOpen } from "lucide-react"
import { useUserProfile } from "@/hooks/useUserProfile"

type Props = {
  onPromptClick: (prompt: string) => void
}

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

export function EmptyState({ onPromptClick }: Props) {
  const userInfo = useUserProfile()

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
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center max-w-3xl"
      >
        <div className="flex h-28 w-28 items-center justify-center mb-6 overflow-hidden">
          <Logo variant="flower" mode="light" className="h-20 w-auto" />
        </div>

        <TypewriterEffectSmooth words={words} className="mb-3" cursorClassName="bg-accent" />

        <p className="text-muted-foreground text-center mb-8 max-w-xl leading-relaxed">
          A calm workspace for product teams and engineers. Start a conversation, ground answers in your docs,
          and keep everything organized for the team.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
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
                  className="p-4 cursor-pointer hover:bg-accent/10 hover:border-accent/50 transition-all group"
                  onClick={() => onPromptClick(item.prompt)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
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
