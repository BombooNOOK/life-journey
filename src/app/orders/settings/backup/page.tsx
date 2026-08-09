import { redirect } from "next/navigation";

import { MyPageBackupSection } from "@/components/orders/MyPageBackupSection";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { ASHIATO_BACKUP_LABEL } from "@/lib/account/residentRegistrationUiCopy";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

export const dynamic = "force-dynamic";

export default async function MyPageSettingsBackupPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/settings/backup");
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title={ASHIATO_BACKUP_LABEL}
        description="あしあと本文・写真などをZIPファイルとして端末に残せます"
      />

      <MyPageBackupSection showHeading={false} />
    </div>
  );
}
