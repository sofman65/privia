import Link from "next/link"
import { Button } from "@/components/ui/button"

// Simple marketing header with brand and auth links.
export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          Privia
        </Link>

        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Start for free</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
