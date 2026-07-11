import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isAuthPage = pathname === "/login"
  const isUnauthorizedPage = pathname === "/unauthorized"

  // Redirect authenticated users away from auth pages
  if (isAuthPage && session?.user) {
    return redirectByRole(session.user.role)
  }

  // Allow access to unauthorized page
  if (isUnauthorizedPage) {
    return NextResponse.next()
  }

  // Protect dashboard routes
  if (pathname.startsWith("/admin") || 
      pathname.startsWith("/platform") ||
      pathname.startsWith("/teacher") ||
      pathname.startsWith("/student")) {
    
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Check role-based access
    if (pathname.startsWith("/admin")) {
      if (!["SCHOOL_ADMIN", "STAFF_ADMIN", "PLATFORM_SUPER_ADMIN"].includes(session.user.role)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    if (pathname.startsWith("/platform")) {
      if (session.user.role !== "PLATFORM_SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    if (pathname.startsWith("/teacher")) {
      if (session.user.role !== "TEACHER") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    if (pathname.startsWith("/student")) {
      if (session.user.role !== "STUDENT") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }
  }

  return NextResponse.next()
})

function redirectByRole(role: string): NextResponse {
  switch (role) {
    case "PLATFORM_SUPER_ADMIN":
      return NextResponse.redirect(new URL("/platform", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
    case "SCHOOL_ADMIN":
    case "STAFF_ADMIN":
      return NextResponse.redirect(new URL("/admin", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
    case "TEACHER":
      return NextResponse.redirect(new URL("/teacher", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
    case "STUDENT":
      return NextResponse.redirect(new URL("/student", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
    default:
      return NextResponse.redirect(new URL("/unauthorized", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
