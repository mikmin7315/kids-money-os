import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pass the current pathname/search to server components via request headers.
// Used by requireParentSession() to build ?next= redirects so users return
// to the page that triggered the auth check after logging in.
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-search", request.nextUrl.search);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
