import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import { prisma } from "@/lib/db";
import { addSupportInquiryMessage } from "@/lib/support/addSupportInquiryMessage";
import { serializeSupportInquiryMessage } from "@/lib/support/serializeSupportInquiryMessage";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "IDが不正です。", code: "BAD_ID" }, { status: 400, ...JSON_NO_STORE });
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

  const message =
    typeof json === "object" && json !== null && "message" in json
      ? String((json as { message: unknown }).message)
      : "";

  const inquiry = await prisma.supportInquiry.findUnique({
    where: { id },
    select: { id: true, status: true, replyChannel: true },
  });

  if (!inquiry) {
    return NextResponse.json(
      { error: "お問い合わせが見つかりません。", code: "NOT_FOUND" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  if (inquiry.replyChannel === "email") {
    return NextResponse.json(
      { error: "このお問い合わせはメール返信専用です。", code: "EMAIL_CHANNEL" },
      { status: 409, ...JSON_NO_STORE },
    );
  }

  if (inquiry.status === "closed") {
    return NextResponse.json(
      { error: "このお問い合わせは終了しています。", code: "INQUIRY_CLOSED" },
      { status: 409, ...JSON_NO_STORE },
    );
  }

  const origin = new URL(req.url).origin;
  const result = await addSupportInquiryMessage({
    inquiryId: inquiry.id,
    role: "admin",
    message,
    authorEmail: auth.adminEmail,
    threadUrl: `${origin}/orders/support/${encodeURIComponent(inquiry.id)}`,
  });

  if (!result.ok) {
    const status =
      result.code === "EMPTY_MESSAGE" || result.code === "MESSAGE_TOO_LONG" ? 400 : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status, ...JSON_NO_STORE });
  }

  const created = await prisma.supportInquiryMessage.findUnique({
    where: { id: result.messageId },
    select: {
      id: true,
      createdAt: true,
      role: true,
      body: true,
      authorEmail: true,
    },
  });

  return NextResponse.json(
    {
      code: "OK",
      message: created ? serializeSupportInquiryMessage(created) : null,
      emailSent: result.emailSent ?? false,
    },
    { status: 201, ...JSON_NO_STORE },
  );
}
