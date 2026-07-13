import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  countUnreadMailboxNotices,
  listMailboxNoticesForProfile,
} from "@/lib/loghouse/mailboxNotices";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export async function GET() {
  const email = await getViewerEmailFromCookie();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { activeProfileId, profiles } = await listProfilesAndActiveProfileId(email);
    if (!activeProfileId || profiles.length === 0) {
      return NextResponse.json({ notices: [], unreadCount: 0 });
    }

    const [notices, unreadCount] = await Promise.all([
      listMailboxNoticesForProfile({ email, profileId: activeProfileId }),
      countUnreadMailboxNotices({ email, profileId: activeProfileId }),
    ]);

    return NextResponse.json({ notices, unreadCount });
  } catch (e) {
    console.error("[GET /api/loghouse/mailbox]", e);
    return NextResponse.json({ error: "ポストを読み込めませんでした。" }, { status: 500 });
  }
}
