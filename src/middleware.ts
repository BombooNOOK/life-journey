import { NextResponse, type NextRequest } from "next/server";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/order" ||
    pathname.startsWith("/order/") ||
    pathname === "/journal" ||
    pathname.startsWith("/journal/") ||
    pathname === "/orders" ||
    pathname.startsWith("/orders/") ||
    pathname === "/plans" ||
    pathname.startsWith("/plans/") ||
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

  /** 未ログインでも案内ページを表示（ログイン画面へ即リダイレクトしない） */
  if (pathname === "/orders") {
    return NextResponse.next();
  }

  const loggedIn = request.cookies.get("lj_logged_in")?.value === "1";
  if (loggedIn) {
    return NextResponse.next();
  }

  /** `new URL("/login", request.url)` だと Next が host を `localhost` に正規化することがある（127.0.0.1 利用時に Cookie が効かない） */
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
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
    "/plans/:path*",
    "/admin/:path*",
    "/api/orders/:path*",
  ],
};
