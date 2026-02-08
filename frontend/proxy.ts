import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes that don't require authentication
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup")
  const isMarketingRoute = pathname === "/"
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.includes("favicon")

  if (isPublicAsset) {
    return NextResponse.next()
  }

  // TEMP: frontend-only auth signal
  const hasAuthCookie = req.cookies.has("auth-token")

  // Marketing landing is always accessible; authenticated users go to the app
  if (isMarketingRoute) {
    if (hasAuthCookie) {
      const appUrl = new URL("/app", req.url)
      return NextResponse.redirect(appUrl)
    }
    return NextResponse.next()
  }

  // If user IS authenticated and tries to access login/signup, send them to the app
  if (hasAuthCookie && isAuthRoute) {
    const appUrl = new URL("/app", req.url)
    return NextResponse.redirect(appUrl)
  }

  // Auth routes are accessible when unauthenticated
  if (isAuthRoute) {
    return NextResponse.next()
  }

  // Protected routes: redirect unauthenticated users to login
  if (!hasAuthCookie) {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
