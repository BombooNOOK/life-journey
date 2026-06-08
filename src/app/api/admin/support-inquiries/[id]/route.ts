import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import { prisma } from "@/lib/db";
import { isSupportInquiryStatus } from "@/lib/support/supportInquiryTypes";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
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
    return NextResponse.json({ error: "JSONが不正です。", code: "BAD_JSON" }, { status: 400, ...JSON_NO_STORE });
  }

  const status =
    typeof json === "object" && json !== null && "status" in json
      ? String((json as { status: unknown }).status)
      : "";

  if (!isSupportInquiryStatus(status)) {
    return NextResponse.json(
      { error: "ステータスが不正です。", code: "INVALID_STATUS" },
      { status: 400, ...JSON_NO_STORE },
    );
  }

  const existing = await prisma.supportInquiry.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "お問い合わせが見つかりません。", code: "NOT_FOUND" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  const updated = await prisma.supportInquiry.update({
    where: { id },
    data: { status },
    select: { id: true, status: true, updatedAt: true },
  });

  return NextResponse.json({ code: "OK", inquiry: updated }, { ...JSON_NO_STORE });
}
