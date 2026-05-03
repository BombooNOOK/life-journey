import { NextResponse, type NextRequest } from "next/server";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/order" ||
    pathname.startsWith("/order/") ||
    pathname === "/journal" ||
    pathname.startsWith("/journal/") ||
    pathname === "/orders" ||
    pathname.startsWith("/orders/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  /** PDF API は matcher 外だと Edge を通らずログが出ない。ここで必ず 1 行残す（Vercel の Middleware ログで検索: pdf-mw） */
  if (pathname.startsWith("/api/orders/") && pathname.includes("/pdf")) {
    console.log("[pdf-mw] Edge到達（Node の route より前）", {
      pathname,
      search: request.nextUrl.search,
      method: request.method,
      ljLoggedIn: request.cookies.get("lj_logged_in")?.value === "1",
    });
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const loggedIn = request.cookies.get("lj_logged_in")?.value === "1";
  if (loggedIn) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const returnTo = `${pathname}${search}`;
  if (returnTo.startsWith("/")) {
    loginUrl.searchParams.set("returnTo", returnTo);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/order/:path*",
    "/journal/:path*",
    "/orders/:path*",
    "/admin/:path*",
    "/api/orders/:path*",
  ],
};
