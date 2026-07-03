import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { createGuestSupportInquiry } from "@/lib/support/createGuestSupportInquiry";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

export async function POST(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (viewerEmail) {
    return NextResponse.json(
      {
        error: "ログイン中はログハウスのお問い合わせをご利用ください。",
        code: "USE_MYPAGE",
      },
      { status: 403, ...JSON_NO_STORE },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "JSONが不正です。", code: "BAD_JSON" },
      { status: 400, ...JSON_NO_STORE },
    );
  }

  const email =
    typeof json === "object" && json !== null && "email" in json
      ? String((json as { email: unknown }).email)
      : "";
  const category =
    typeof json === "object" && json !== null && "category" in json
      ? String((json as { category: unknown }).category)
      : "";
  const message =
    typeof json === "object" && json !== null && "message" in json
      ? String((json as { message: unknown }).message)
      : "";

  const result = await createGuestSupportInquiry({ email, category, message });

  if (!result.ok) {
    const status =
      result.code === "INVALID_CATEGORY" ||
      result.code === "EMPTY_MESSAGE" ||
      result.code === "MESSAGE_TOO_LONG" ||
      result.code === "EMPTY_EMAIL" ||
      result.code === "INVALID_EMAIL"
        ? 400
        : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status, ...JSON_NO_STORE });
  }

  return NextResponse.json(
    {
      code: "OK",
      inquiryId: result.inquiryId,
      message: "お問い合わせを受け付けました。",
    },
    { status: 201, ...JSON_NO_STORE },
  );
}
