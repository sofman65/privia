import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import type { ChatSourcesProps } from "@/types/chat"

export function ChatSources({ sources }: ChatSourcesProps) {
  if (!sources || sources.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {sources.slice(0, 3).map((_, i) => (
        <Badge key={i} variant="secondary" className="gap-1 text-xs">
          <FileText className="h-3 w-3" />
          Source {i + 1}
        </Badge>
      ))}
    </div>
  )
}
