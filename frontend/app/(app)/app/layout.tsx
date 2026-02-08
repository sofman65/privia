import type { ReactNode } from "react"
import { Suspense } from "react"
import Loading from "@/app/loading"
import ClientLayout from "./client-layout"

export const dynamic = "force-dynamic"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <ClientLayout>{children}</ClientLayout>
    </Suspense>
  )
}
