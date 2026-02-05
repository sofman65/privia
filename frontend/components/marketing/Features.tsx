import React from "react"
import { Shield, Users, Rocket } from "lucide-react"

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-8 md:grid-cols-3">
        <Feature
          icon={Shield}
          title="Privacy-aware by design"
          description="No training on your data. Clear boundaries. Predictable behavior."
        />
        <Feature
          icon={Users}
          title="Built for teams"
          description="Organize conversations, sources, and decisions in one place."
        />
        <Feature
          icon={Rocket}
          title="Production-ready"
          description="Designed to evolve from demo to real system."
        />
      </div>
    </section>
  )
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border/60 p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
