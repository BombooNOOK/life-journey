import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import {
  AdminProfileDeleteError,
  assertDeletableProfileId,
  buildAdminProfileDeletePreview,
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
    typeof json === "object" && json !== null
      ? (json as { targetEmail?: unknown; profileId?: unknown })
      : {};

  try {
    const targetEmail = parseAdminProfileDeleteTargetEmail(body.targetEmail);
    const profileId = assertDeletableProfileId(
      typeof body.profileId === "string" ? body.profileId : "",
    );
    const preview = await buildAdminProfileDeletePreview({ targetEmail, profileId });

    console.info("[admin-profile-delete-preview] ok", {
      adminEmail: admin.adminEmail,
      targetEmail: preview.targetEmail,
      profileId: preview.profileId,
      canDelete: preview.canDelete,
      kanteiCreationDataCount: preview.kanteiCreationDataCount,
    });

    return NextResponse.json({ ok: true, preview }, JSON_NO_STORE);
  } catch (error) {
    if (error instanceof AdminProfileDeleteError) {
      const status = error.code === "PROFILE_NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status, ...JSON_NO_STORE },
      );
    }
    const message = error instanceof Error ? error.message : "プレビューに失敗しました。";
    console.error("[admin-profile-delete-preview] failed", {
      adminEmail: admin.adminEmail,
      error: message,
    });
    return NextResponse.json(
      { error: message, code: "PREVIEW_FAILED" },
      { status: 500, ...JSON_NO_STORE },
    );
  }
}
