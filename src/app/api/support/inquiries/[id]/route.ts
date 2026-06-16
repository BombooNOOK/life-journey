import { NextResponse } from "next/server";

import { normalizeEmail, getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { serializeSupportInquiryMessage } from "@/lib/support/serializeSupportInquiryMessage";
import {
  SUPPORT_INQUIRY_CATEGORY_LABELS,
  SUPPORT_INQUIRY_STATUS_LABELS,
  type SupportInquiryCategory,
  type SupportInquiryStatus,
} from "@/lib/support/supportInquiryTypes";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログインが必要です。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "IDが不正です。", code: "BAD_ID" }, { status: 400, ...JSON_NO_STORE });
  }

  const inquiry = await prisma.supportInquiry.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      email: true,
      category: true,
      status: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          role: true,
          body: true,
          authorEmail: true,
        },
      },
    },
  });

  if (!inquiry) {
    return NextResponse.json(
      { error: "お問い合わせが見つかりません。", code: "NOT_FOUND" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  const email = normalizeEmail(viewerEmail);
  if (inquiry.email !== email) {
    return NextResponse.json({ error: "閲覧権限がありません。", code: "FORBIDDEN" }, { status: 403, ...JSON_NO_STORE });
  }

  const category = inquiry.category as SupportInquiryCategory;
  const status = inquiry.status as SupportInquiryStatus;

  return NextResponse.json(
    {
      code: "OK",
      inquiry: {
        id: inquiry.id,
        createdAt: inquiry.createdAt.toISOString(),
        updatedAt: inquiry.updatedAt.toISOString(),
        category,
        categoryLabel: SUPPORT_INQUIRY_CATEGORY_LABELS[category] ?? inquiry.category,
        status,
        statusLabel: SUPPORT_INQUIRY_STATUS_LABELS[status] ?? inquiry.status,
        canReply: status !== "closed",
        messages: inquiry.messages.map(serializeSupportInquiryMessage),
      },
    },
    { ...JSON_NO_STORE },
  );
}
