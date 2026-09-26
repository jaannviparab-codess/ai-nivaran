import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "nvr_session";

// Everything else in the app is part of the authenticated experience.
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);
  const onPublicPath = isPublicPath(pathname);

  if (!hasSession && !onPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && onPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route except static assets and image optimization files.
  matcher: ["/((?!_next/static|_next/image|favicon.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)"],
};
