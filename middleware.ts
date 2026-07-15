import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isAuthPage = pathname === "/login"
  const isUnauthorizedPage = pathname === "/unauthorized"

  // Redirect authenticated users away from auth pages
  if (isAuthPage && session?.user) {
    return redirectByRole(session.user.role, req.url)
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

function redirectByRole(role: string, reqUrl: string): NextResponse {
  const baseUrl = new URL(reqUrl).origin
  switch (role) {
    case "PLATFORM_SUPER_ADMIN":
      return NextResponse.redirect(new URL("/platform", baseUrl))
    case "SCHOOL_ADMIN":
    case "STAFF_ADMIN":
      return NextResponse.redirect(new URL("/admin", baseUrl))
    case "TEACHER":
      return NextResponse.redirect(new URL("/teacher", baseUrl))
    case "STUDENT":
      return NextResponse.redirect(new URL("/student", baseUrl))
    default:
      return NextResponse.redirect(new URL("/unauthorized", baseUrl))
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
