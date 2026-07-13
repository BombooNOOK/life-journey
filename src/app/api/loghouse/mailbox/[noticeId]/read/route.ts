import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { markMailboxNoticeRead } from "@/lib/loghouse/mailboxNotices";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

type Params = { params: Promise<{ noticeId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const email = await getViewerEmailFromCookie();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { noticeId } = await params;
    const { activeProfileId, profiles } = await listProfilesAndActiveProfileId(email);
    if (!activeProfileId || profiles.length === 0) {
      return NextResponse.json({ error: "プロフィールがありません。" }, { status: 400 });
    }

    const notice = await markMailboxNoticeRead({
      email,
      profileId: activeProfileId,
      noticeId,
    });
    if (!notice) {
      return NextResponse.json({ error: "お知らせが見つかりません。" }, { status: 404 });
    }

    return NextResponse.json({ notice });
  } catch (e) {
    console.error("[POST /api/loghouse/mailbox/:id/read]", e);
    return NextResponse.json({ error: "既読にできませんでした。" }, { status: 500 });
  }
}
