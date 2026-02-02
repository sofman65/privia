import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"

interface ChatScrollButtonProps {
  visible: boolean
  onClick: () => void
}

export function ChatScrollButton({ visible, onClick }: ChatScrollButtonProps) {
  if (!visible) return null
  return (
    <Button
      variant="outline"
      size="icon"
      className="absolute bottom-32 right-8 rounded-full shadow-lg z-10"
      onClick={onClick}
    >
      <ArrowDown className="h-4 w-4" />
    </Button>
  )
}
