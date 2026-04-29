import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

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
    res.cookies.set("lj_logged_in", "", { path: "/", maxAge: 0, sameSite: "lax" });
    res.cookies.set("lj_user_email", "", { path: "/", maxAge: 0, sameSite: "lax" });
    return res;
  }

  res.cookies.set("lj_logged_in", "1", {
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
  res.cookies.set("lj_user_email", encodeURIComponent(email), {
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ code: "OK" });
  res.cookies.set("lj_logged_in", "", { path: "/", maxAge: 0, sameSite: "lax" });
  res.cookies.set("lj_user_email", "", { path: "/", maxAge: 0, sameSite: "lax" });
  return res;
}
