import { Logo } from "@/components/logo"

export default function Loading() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 shadow-lg animate-in fade-in zoom-in-95">
        {/* Brand */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Logo variant="brand" mode="light" className="h-6 w-auto animate-pulse" />
        </div>

        {/* Copy */}
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium text-foreground">
            Loading workspace…
          </span>
          <span className="text-xs text-muted-foreground">
            Preparing your chats
          </span>
        </div>

        {/* Spinner */}
        <span
          className="ml-1 h-4 w-4 rounded-full border-2 border-border/40 border-t-primary animate-spin"
          aria-hidden
        />

        {/* Accessibility */}
        <span className="sr-only">Loading</span>
      </div>
    </div>
  )
}
