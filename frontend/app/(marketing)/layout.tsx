import type { ReactNode } from "react"
import { Header } from "@/components/marketing/Header"
import { Footer } from "@/components/marketing/Footer"

export default function MarketingLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  )
}
