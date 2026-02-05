import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// TODO: enforce auth redirects when backend session is ready.
export function proxy(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
}
