import { NextResponse, type NextRequest } from "next/server";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/order" ||
    pathname.startsWith("/order/") ||
    pathname === "/journal" ||
    pathname.startsWith("/journal/") ||
    pathname === "/orders" ||
    pathname.startsWith("/orders/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
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
  matcher: ["/order/:path*", "/journal/:path*", "/orders/:path*"],
};
