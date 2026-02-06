import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup")
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.includes("favicon")

  if (isPublicAsset) {
    return NextResponse.next()
  }

  // TEMP: frontend-only auth signal
  const hasAuthCookie = req.cookies.has("auth-token")

  // If user is not authenticated, redirect to login
  if (!hasAuthCookie && !isAuthRoute) {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user IS authenticated and tries to access login/signup, send them to the app
  if (hasAuthCookie && isAuthRoute) {
    const appUrl = new URL("/app", req.url)
    return NextResponse.redirect(appUrl)
  }

  // If user hits root while authenticated, nudge to app shell
  if (hasAuthCookie && pathname === "/") {
    const appUrl = new URL("/app", req.url)
    return NextResponse.redirect(appUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
