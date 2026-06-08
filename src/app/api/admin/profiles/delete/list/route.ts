import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import { loadAdminAccountProfileSummary } from "@/lib/profile/adminAccountProfileSummary";
import {
  AdminProfileDeleteError,
  listAdminProfilesForEmail,
  parseAdminProfileDeleteTargetEmail,
} from "@/lib/profile/adminProfileDelete";

export const runtime = "nodejs";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON が不正です。", code: "BAD_JSON" },
      { status: 400, ...JSON_NO_STORE },
    );
  }

  const body =
    typeof json === "object" && json !== null ? (json as { targetEmail?: unknown }) : {};

  try {
    const targetEmail = parseAdminProfileDeleteTargetEmail(body.targetEmail);
    const [profiles, accountSummary] = await Promise.all([
      listAdminProfilesForEmail(targetEmail),
      loadAdminAccountProfileSummary(targetEmail),
    ]);

    console.info("[admin-profile-delete-list] ok", {
      adminEmail: admin.adminEmail,
      targetEmail,
      profileCount: profiles.length,
      isMonitor: accountSummary.isMonitor,
    });

    return NextResponse.json({ ok: true, profiles, accountSummary }, JSON_NO_STORE);
  } catch (error) {
    if (error instanceof AdminProfileDeleteError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400, ...JSON_NO_STORE },
      );
    }
    const message = error instanceof Error ? error.message : "プロフィール一覧の取得に失敗しました。";
    console.error("[admin-profile-delete-list] failed", {
      adminEmail: admin.adminEmail,
      error: message,
    });
    return NextResponse.json(
      { error: message, code: "LIST_FAILED" },
      { status: 500, ...JSON_NO_STORE },
    );
  }
}
