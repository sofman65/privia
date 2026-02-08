import { Hero } from "@/components/marketing/Hero"
import { Features } from "@/components/marketing/Features"

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <Features />

      <section id="privacy" className="border-t border-border/40">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Privacy as infrastructure
          </h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>
              Privia does not train models on your content. Documents,
              conversations, and embeddings stay within your deployment
              boundary.
            </p>
            <p>
              There is no usage profiling and no silent data export. What your
              team puts in is what your team controls.
            </p>
            <p>
              If you choose a managed deployment, the data model remains the
              same: yours.
            </p>
          </div>
        </div>
      </section>

      <section id="docs" className="border-t border-border/40 bg-muted/20">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Documentation that matches the system
          </h2>
          <p className="mt-6 text-muted-foreground">
            Clear operational boundaries, simple mental models, and practical
            guidance for teams who ship.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            (Docs section placeholder — wire this to your docs URL when ready.)
          </p>
        </div>
      </section>

      <section id="terms" className="border-t border-border/40">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Terms
          </h2>
          <p className="mt-6 text-muted-foreground">
            This section is intentionally brief for now. Add your terms and
            acceptable use policy before production rollout.
          </p>
        </div>
      </section>
    </>
  )
}
