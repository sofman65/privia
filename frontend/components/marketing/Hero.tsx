import Link from "next/link"

export function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-28 text-center md:pt-36">
      <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight md:text-6xl md:leading-[1.1]">
        A calm, privacy-first AI workspace{" "}
        <span className="text-muted-foreground">for focused teams.</span>
      </h1>

      <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
        Privia keeps conversations organized and grounds answers in your data —
        with clear boundaries and predictable behavior.
      </p>

      <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/signup"
          className="inline-flex h-11 items-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Get started
        </Link>
        <Link
          href="#features"
          className="inline-flex h-11 items-center rounded-md border border-border/60 px-6 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          Learn more
        </Link>
      </div>
    </section>
  )
}
