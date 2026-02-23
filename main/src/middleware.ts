import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If OAuth redirected to root with code or access_token, forward to API callback handler
  const isRootWithAuthParam =
    request.nextUrl.pathname === "/" &&
    (request.nextUrl.searchParams.has("code") ||
      request.nextUrl.searchParams.has("access_token"));

  if (isRootWithAuthParam) {
    return NextResponse.redirect(
      new URL(`/api/auth/callback${request.nextUrl.search}`, request.url),
    );
  }

  // If user or anyone navigates to exactly /test (with or without trailing slash), send to /test/1
  const testRootPaths = ["/test", "/test/"];
  if (testRootPaths.includes(request.nextUrl.pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    return NextResponse.redirect(new URL("/test/1", request.url));
  }

  // Protected routes that require authentication (only /test and /result)
  const protectedPaths = ["/test", "/result"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  // Redirect to auth login if accessing protected route without auth
  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect to test page (now /test/1) if accessing auth pages while logged in
  const authPaths = ["/login", "/auth/login"];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/test/1", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
};
