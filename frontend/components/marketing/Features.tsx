import { Database, FolderOpen, Shield, Workflow } from "lucide-react"
import type { ElementType } from "react"

const features: { icon: ElementType; title: string; description: string }[] = [
  {
    icon: Shield,
    title: "Privacy-first by default",
    description:
      "No training on your content. No telemetry. Clear boundaries across teams and workspaces.",
  },
  {
    icon: Database,
    title: "Grounded answers from your data",
    description:
      "Retrieve context from your workspace documents with traceable sources so you can trust what you read.",
  },
  {
    icon: FolderOpen,
    title: "Organized conversations for teams",
    description:
      "Threads, search, and structure that hold up when decisions get revisited and audited.",
  },
  {
    icon: Workflow,
    title: "Built for production workflows",
    description:
      "Predictable behavior, stable interfaces, and a design that scales from pilots to daily use.",
  },
]

export function Features() {
  return (
    <section id="features" className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Built for how teams actually work
          </h2>
          <p className="mt-4 text-muted-foreground">
            Privia is infrastructure, not a toy. Every decision is made to keep
            your workspace reliable, private, and useful over time.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40 md:grid-cols-2">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType
  title: string
  description: string
}) {
  return (
    <div className="bg-background p-8 md:p-10">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border/60">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
