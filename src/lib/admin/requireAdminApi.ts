import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

export type AdminApiAuthResult =
  | { ok: true; adminEmail: string }
  | { ok: false; response: NextResponse };

export async function requireAdminApi(): Promise<AdminApiAuthResult> {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "ログインが必要です。", code: "AUTH_REQUIRED" },
        { status: 401, ...JSON_NO_STORE },
      ),
    };
  }
  if (!(await isAdminEmail(viewerEmail))) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "管理者のみアクセスできます。", code: "FORBIDDEN" },
        { status: 403, ...JSON_NO_STORE },
      ),
    };
  }
  return { ok: true, adminEmail: viewerEmail };
}
