import Link from "next/link";

import { FirstVisitLoghouseSignPreviewClient } from "@/components/guide/first-visit/FirstVisitLoghouseSignPreviewClient";
import { assertDevOrAdminPreviewAccess } from "@/lib/preview/assertDevOrAdminPreviewAccess";

export default async function FirstVisitLoghouseSignPreviewPage() {
  await assertDevOrAdminPreviewAccess();

  return (
    <div>
      <FirstVisitLoghouseSignPreviewClient />
      <p className="px-4 pb-8 text-center text-xs text-stone-500">
        <Link href="/preview/first-visit/resident-card" className="underline hover:text-stone-800">
          住民票カードプレビューへ
        </Link>
        {" · "}
        <Link
          href="/preview/first-visit-owl-frame/layout?preset=loghouse-sign"
          className="underline hover:text-stone-800"
        >
          フクロウ枠レイアウト定規へ
        </Link>
        {" · "}
        <Link href="/preview" className="underline hover:text-stone-800">
          校正メニューへ
        </Link>
      </p>
    </div>
  );
}
