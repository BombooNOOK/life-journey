import { NextResponse } from "next/server";

const DEFAULT_FROM = "BambooNOOK <onboarding@resend.dev>";

type Body = { email?: string };

/** 新規登録完了のお知らせメール（Resend 設定時のみ送信） */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ sent: false, skipped: true, reason: "RESEND_API_KEY not configured" });
  }

  const from = process.env.RESEND_FROM?.trim() || DEFAULT_FROM;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://life-journey-zeta.vercel.app";

  const html = `
    <div style="font-family: sans-serif; line-height: 1.7; color: #44403c; max-width: 32rem;">
      <p style="font-size: 16px;">Life Journey Diary へご登録いただき、ありがとうございます。</p>
      <p style="font-size: 16px;">アカウントの作成が完了しました。スマホのホーム画面に追加すると、アプリのようにすぐ開けます。</p>
      <p style="font-size: 16px;">
        <a href="${appUrl}/help/home-screen" style="color: #065f46;">ホーム画面に追加する方法</a>
      </p>
      <p style="font-size: 14px; color: #78716c;">BambooNOOK / Life Journey Diary</p>
    </div>
  `.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "【BambooNOOK】Life Journey Diary へのご登録ありがとうございます",
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[welcome-email] Resend error:", res.status, detail);
      return NextResponse.json({ sent: false, error: "send failed" }, { status: 502 });
    }

    return NextResponse.json({ sent: true });
  } catch (e) {
    console.error("[welcome-email]", e);
    return NextResponse.json({ sent: false, error: "send failed" }, { status: 502 });
  }
}
