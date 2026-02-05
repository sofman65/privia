// components/marketing/Footer.tsx
export function Footer() {
    return (
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Privia. All rights reserved.
        </div>
      </footer>
    )
  }
  