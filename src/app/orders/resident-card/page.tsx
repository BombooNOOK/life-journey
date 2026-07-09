import Link from "next/link";
import { redirect } from "next/navigation";

import { LogHouseResidentCardPageContent } from "@/components/orders/LogHouseResidentCardPageContent";
import { LogHouseLoadErrorPanel } from "@/components/orders/LogHouseLoadErrorPanel";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { ensureForestResidentForEmail } from "@/lib/forestResident/forestResidentNumber";
import { LOG_HOUSE_BACK_TO_LABEL } from "@/lib/journal/logHouseLabels";

export const dynamic = "force-dynamic";

export default async function LogHouseResidentCardPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/resident-card");
  }

  let residentCard: Awaited<ReturnType<typeof ensureForestResidentForEmail>> | null = null;
  let fetchError: string | null = null;

  try {
    residentCard = await withPrismaConnectionRetry(() =>
      ensureForestResidentForEmail(viewerEmail),
    );
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "住民票を取得できませんでした。";
  }

  if (fetchError || !residentCard) {
    return (
      <LogHouseLoadErrorPanel
        detail={fetchError ?? "住民票を取得できませんでした。"}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="森の住民票"
        description="あなたの森の住民としてのカードです。おなまえの変更は下のメニューからできます。"
      />

      <LogHouseResidentCardPageContent initialCard={residentCard} />

      <p>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          {LOG_HOUSE_BACK_TO_LABEL}
        </Link>
      </p>
    </div>
  );
}
