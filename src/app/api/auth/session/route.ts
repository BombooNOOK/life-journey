import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const cookieBase = {
  path: "/" as const,
  sameSite: "lax" as const,
  /** 本番 HTTPS（Vercel）で Safari 等がクッキーを落としにくくする */
  secure: process.env.NODE_ENV === "production",
};

export async function GET() {
  const store = await cookies();
  const loggedIn = store.get("lj_logged_in")?.value === "1";
  const rawEmail = store.get("lj_user_email")?.value ?? "";
  const email = rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : null;
  return NextResponse.json({ code: "OK", loggedIn, email });
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSONが不正です。", code: "BAD_JSON" }, { status: 400 });
  }

  const email =
    typeof json === "object" && json !== null && "email" in json
      ? String((json as { email: unknown }).email).trim().toLowerCase()
      : "";

  const res = NextResponse.json({ code: "OK" });
  if (!email) {
    res.cookies.set("lj_logged_in", "", { ...cookieBase, maxAge: 0 });
    res.cookies.set("lj_user_email", "", { ...cookieBase, maxAge: 0 });
    return res;
  }

  res.cookies.set("lj_logged_in", "1", {
    ...cookieBase,
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  res.cookies.set("lj_user_email", encodeURIComponent(email), {
    ...cookieBase,
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ code: "OK" });
  res.cookies.set("lj_logged_in", "", { ...cookieBase, maxAge: 0 });
  res.cookies.set("lj_user_email", "", { ...cookieBase, maxAge: 0 });
  return res;
}
