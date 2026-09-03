import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  countUnreadMailboxNotices,
  listMailboxNoticesForProfile,
} from "@/lib/loghouse/mailboxNotices";
import { listProfilesAndActiveProfileId, profileByIdForViewer } from "@/lib/profile/activeProfile";
import { isP0IdentityReadAuthorityEnabled } from "@/lib/account/p0IdentityReadAuthorityGate";
import { assertProfileBelongsToIdentity } from "@/lib/diary/diaryIdentityAuthority";
import { resolveValueIdentityOwnership } from "@/lib/value/valueIdentityOwnership";

async function authorizeMailboxProfile(email: string, profileId: string): Promise<boolean> {
  if (!isP0IdentityReadAuthorityEnabled()) {
    const p = await profileByIdForViewer(profileId, email);
    return Boolean(p);
  }
  const ownership = await resolveValueIdentityOwnership();
  const authz = await assertProfileBelongsToIdentity({ ownership, profileId });
  return authz.state === "AUTHORIZED";
}

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
    if (!(await authorizeMailboxProfile(email, activeProfileId))) {
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
