// components/marketing/Hero.tsx
import Link from "next/link"
import React from "react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 text-center">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
        A privacy-first AI chat workspace
      </h1>

      <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
        Privia helps teams keep AI conversations organized, grounded in their
        data, and ready for real production use.
      </p>

      <div className="mt-10 flex justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/signup">Start for free</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </section>
  )
}
